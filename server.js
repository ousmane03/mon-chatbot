require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "build")));

// Charge la config d'un client depuis clients/<clientId>.json
function loadClient(clientId) {
  const filePath = path.join(__dirname, "clients", `${clientId}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Retourne la config publique (sans systemPrompt) pour le widget
app.get("/api/config/:clientId", (req, res) => {
  const client = loadClient(req.params.clientId);
  if (!client) return res.status(404).json({ error: "Client introuvable" });
  const { systemPrompt, ...publicConfig } = client;
  res.json(publicConfig);
});

function detectLang(text) {
  const enWords = /\b(what|how|where|when|who|why|is|are|can|do|does|the|a|an|your|you|i|my|we|have|has|will|would|could|tell|show|want|need|help|hi|hello|hey|good|please|menu|open|closed|book|reservation|address|phone|specialty|speciality)\b/i;
  const frWords = /\b(quels?|comment|où|quand|qui|pourquoi|est|sont|peux|pouvez|du|de|la|le|les|un|une|votre|vous|je|mon|nous|avez|sera|dire|montrer|veux|besoin|aide|bonjour|salut|bonsoir|merci|bien|ouvert|fermé|réserver|adresse|téléphone|spécialité)\b/i;
  const enScore = (text.match(enWords) || []).length;
  const frScore = (text.match(frWords) || []).length;
  return enScore > frScore ? "en" : "fr";
}

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, clientId } = req.body;

    const client = loadClient(clientId);
    if (!client) return res.status(404).json({ error: "Client introuvable" });

    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    const lang = lastUserMsg ? detectLang(lastUserMsg.content) : "fr";
    const langNote = lang === "en"
      ? "CRITICAL: The user wrote in English. You MUST respond in English only. Do not use any French words."
      : "CRITIQUE : L'utilisateur écrit en français. Tu DOIS répondre en français uniquement. N'utilise aucun mot anglais.";

    const groqMessages = [
      { role: "system", content: client.systemPrompt + "\n\n" + langNote },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 1024
      })
    });

    const data = await response.json();

    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.choices?.[0]?.message?.content || "";
    res.json({ content: [{ type: "text", text }] });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
