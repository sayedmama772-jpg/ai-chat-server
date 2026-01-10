import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ================== ENV ==================
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const HF_TOKEN = process.env.HF_TOKEN; // fallback AI only

// ================== MEMORY ==================
const memoryStore = {};
const MAX_HISTORY = 6;

function saveToMemory(userId, role, text) {
  if (!memoryStore[userId]) memoryStore[userId] = [];
  memoryStore[userId].push({ role, text });
  if (memoryStore[userId].length > MAX_HISTORY) {
    memoryStore[userId].shift();
  }
}

function getMemory(userId) {
  return memoryStore[userId] || [];
}

// ================== TEXT UTILS ==================
function cleanText(text) {
  return text
    .toLowerCase()
    .replace(/[?!.,]/g, "")
    .trim();
}

// ================== INTENT DETECTION ==================
function detectIntent(text) {
  if (/^(hi|hello|hey|salam|assalamu)/.test(text)) return "GREETING";
  if (text.includes("কেমন আছ")) return "SMALL_TALK";
  if (text.includes("তুমি কে") || text.includes("আপনি কে")) return "ABOUT";
  if (text.includes("কিভাবে") || text.includes("কীভাবে")) return "HOW_TO";
  if (text.includes("কেন") || text.includes("কারণ")) return "WHY";
  if (
    text.includes("নামাজ") ||
    text.includes("রোজা") ||
    text.includes("যাকাত") ||
    text.includes("হালাল") ||
    text.includes("হারাম") ||
    text.includes("দোয়া")
  )
    return "ISLAMIC";
  if (
    text.includes("ব্যথা") ||
    text.includes("জ্বর") ||
    text.includes("অসুখ") ||
    text.includes("ডাক্তার") ||
    text.includes("ওষুধ")
  )
    return "HEALTH";
  if (
    text.includes("রাজনীতি") ||
    text.includes("নির্বাচন") ||
    text.includes("সরকার") ||
    text.includes("দল")
  )
    return "POLITICS";
  if (text.length < 3) return "NOISE";
  return "UNKNOWN";
}

// ================== LOGIC RESPONDER ==================
function logicResponse(intent, text) {
  switch (intent) {
    case "GREETING":
      return "হ্যালো 😊 কী জানতে চাও?";

    case "SMALL_TALK":
      return "আলহামদুলিল্লাহ ভালো আছি। তুমি কেমন আছো?";

    case "ABOUT":
      return "আমি সাঈদ আহমাদ। মানুষকে জ্ঞান ও দিকনির্দেশনায় সাহায্য করার চেষ্টা করি। তুমি কী বিষয়ে জানতে চাও?";

    case "HOW_TO":
      return "এই বিষয়টা ধাপে ধাপে বুঝতে হয়। তুমি কোন অংশটা জানতে চাও, একটু পরিষ্কার করে বলো।";

    case "WHY":
      return "ভালো প্রশ্ন। এর পেছনে প্রেক্ষাপট ও কারণ দুটোই গুরুত্বপূর্ণ। তুমি কোন দিকটা জানতে চাও?";

    case "ISLAMIC":
      return "এটা ইসলামিক বিষয়ে গুরুত্বপূর্ণ প্রশ্ন। সংক্ষেপে বললে—এ ধরনের বিষয়ে কুরআন ও সহিহ হাদিসের আলোকে বুঝতে হয়। তুমি নির্দিষ্ট কোন দিকটা জানতে চাও?";

    case "HEALTH":
      return "স্বাস্থ্য বিষয়ে সাধারণ তথ্য দেওয়া যায়, তবে সঠিক সিদ্ধান্তের জন্য একজন যোগ্য চিকিৎসকের পরামর্শ নেওয়াই উত্তম।";

    case "POLITICS":
      return "রাজনীতি বিষয়ে আমি সংযত ও নিরপেক্ষ তথ্য দিতে চেষ্টা করি। তুমি তথ্য জানতে চাও, নাকি সাধারণ বিশ্লেষণ?";

    case "NOISE":
      return "আমি ঠিক বুঝতে পারিনি 🤔 আরেকটু পরিষ্কার করে বলবে?";

    default:
      return null; // AI fallback
  }
}

// ================== SYSTEM PROMPT (AI LAST) ==================
function buildSystemPrompt() {
  return `
তুমি একজন বাস্তব মানুষ হিসেবে কথা বলবে।
তুমি নিজেকে কখনো "AI", "কৃত্রিম বুদ্ধিমত্তা", "চ্যাটবট", "ভাষা মডেল" বলবে না।

তোমার পরিচয়:
- নাম: সাঈদ আহমাদ
- পরিচয়: একজন মাওলানা ও ইসলামিক স্কলার
- অবস্থান: বাংলাদেশ
- ভাষা: স্বাভাবিক বাংলা
- স্বভাব: ভদ্র, শান্ত, দায়িত্বশীল

নিয়ম:
- ব্যবহারকারীর পরিচয় অনুমান করবে না
- ধর্ম, রাজনীতি, স্বাস্থ্য বিষয়ে সংযত থাকবে
- সংক্ষিপ্ত ও মানবিক উত্তর দেবে
`;
}

// ================== AI FALLBACK ==================
async function callAI(messages) {
  if (!HF_TOKEN) {
    return "এই প্রশ্নটা একটু জটিল। তুমি আরেকটু বিস্তারিত বললে ভালো বুঝতে পারবো।";
  }

  const res = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "moonshotai/Kimi-K2-Instruct-0905",
        messages
      })
    }
  );

  const data = await res.json();
  return (
    data.choices?.[0]?.message?.content ||
    "আমি আপাতত একটু ব্যাস্ত, ইনশাল্লাহ ফ্রী হলে আবার কথা হবে।"
  );
}

// ================== SEND MESSAGE ==================
async function sendMessage(psid, text) {
  await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text }
      })
    }
  );
}

// ================== HEALTH CHECK ==================
app.get("/", (req, res) => {
  res.send("AI Server Running Successfully");
});

// ================== WEBHOOK VERIFY ==================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ================== RECEIVE MESSAGE ==================
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const event = entry?.messaging?.[0];

  if (!event?.message?.text) return res.sendStatus(200);

  const senderId = event.sender.id;
  const rawText = event.message.text;
  const text = cleanText(rawText);

  saveToMemory(senderId, "user", rawText);

  const intent = detectIntent(text);
  let replyText = logicResponse(intent, text);

  if (!replyText) {
    const history = getMemory(senderId).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text
    }));

    history.unshift({
      role: "system",
      content: buildSystemPrompt()
    });

    replyText = await callAI(history);
  }

  replyText = replyText.trim();
  saveToMemory(senderId, "assistant", replyText);
  await sendMessage(senderId, replyText);

  res.sendStatus(200);
});

// ================== SERVER ==================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Smart Logic Messenger Bot running on port", PORT);
});
