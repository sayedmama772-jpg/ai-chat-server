import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

/* ======================
   Health Check
====================== */
app.get("/", (req, res) => {
  res.send("AI Server Running Successfully");
});

/* ======================
   Chat API
====================== */
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "message is required" });
    }

    // ===== SYSTEM PROMPT (AI Personality) =====
    const systemPrompt = `
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
`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `${systemPrompt}\n\nUser: ${userMessage}\nAI:`,
        }),
      }
    );

    const data = await response.json();

    let reply = "দুঃখিত, এখন উত্তর দিতে পারছি না।";

    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text
        .replace(systemPrompt, "")
        .replace("User:", "")
        .replace("AI:", "")
        .trim();
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "server error" });
  }
});

/* ======================
   Server Start
====================== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
