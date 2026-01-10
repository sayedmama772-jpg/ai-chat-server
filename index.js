import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

/* ================== WEBHOOK VERIFY ================== */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/* ================== WEBHOOK RECEIVE ================== */
app.post("/webhook", async (req, res) => {
  console.log("RAW:", JSON.stringify(req.body));

  const event = req.body.entry?.[0]?.messaging?.[0];
  if (!event || event.message?.is_echo) {
    return res.sendStatus(200);
  }

  const user = event.sender.id;
  const text = event.message?.text || "";

  console.log("USER:", user, "TEXT:", text);

  const reply = brain(user, text);
  await sendMessage(user, reply);

  res.sendStatus(200);
});

/* ================== SEND MESSAGE ================== */
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

/* ================== SIMPLE BRAIN (test) ================== */
function brain(user, text) {
  if (text.includes("ki khobor")) return "এই তো, ভালোই 🙂";
  if (text.includes("kemon acho")) return "ভালো আছি, তুমি?";
  return "আমি তোমার কথা পেয়েছি 👍";
}

/* ================== SERVER ================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Bot running on port", PORT);
});
