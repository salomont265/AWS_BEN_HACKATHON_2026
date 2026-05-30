const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

// ─── helpers ─────────────────────────────────────────────────────────────────

function response(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function verifyJWT(event) {
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function defaultHealthProfile() {
  return {
    asthma: false,
    copd: false,
    pollen_allergy: false,
    noise_sensitivity: false,
    age_group: "adult",
  };
}

function defaultThresholds() {
  return {
    aqi: 100,
    noise_db: 75,
    pollen_index: 200,
  };
}

function defaultNotificationPrefs() {
  return {
    noise: true,
    air: true,
    litter: false,
    pollen: true,
    general: true,
    quiet_hours: { start: "22:00", end: "07:00" },
  };
}

// ─── handlers ─────────────────────────────────────────────────────────────────

// POST /users  (no auth required)
async function createUser(event) {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  const { email, password } = body;
  if (!email || !password) {
    return response(400, { error: "Missing required fields: email, password" });
  }

  // Check email uniqueness via GSI
  try {
    const existing = await ddb.send(
      new QueryCommand({
        TableName: "users",
        IndexName: "email-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
        Limit: 1,
      })
    );
    if (existing.Items && existing.Items.length > 0) {
      return response(409, { error: "Email already exists" });
    }
  } catch (err) {
    // If GSI doesn't exist, fall through and let PutItem condition catch it
    console.warn("Email uniqueness check failed:", err.message);
  }

  const user_id = `u_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
  const created_at = new Date().toISOString();

  const userItem = {
    user_id,
    email,
    password_hash: hashPassword(password),
    health: defaultHealthProfile(),
    thresholds: defaultThresholds(),
    neighborhoods: [],
    push_token: null,
    notification_prefs: defaultNotificationPrefs(),
    created_at,
  };

  try {
    await ddb.send(
      new PutCommand({
        TableName: "users",
        Item: userItem,
        ConditionExpression: "attribute_not_exists(user_id)",
      })
    );
  } catch (err) {
    console.error("DynamoDB write failed:", err);
    return response(500, { error: "Failed to create user" });
  }

  const token = jwt.sign({ user_id, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return response(201, { user_id, email, token });
}

// GET /users/{id}
async function getUser(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const userId =
    event.pathParameters?.id ||
    (event.path || "").split("/").pop();

  if (decoded.user_id !== userId) {
    return response(401, { error: "JWT user_id does not match path id" });
  }

  try {
    const result = await ddb.send(
      new GetCommand({ TableName: "users", Key: { user_id: userId } })
    );
    if (!result.Item) return response(404, { error: "user_id not found" });

    // Remove password hash from response
    const { password_hash, ...userPublic } = result.Item;
    return response(200, userPublic);
  } catch (err) {
    console.error("getUser failed:", err);
    return response(500, { error: "Internal server error" });
  }
}

// PUT /users/{id}
async function updateUser(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const userId =
    event.pathParameters?.id ||
    (event.path || "").split("/").pop();

  if (decoded.user_id !== userId) {
    return response(401, { error: "JWT user_id does not match path id" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  // Check user exists
  try {
    const existing = await ddb.send(
      new GetCommand({ TableName: "users", Key: { user_id: userId } })
    );
    if (!existing.Item) return response(404, { error: "User not found" });
  } catch (err) {
    return response(500, { error: "Failed to verify user existence" });
  }

  // Build dynamic UpdateExpression from provided fields only
  const allowedFields = [
    "health",
    "thresholds",
    "neighborhoods",
    "push_token",
    "notification_prefs",
  ];

  const setExpressions = [];
  const exprAttrNames = {};
  const exprAttrValues = {};

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      const attrName = `#${field}`;
      const attrVal = `:${field}`;
      setExpressions.push(`${attrName} = ${attrVal}`);
      exprAttrNames[attrName] = field;
      exprAttrValues[attrVal] = body[field];
    }
  });

  if (setExpressions.length === 0) {
    return response(400, { error: "No valid fields to update" });
  }

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: "users",
        Key: { user_id: userId },
        UpdateExpression: `SET ${setExpressions.join(", ")}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ConditionExpression: "attribute_exists(user_id)",
      })
    );
    return response(200, { user_id: userId, updated: true });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return response(404, { error: "User not found" });
    }
    console.error("UpdateItem failed:", err);
    return response(500, { error: "Internal server error" });
  }
}

// POST /push-token
async function savePushToken(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  const { user_id, token } = body;
  if (!user_id || !token) {
    return response(400, { error: "Missing required fields: user_id, token" });
  }

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: "users",
        Key: { user_id },
        UpdateExpression: "SET push_token = :token",
        ExpressionAttributeValues: { ":token": token },
        ConditionExpression: "attribute_exists(user_id)",
      })
    );
    return response(200, { saved: true });
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return response(404, { error: "User not found" });
    }
    console.error("savePushToken failed:", err);
    return response(500, { error: "Internal server error" });
  }
}

// ─── router ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const path = event.path || event.rawPath || "";
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";

  console.log(`${method} ${path}`);

  if (method === "POST" && path.endsWith("/users")) return createUser(event);
  if (method === "GET" && path.match(/\/users\/[^/]+$/)) return getUser(event);
  if (method === "PUT" && path.match(/\/users\/[^/]+$/)) return updateUser(event);
  if (method === "POST" && path.endsWith("/push-token")) return savePushToken(event);

  return response(404, { error: "Route not found" });
};