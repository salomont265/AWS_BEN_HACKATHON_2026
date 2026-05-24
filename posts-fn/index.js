const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const https = require("https");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const JWT_SECRET = process.env.JWT_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const VALID_CATEGORIES = ["noise", "air", "litter", "pollen", "general"];
const PETITION_THRESHOLD = 10;

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
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("Anthropic request timeout"));
    });
    req.write(bodyStr);
    req.end();
  });
}

async function callClaudeVision(photoUrl) {
  try {
    const result = await httpsPost(
      "api.anthropic.com",
      "/v1/messages",
      {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "url", url: photoUrl },
              },
              {
                type: "text",
                text: 'Analyze this photo. Return JSON only, no extra text: {"confirmed_category": "<noise|air|litter|pollen|general>", "severity": <1-5>, "description": ""}',
              },
            ],
          },
        ],
      },
      {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      }
    );

    const text = result?.content?.[0]?.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (err) {
    console.error("Claude Vision failed:", err.message);
    return null;
  }
}

function computeAggregateLayer(posts, neighborhoodId, mode) {
  const categories = ["noise", "air", "litter", "pollen", "general"];
  const layers = {};

  categories.forEach((cat) => {
    const catPosts = posts.filter((p) => p.category === cat);
    const avgSeverity =
      catPosts.length > 0
        ? catPosts.reduce((s, p) => s + (p.severity || 0), 0) / catPosts.length
        : 0;
    const index = Math.min(100, Math.round(avgSeverity * (catPosts.length / 5)));
    layers[cat] = {
      report_count: catPosts.length,
      avg_severity: parseFloat(avgSeverity.toFixed(1)),
      index,
    };
  });

  const reportCounts = categories.map((c) => layers[c].report_count);
  const minReports = Math.min(...reportCounts);
  const maxReports = Math.max(...reportCounts);
  const confidence =
    minReports < 3 ? "low" : maxReports >= 10 ? "high" : "medium";

  const composite = Math.round(
    layers.air.index * 0.3 +
      layers.noise.index * 0.25 +
      layers.pollen.index * 0.2 +
      layers.litter.index * 0.15 +
      layers.general.index * 0.1
  );

  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const reportCount24h = posts.filter((p) => p.created_at > cutoff24h).length;

  return {
    neighborhood_id: neighborhoodId,
    mode: mode || "community",
    report_count_24h: reportCount24h,
    confidence,
    layers,
    composite_score: composite,
  };
}

// ─── handlers ─────────────────────────────────────────────────────────────────

// POST /posts
async function createPost(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT token" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  const { user_id, category, lat, lng, neighborhood_id, description, photo_url, severity } = body;

  if (!user_id || !category || lat == null || lng == null || !neighborhood_id) {
    return response(400, {
      error: "Missing required fields: user_id, category, lat, lng, neighborhood_id",
    });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return response(400, {
      error: "Invalid category — must be noise|air|litter|pollen|general",
    });
  }

  // Verify user exists
  try {
    const userResult = await ddb.send(
      new GetCommand({ TableName: "users", Key: { user_id } })
    );
    if (!userResult.Item) {
      return response(401, { error: "User not found" });
    }
  } catch (err) {
    console.error("User lookup failed:", err);
    return response(500, { error: "User verification failed" });
  }

  const post_id = `p_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
  const created_at = new Date().toISOString();

  const postItem = {
    post_id,
    user_id,
    category,
    description: description || "",
    photo_url: photo_url || null,
    severity: severity || 3,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    neighborhood_id,
    agreement_count: 0,
    petition_ready: false,
    created_at,
  };

  // Call Claude Vision async if photo present (fire and update)
  let claudeVision = null;
  if (photo_url) {
    claudeVision = await callClaudeVision(photo_url);
    if (claudeVision) {
      postItem.claude_vision = claudeVision;
    }
  }

  try {
    await ddb.send(new PutCommand({ TableName: "posts", Item: postItem }));
  } catch (err) {
    console.error("DynamoDB write failed:", err);
    return response(500, { error: "DynamoDB write failure" });
  }

  return response(201, postItem);
}

// GET /posts
async function getPosts(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const qs = event.queryStringParameters || {};
  const { neighborhood, category, sort, mode, aggregate, limit, lastKey } = qs;

  if (!neighborhood) {
    return response(400, { error: "Missing required param: neighborhood" });
  }

  const limitNum = Math.min(parseInt(limit) || 20, 50);

  const queryParams = {
    TableName: "posts",
    IndexName: "neighborhood_id-index",
    KeyConditionExpression: "neighborhood_id = :nid",
    ExpressionAttributeValues: { ":nid": neighborhood },
    Limit: limitNum,
  };

  if (category) {
    queryParams.FilterExpression = "category = :cat";
    queryParams.ExpressionAttributeValues[":cat"] = category;
  }

  if (sort === "agreements") {
    // DynamoDB scan then sort in memory (no LSI defined for this)
    queryParams.ScanIndexForward = false;
  } else {
    queryParams.ScanIndexForward = false; // most recent first
  }

  if (lastKey) {
    try {
      queryParams.ExclusiveStartKey = JSON.parse(
        Buffer.from(lastKey, "base64").toString("utf8")
      );
    } catch {
      return response(400, { error: "Invalid lastKey cursor" });
    }
  }

  let posts;
  try {
    const result = await ddb.send(new QueryCommand(queryParams));
    posts = result.Items || [];

    if (sort === "agreements") {
      posts.sort((a, b) => (b.agreement_count || 0) - (a.agreement_count || 0));
    }

    if (aggregate === "true") {
      const layer = computeAggregateLayer(posts, neighborhood, mode);
      return response(200, layer);
    }

    const nextLastKey = result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
      : null;

    return response(200, {
      posts,
      lastKey: nextLastKey,
      total_returned: posts.length,
    });
  } catch (err) {
    console.error("Query failed:", err);
    return response(500, { error: "Failed to query posts" });
  }
}

// GET /posts/{postId}
async function getPost(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const postId =
    event.pathParameters?.postId ||
    (event.path || "").split("/").pop();

  try {
    const postResult = await ddb.send(
      new GetCommand({ TableName: "posts", Key: { post_id: postId } })
    );

    if (!postResult.Item) {
      return response(404, { error: "post_id not found" });
    }

    const agreementsResult = await ddb.send(
      new QueryCommand({
        TableName: "agreements",
        KeyConditionExpression: "post_id = :pid",
        ExpressionAttributeValues: { ":pid": postId },
      })
    );

    const agreers = (agreementsResult.Items || []).map((a) => a.user_id);

    return response(200, { ...postResult.Item, agreers });
  } catch (err) {
    console.error("getPost failed:", err);
    return response(500, { error: "Internal server error" });
  }
}

// POST /agree/{postId}
async function agreePost(event) {
  const decoded = verifyJWT(event);
  if (!decoded) return response(401, { error: "Invalid JWT" });

  const postId =
    event.pathParameters?.postId ||
    (event.path || "").replace(/.*\/agree\//, "");

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "Invalid request body" });
  }

  const { user_id } = body;

  // Check post exists
  let postItem;
  try {
    const postResult = await ddb.send(
      new GetCommand({ TableName: "posts", Key: { post_id: postId } })
    );
    if (!postResult.Item) return response(404, { error: "post_id not found" });
    postItem = postResult.Item;
  } catch (err) {
    return response(500, { error: "Failed to fetch post" });
  }

  // Check for duplicate agree
  try {
    const existing = await ddb.send(
      new GetCommand({
        TableName: "agreements",
        Key: { post_id: postId, user_id },
      })
    );
    if (existing.Item) {
      return response(400, {
        error: "User has already agreed",
        agreement_count: postItem.agreement_count,
      });
    }
  } catch (err) {
    return response(500, { error: "Failed to check existing agreement" });
  }

  // Write agreement
  try {
    await ddb.send(
      new PutCommand({
        TableName: "agreements",
        Item: {
          post_id: postId,
          user_id,
          agreed_at: new Date().toISOString(),
        },
        ConditionExpression:
          "attribute_not_exists(post_id) AND attribute_not_exists(user_id)",
      })
    );
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return response(400, { error: "User has already agreed" });
    }
    return response(500, { error: "Failed to write agreement" });
  }

  // Atomically increment count
  let updatedPost;
  try {
    const updateResult = await ddb.send(
      new UpdateCommand({
        TableName: "posts",
        Key: { post_id: postId },
        UpdateExpression:
          "ADD agreement_count :inc SET petition_ready = :pr",
        ExpressionAttributeValues: {
          ":inc": 1,
          ":pr": (postItem.agreement_count || 0) + 1 >= PETITION_THRESHOLD,
          ":threshold": PETITION_THRESHOLD - 1,
        },
        ConditionExpression: "attribute_exists(post_id)",
        ReturnValues: "ALL_NEW",
      })
    );
    updatedPost = updateResult.Attributes;
  } catch (err) {
    console.error("Update post failed:", err);
    return response(500, { error: "Failed to update agreement count" });
  }

  const petitionJustBecameReady =
    !postItem.petition_ready && updatedPost.petition_ready;

  // Notify via SNS if petition threshold just crossed
  if (petitionJustBecameReady) {
    try {
      const agreersResult = await ddb.send(
        new QueryCommand({
          TableName: "agreements",
          KeyConditionExpression: "post_id = :pid",
          ExpressionAttributeValues: { ":pid": postId },
        })
      );
      const agreers = (agreersResult.Items || []).map((a) => a.user_id);

      await sns.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Message: JSON.stringify({
            type: "petition_ready",
            post_id: postId,
            agreers,
            neighborhood_id: postItem.neighborhood_id,
          }),
          Subject: "Petition Ready",
        })
      );
    } catch (err) {
      console.error("SNS publish failed:", err.message);
    }
  }

  return response(200, {
    post_id: postId,
    agreement_count: updatedPost.agreement_count,
    user_has_agreed: true,
    petition_ready: updatedPost.petition_ready,
  });
}

// GET /agree/{postId}
async function getAgree(event) {
  const qs = event.queryStringParameters || {};
  const { userId } = qs;

  if (!userId) {
    return response(400, { error: "Missing required param: userId" });
  }

  const postId =
    event.pathParameters?.postId ||
    (event.path || "").replace(/.*\/agree\//, "");

  try {
    const [postResult, agreementResult] = await Promise.all([
      ddb.send(new GetCommand({ TableName: "posts", Key: { post_id: postId } })),
      ddb.send(
        new GetCommand({
          TableName: "agreements",
          Key: { post_id: postId, user_id: userId },
        })
      ),
    ]);

    if (!postResult.Item) {
      return response(404, { error: "post_id not found" });
    }

    return response(200, {
      post_id: postId,
      agreement_count: postResult.Item.agreement_count || 0,
      user_has_agreed: !!agreementResult.Item,
      petition_ready: postResult.Item.petition_ready || false,
    });
  } catch (err) {
    console.error("getAgree failed:", err);
    return response(500, { error: "Internal server error" });
  }
}

// ─── router ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const path = event.path || event.rawPath || "";
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";

  console.log(`${method} ${path}`);

  if (method === "POST" && path.endsWith("/posts")) return createPost(event);
  if (method === "GET" && path.endsWith("/posts")) return getPosts(event);

  // /posts/{postId}
  if (method === "GET" && path.match(/\/posts\/[^/]+$/)) return getPost(event);

  // /agree/{postId}
  if (method === "POST" && path.match(/\/agree\/[^/]+$/)) return agreePost(event);
  if (method === "GET" && path.match(/\/agree\/[^/]+$/)) return getAgree(event);

  return response(404, { error: "Route not found" });
};