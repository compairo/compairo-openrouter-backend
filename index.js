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

  if (!Array.isArray(products) || products.length < 2) {
    return res.status(400).json({ error: "At least two products are required." });
  }

  try {
    const prompt = `Compare the following products: ${products.join(", ")}.\nGive a detailed comparison with pros and cons, and a final recommendation.`;

    const response = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
      model: "anthropic/claude-3-haiku",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    }, {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const reply = response.data.choices?.[0]?.message?.content || "No response.";
    res.json({ reply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate comparison." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});