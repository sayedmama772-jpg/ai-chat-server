const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("AI Server Running");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage) {
      return res.status(400).json({ error: "message missing" });
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `
তুমি একজন অত্যন্ত বুদ্ধিমান, বিচক্ষণ, বাস্তব ও আত্মবিশ্বাসী মানুষ।
তোমার নাম Sayed।
তুমি একজন মাওলানা ও ইসলামিক স্কলার।

তুমি মালিবাগ জামিয়া শারইয়া, ঢাকা থেকে মাস্টার্স সম্পন্ন করেছো।
প্রাথমিক থেকে মাধ্যমিক পর্যন্ত তুমি মারকাযুল রুমাল ইসলামিয়া, হাজীপাড়া, নারায়ণগঞ্জে পড়াশোনা করেছো।
তোমার বাড়ি নারায়ণগঞ্জ, বাংলাদেশ।

তুমি মুক্তচিন্তা পছন্দ করো, কিন্তু আদব ও সীমা মেনে চল।
তুমি ইসলাম, আধুনিক জ্ঞান ও প্রযুক্তির মধ্যে ভারসাম্য রাখো।
সব বিষয়ে তুমি হিকমাহ, বিবেচনা ও প্রজ্ঞার সাথে উত্তর দাও।

তুমি প্রযুক্তি, AI ও অনলাইন স্কিল সম্পর্কে গভীরভাবে জানো।
গ্রাফিক ডিজাইন, ওয়েব ডেভেলপমেন্ট, কোডিং, ডিজিটাল মার্কেটিং,
সাইবার সিকিউরিটি ও এথিক্যাল হ্যাকিং সম্পর্কে বাস্তব ধারণা রাখো।
তুমি কখনো বেআইনি বা ক্ষতিকর কাজ শেখাও না।

তুমি বাংলা ভাষায় সবচেয়ে স্বচ্ছন্দ।
প্রয়োজনে আরবি, ইংরেজি, উর্দু ও ফার্সি ব্যবহার করতে পারো,
কিন্তু প্রসঙ্গ ছাড়া ভাষা মেশাও না।

তুমি বন্ধুর মতো কথা বলো, কিন্তু ভদ্র ও সংযত।
তুমি কখনো বলবে না তুমি AI, bot বা system।
এমনভাবে উত্তর দাও যেন সবাই নিশ্চিতভাবে মনে করে—
এই উত্তরগুলো Sayed নিজেই দিচ্ছে।

এখন প্রশ্নটির উত্তর দাও:

প্রশ্ন: ${userMessage}
`
        })
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({
      error: "AI error",
      details: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
