const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const JWT_SECRET = process.env.JWT_SECRET;

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

// ─── handlers ─────────────────────────────────────────────────────────────────

// POST /threads
async function createThread(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  const { type, user_ids, petition_id } = body;

  if (!type || !["dm", "group"].includes(type)) {
    return response(400, { error: "type must be dm or group" });
  }

  if (!Array.isArray(user_ids) || user_ids.length < 2) {
    return response(400, { error: "user_ids must have >= 2 members" });
  }

  const thread_id = `thr_${uuidv4().replace(/-/g, "").slice(0, 10)}`;
  const created_at = new Date().toISOString();

  const threadItem = {
    thread_id,
    type,
    user_ids,
    petition_id: petition_id || null,
    created_at,
    last_message: "",
    last_updated: created_at,
  };

  try {
    await ddb.send(new PutCommand({ TableName: "threads", Item: threadItem }));
  } catch (err) {
    console.error("Thread write failed:", err);
    return response(500, { error: "Failed to create thread" });
  }

  // Notify all users
  try {
    await sns.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify({
          type: "new_thread",
          thread_id,
          thread_type: type,
          user_ids,
        }),
        Subject: "New Thread Created",
      })
    );
  } catch (err) {
    console.error("SNS notify failed:", err.message);
  }

  return response(201, { thread_id, type, created_at });
}

// GET /threads
async function getThreads(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const qs = event.queryStringParameters || {};
  const { userId } = qs;

  if (!userId) {
    return response(400, { error: "Missing required param: userId" });
  }

  try {
    const result = await ddb.send(
      new QueryCommand({
        TableName: "threads",
        IndexName: "user_ids-index",
        KeyConditionExpression: "contains(user_ids, :uid)",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );

    // DynamoDB doesn't support contains() in KeyConditionExpression on a list
    // Use a Scan with FilterExpression as a fallback
    // (In production, a dedicated GSI or different data model would be better)
    const scanResult = await ddb.send(
      new QueryCommand({
        TableName: "threads",
        IndexName: "user_ids-index",
        KeyConditionExpression: "user_ids_hash = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    ).catch(async () => {
      // Fallback: scan with filter
      const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
      return ddb.send(
        new ScanCommand({
          TableName: "threads",
          FilterExpression: "contains(user_ids, :uid)",
          ExpressionAttributeValues: { ":uid": userId },
        })
      );
    });

    const threads = (result.Items || []).sort(
      (a, b) =>
        new Date(b.last_updated || 0) - new Date(a.last_updated || 0)
    );

    return response(200, threads);
  } catch (err) {
    console.error("getThreads failed:", err);

    // Final fallback with Scan
    try {
      const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
      const scanResult = await ddb.send(
        new ScanCommand({
          TableName: "threads",
          FilterExpression: "contains(user_ids, :uid)",
          ExpressionAttributeValues: { ":uid": userId },
        })
      );

      const threads = (scanResult.Items || []).sort(
        (a, b) =>
          new Date(b.last_updated || 0) - new Date(a.last_updated || 0)
      );

      return response(200, threads);
    } catch (scanErr) {
      console.error("Scan fallback failed:", scanErr);
      return response(500, { error: "Failed to fetch threads" });
    }
  }
}

// GET /messages/{threadId}
async function getMessages(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const threadId =
    event.pathParameters?.threadId ||
    (event.path || "").split("/").pop();

  const qs = event.queryStringParameters || {};
  const { since } = qs;

  // Verify thread exists and user is a member
  try {
    const threadResult = await ddb.send(
      new GetCommand({ TableName: "threads", Key: { thread_id: threadId } })
    );
    if (!threadResult.Item) {
      return response(404, { error: "thread_id not found" });
    }
    if (!threadResult.Item.user_ids?.includes(decoded.user_id)) {
      return response(401, { error: "User is not a member of this thread" });
    }
  } catch (err) {
    return response(500, { error: "Failed to verify thread membership" });
  }

  const queryParams = {
    TableName: "messages",
    KeyConditionExpression: "thread_id = :tid",
    ExpressionAttributeValues: { ":tid": threadId },
    ScanIndexForward: true, // ascending by timestamp
  };

  if (since) {
    queryParams.FilterExpression = "#ts > :since";
    queryParams.ExpressionAttributeNames = { "#ts": "timestamp" };
    queryParams.ExpressionAttributeValues[":since"] = since;
  }

  try {
    const result = await ddb.send(new QueryCommand(queryParams));
    return response(200, result.Items || []);
  } catch (err) {
    console.error("getMessages failed:", err);
    return response(500, { error: "Failed to fetch messages" });
  }
}

// POST /messages
async function sendMessage(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  const { thread_id, sender_id, content } = body;

  if (!thread_id || !sender_id || !content) {
    return response(400, {
      error: "Missing required fields: thread_id, sender_id, content",
    });
  }

  // Verify thread exists and sender is a member
  let thread;
  try {
    const threadResult = await ddb.send(
      new GetCommand({ TableName: "threads", Key: { thread_id } })
    );
    if (!threadResult.Item) return response(404, { error: "thread_id not found" });
    thread = threadResult.Item;
  } catch (err) {
    return response(500, { error: "Failed to fetch thread" });
  }

  if (!thread.user_ids?.includes(sender_id)) {
    return response(401, { error: "User is not a member of this thread" });
  }

  const message_id = `msg_${uuidv4().replace(/-/g, "").slice(0, 10)}`;
  const timestamp = new Date().toISOString();

  // Write message
  try {
    await ddb.send(
      new PutCommand({
        TableName: "messages",
        Item: {
          message_id,
          thread_id,
          sender_id,
          content,
          timestamp,
          read_by: [sender_id],
        },
      })
    );
  } catch (err) {
    console.error("Message write failed:", err);
    return response(500, { error: "Failed to write message" });
  }

  // Update thread's last_message and last_updated
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: "threads",
        Key: { thread_id },
        UpdateExpression:
          "SET last_message = :content, last_updated = :now",
        ExpressionAttributeValues: {
          ":content": content,
          ":now": timestamp,
        },
      })
    );
  } catch (err) {
    console.error("Thread update failed:", err.message);
  }

  // Push notification to other members
  const recipients = (thread.user_ids || []).filter((id) => id !== sender_id);
  if (recipients.length > 0) {
    try {
      await sns.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify({
            type: "new_message",
            thread_id,
            message_id,
            sender_id,
            content,
            recipients,
          }),
          Subject: "New Message",
        })
      );
    } catch (err) {
      console.error("SNS push notification failed:", err.message);
    }
  }

  return response(201, { message_id, thread_id, sender_id, content, timestamp });
}

// ─── router ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const path = event.path || event.rawPath || "";
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";

  console.log(`${method} ${path}`);

  if (method === "POST" && path.endsWith("/threads")) return createThread(event);
  if (method === "GET" && path.endsWith("/threads")) return getThreads(event);
  if (method === "GET" && path.match(/\/messages\/[^/]+$/)) return getMessages(event);
  if (method === "POST" && path.endsWith("/messages")) return sendMessage(event);

  return response(404, { error: "Route not found" });
};