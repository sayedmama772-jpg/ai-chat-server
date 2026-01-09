import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// ================== ENV ==================
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const HF_TOKEN = process.env.HF_TOKEN;
const VERIFY_TOKEN = "my_verify_token"; // Meta webhook verify token

// ================== DELAY (Human-like) ==================
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================== AI PERSONALITY PROMPT ==================
function buildPrompt(userText) {
  return `
তুমি একজন অত্যন্ত জ্ঞানী, ভদ্র, স্মার্ট ও দায়িত্বশীল কৃত্রিম বুদ্ধিমত্তা।
তুমি Sayed-এর ব্যক্তিগত AI।

Sayed সম্পর্কে তথ্য:
- তিনি একজন মাওলানা ও ইসলামিক স্কলার
- Masters সম্পন্ন করেছেন: মালিবাগ জামিয়া শারইয়া, ঢাকা
- প্রাথমিক থেকে মাধ্যমিক: মারকাযুল রুমাল ইসলামিয়া, হাজীপাড়া, নারায়ণগঞ্জ
- বাড়ি: নারায়ণগঞ্জ
- তিনি মুক্তচিন্তা ও আধুনিক প্রযুক্তি পছন্দ করেন
- ভাষা: বাংলা, আরবি, ইংরেজি, ফার্সি, উর্দু
- দক্ষতা: গ্রাফিক্স ডিজাইন, ওয়েব ডেভেলপমেন্ট, কোডিং,
  ইথিকাল হ্যাকিং, ডিজিটাল মার্কেটিং, AI ও আধুনিক টেকনোলজি

আচরণ নির্দেশনা:
- বন্ধুর মতো কথা বলবে
- স্মার্ট ও বিবেচনার সাথে উত্তর দেবে
- ইসলামিক ও টেকনোলজি প্রশ্নে ব্যালেন্স রাখবে
- ভুল বা ক্ষতিকর তথ্য দিবে না
- প্রয়োজনে ভাষা পরিবর্তন করবে
- খুব বেশি রোবটিক হবে না
- সংক্ষিপ্ত, প্রাকৃতিক ভাষায় উত্তর দেবে

ব্যবহারকারীর মেসেজ:
"${userText}"

এখন মানুষের মতো স্বাভাবিক, ফ্রেন্ডলি বাংলায় উত্তর দাও।
`;
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
    console.log("Webhook verified successfully");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ================== RECEIVE MESSAGES ==================
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const event = entry?.messaging?.[0];

  if (!event || !event.message || !event.message.text) {
    return res.sendStatus(200);
  }

  const senderId = event.sender.id;
  const userText = event.message.text;

  console.log("User message:", userText);

  try {
    // Human-like delay: 10–12 seconds
    await delay(10000 + Math.random() * 2000);

    // Hugging Face AI call
    const aiResponse = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "moonshotai/Kimi-K2-Instruct-0905",
          messages: [
            { role: "system", content: buildPrompt(userText) }
          ]
        })
      }
    );

    const aiData = await aiResponse.json();

    const replyText =
      aiData.choices?.[0]?.message?.content ||
      "হুম 🤔 একটু সমস্যা হলো। আবার বলো তো।";

    // Send reply to Messenger
    await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: { text: replyText }
        })
      }
    );

  } catch (error) {
    console.error("Error:", error);
  }

  res.sendStatus(200);
});

// ================== SERVER ==================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("AI Messenger bot running on port", PORT);
});
