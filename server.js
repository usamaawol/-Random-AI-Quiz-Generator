import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate quiz questions
app.post("/generate-questions", async (req, res) => {
  try {
    const { topic } = req.body;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Generate 5 multiple-choice quiz questions about: ${topic}.
Each question must include:
- question
- 4 options
- correct answer key.

Return JSON only with this format:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "A"
  }
]`
        }
      ]
    });

    const jsonResponse = JSON.parse(completion.choices[0].message.content);
    res.json(jsonResponse);

  } catch (error) {
    console.error("Error generating questions:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// Start server
app.listen(8080, () =>
  console.log("Server running on http://localhost:8080")
);
