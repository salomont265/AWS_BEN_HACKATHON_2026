const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  BatchGetCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const https = require("https");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});
const ses = new SESClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const JWT_SECRET = process.env.JWT_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || "no-reply@enviroguard.app";
const AGREEMENT_THRESHOLD = 10;
const MEETUP_THRESHOLD = parseInt(process.env.MEETUP_THRESHOLD) || 25;

// ─── helpers ─────────────────────────────────────────────────────────────────

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    },
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

function httpsPost(hostname, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(bodyStr),
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error("Anthropic timeout"));
    });
    req.write(bodyStr);
    req.end();
  });
}

async function generatePetitionText(category, neighborhood, count, reports, official) {
  const reportTexts = reports
    .map((r, i) => `${i + 1}. "${r.description || "No description"}"`)
    .join("\n");

  const result = await httpsPost(
    "api.anthropic.com",
    "/v1/messages",
    {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      system: "Draft a formal civic petition. Tone: serious, factual, urgent.",
      messages: [
        {
          role: "user",
          content: `Issue: ${category} in ${neighborhood}. ${count} residents affected.\nReports:\n${reportTexts}\nOfficial: ${official.name}, ${official.district}.`,
        },
      ],
    },
    {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    }
  );

  return result?.content?.[0]?.text || "";
}

// ─── handlers ─────────────────────────────────────────────────────────────────

// POST /petitions
async function createPetition(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT token" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  const { post_id, neighborhood, category, official } = body;
  if (!post_id || !neighborhood || !category || !official) {
    return response(400, {
      error: "Missing required fields: post_id, neighborhood, category, official",
    });
  }

  // Check post exists and has crossed threshold
  let postItem;
  try {
    const postResult = await ddb.send(
      new GetCommand({ TableName: "posts", Key: { post_id } })
    );
    if (!postResult.Item) return response(404, { error: "post_id not found" });
    postItem = postResult.Item;
  } catch (err) {
    return response(500, { error: "Failed to fetch post" });
  }

  if ((postItem.agreement_count || 0) < AGREEMENT_THRESHOLD) {
    return response(400, {
      error: "Post has not crossed agreement threshold",
    });
  }

  // Get all agreers
  let agreers = [];
  try {
    const agreementsResult = await ddb.send(
      new QueryCommand({
        TableName: "agreements",
        KeyConditionExpression: "post_id = :pid",
        ExpressionAttributeValues: { ":pid": post_id },
      })
    );
    agreers = agreementsResult.Items || [];
  } catch (err) {
    return response(500, { error: "Failed to fetch agreers" });
  }

  // Batch read post descriptions from agreers
  let reports = [];
  try {
    // Fetch original post + agreements-linked posts if any
    reports = agreers.map((a) => ({ description: a.description || "" }));
    // Also include the original post description
    if (postItem.description) {
      reports.unshift({ description: postItem.description });
    }
  } catch (err) {
    console.error("Failed to batch fetch posts:", err);
  }

  // Generate petition text via Claude
  let petitionText;
  try {
    petitionText = await generatePetitionText(
      category,
      neighborhood,
      agreers.length,
      reports,
      official
    );
  } catch (err) {
    console.error("Claude API failed:", err);
    return response(500, { error: "Claude API failure" });
  }

  const petition_id = `pet_${uuidv4().replace(/-/g, "").slice(0, 10)}`;
  const created_at = new Date().toISOString();

  const petitionItem = {
    petition_id,
    post_id,
    neighborhood,
    category,
    official,
    petition_text: petitionText,
    signers: agreers.map((a) => a.user_id),
    signature_count: 0,
    status: "draft",
    created_at,
    submitted_at: null,
  };

  try {
    await ddb.send(new PutCommand({ TableName: "petitions", Item: petitionItem }));
  } catch (err) {
    console.error("DynamoDB write failed:", err);
    return response(500, { error: "Failed to save petition" });
  }

  return response(201, {
    petition_id,
    post_id,
    petition_text: petitionText,
    official,
    signature_count: 0,
    status: "draft",
    created_at,
  });
}

// GET /petitions/{id}
async function getPetition(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const petitionId =
    event.pathParameters?.id ||
    (event.path || "").replace(/.*\/petitions\//, "").split("/")[0];

  try {
    const result = await ddb.send(
      new GetCommand({ TableName: "petitions", Key: { petition_id: petitionId } })
    );
    if (!result.Item) return response(404, { error: "petition_id not found" });
    return response(200, result.Item);
  } catch (err) {
    console.error("getPetition failed:", err);
    return response(500, { error: "Internal server error" });
  }
}

// POST /petitions/{id}/sign
async function signPetition(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const pathParts = (event.path || "").split("/");
  const petitionId =
    event.pathParameters?.id ||
    pathParts[pathParts.indexOf("petitions") + 1];

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  const { user_id } = body;

  // Get petition
  let petition;
  try {
    const result = await ddb.send(
      new GetCommand({ TableName: "petitions", Key: { petition_id: petitionId } })
    );
    if (!result.Item) return response(404, { error: "Petition not found" });
    petition = result.Item;
  } catch (err) {
    return response(500, { error: "Failed to fetch petition" });
  }

  // Check already signed
  if (petition.signers && petition.signers.includes(user_id)) {
    return response(400, { error: "User has already signed" });
  }

  const prevCount = petition.signature_count || 0;
  const newCount = prevCount + 1;
  const meetupJustCrossed = prevCount < MEETUP_THRESHOLD && newCount >= MEETUP_THRESHOLD;

  // Update petition
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: "petitions",
        Key: { petition_id: petitionId },
        UpdateExpression:
          "ADD signature_count :inc SET signers = list_append(if_not_exists(signers, :empty), :uid)",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":uid": [user_id],
          ":empty": [],
        },
      })
    );
  } catch (err) {
    console.error("Update petition failed:", err);
    return response(500, { error: "Failed to update petition" });
  }

  let threadId = null;
  let meetupThreadCreated = false;

  if (meetupJustCrossed) {
    threadId = `thr_${uuidv4().replace(/-/g, "").slice(0, 10)}`;
    try {
      await ddb.send(
        new PutCommand({
          TableName: "threads",
          Item: {
            thread_id: threadId,
            type: "group",
            user_ids: petition.signers || [],
            petition_id: petitionId,
            created_at: new Date().toISOString(),
            last_message: "",
            last_updated: new Date().toISOString(),
          },
        })
      );
      meetupThreadCreated = true;

      // Notify signers
      await sns.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify({
            type: "meetup_thread_created",
            petition_id: petitionId,
            thread_id: threadId,
            signers: petition.signers || [],
          }),
          Subject: "Meetup Thread Created",
        })
      );
    } catch (err) {
      console.error("Thread creation or SNS failed:", err.message);
    }
  }

  return response(200, {
    petition_id: petitionId,
    signature_count: newCount,
    user_has_signed: true,
    meetup_thread_created: meetupThreadCreated,
    thread_id: threadId,
  });
}

// POST /petitions/{id}/submit
async function submitPetition(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const pathParts = (event.path || "").split("/");
  const petitionId =
    event.pathParameters?.id ||
    pathParts[pathParts.indexOf("petitions") + 1];

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  // Get petition
  let petition;
  try {
    const result = await ddb.send(
      new GetCommand({ TableName: "petitions", Key: { petition_id: petitionId } })
    );
    if (!result.Item) return response(404, { error: "Petition not found" });
    petition = result.Item;
  } catch (err) {
    return response(500, { error: "Failed to fetch petition" });
  }

  if (petition.status === "submitted") {
    return response(400, { error: "Petition already submitted" });
  }

  if ((petition.signature_count || 0) === 0) {
    return response(400, { error: "Petition still in draft (not enough signatures)" });
  }

  const submitted_at = new Date().toISOString();

  // Send SES email
  try {
    await ses.send(
      new SendEmailCommand({
        Source: SES_FROM_EMAIL,
        Destination: { ToAddresses: [petition.official.email] },
        Message: {
          Subject: {
            Data: `Community Petition: ${petition.category} in ${petition.neighborhood}`,
          },
          Body: {
            Text: {
              Data: `${petition.petition_text}\n\nTotal signatures: ${petition.signature_count}`,
            },
          },
        },
      })
    );
  } catch (err) {
    console.error("SES send failed:", err);
    return response(500, { error: "SES send failure — petition status not updated" });
  }

  // Update petition status
  try {
    await ddb.send(
      new UpdateCommand({
        TableName: "petitions",
        Key: { petition_id: petitionId },
        UpdateExpression: "SET #s = :submitted, submitted_at = :sa",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":submitted": "submitted",
          ":sa": submitted_at,
        },
      })
    );
  } catch (err) {
    console.error("Status update failed:", err);
    return response(500, { error: "Failed to update petition status" });
  }

  // Notify signers
  try {
    await sns.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Message: JSON.stringify({
          type: "petition_submitted",
          petition_id: petitionId,
          signers: petition.signers || [],
          official_email: petition.official.email,
        }),
        Subject: "Petition Submitted",
      })
    );
  } catch (err) {
    console.error("SNS notify failed:", err.message);
  }

  return response(200, {
    petition_id: petitionId,
    status: "submitted",
    submitted_at,
    sent_to: petition.official.email,
  });
}

// ─── router ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const path = event.path || event.rawPath || "";
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";

  console.log(`${method} ${path}`);

  // Handle OPTIONS for CORS preflight
  if (method === "OPTIONS") {
    return response(200, { message: "CORS preflight OK" });
  }

  if (method === "POST" && path.endsWith("/petitions")) return createPetition(event);
  if (method === "GET" && path.match(/\/petitions\/[^/]+$/) && !path.includes("/sign") && !path.includes("/submit")) return getPetition(event);
  if (method === "POST" && path.endsWith("/sign")) return signPetition(event);
  if (method === "POST" && path.endsWith("/submit")) return submitPetition(event);

  return response(404, { error: "Route not found" });
};