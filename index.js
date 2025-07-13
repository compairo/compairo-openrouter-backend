import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/compare", async (req, res) => {
  const { products } = req.body;

  // ── 1. Validate input ────────────────────────
  if (!Array.isArray(products) || products.length < 2) {
    return res.status(400).json({ error: "At least two products are required." });
  }

  // ── 2. Build AI prompt ───────────────────────
  const prompt =
    `Compare the following products: ${products.join(", ")}.\n` +
    `Give a detailed comparison with pros & cons and a clear final recommendation.`;

  try {
    console.log("🧠 Prompt sent to OpenRouter ➜", prompt);

    // ── 3. Call OpenRouter API ─────────────────
    const { data } = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "anthropic/claude-3-haiku",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("📦 Raw response from OpenRouter:", JSON.stringify(data, null, 2));

    // ── 4. Extract reply ───────────────────────
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      throw new Error("Empty reply from model");
    }

    // ── 5. Return to frontend in correct shape ─
    res.json({ result: reply });
  } catch (err) {
    console.error("❌ OpenRouter error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate comparison from AI." });
  }
});

// ── 6. Start server ───────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
