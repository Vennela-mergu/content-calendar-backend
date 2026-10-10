
import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

// Gemini AI setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Helper function to generate JSON
async function generateJson(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// Build the 30-day calendar prompt
function buildPrompt({ persona, niche, platforms, goal, tone }) {
  return `You are an expert social media strategist.

Create a 30-day content calendar for a ${persona} in the "${niche}" niche.

Platforms: ${platforms.join(", ")}.
Goal: ${goal || "grow audience and engagement"}.
Tone: ${tone || "Casual"}.

Return ONLY a valid JSON array with exactly 30 objects.
Each object must contain:
- "day": number from 1 to 30
- "type": Reel, Post, Carousel, Story, Thread, or Video
- "platform": one of the selected platforms
- "title": short content idea, maximum 10 words
- "hook": engaging opening line
- "caption": 2-4 sentences with 3 hashtags

Mix content types and platforms across the month.
Week 1 should focus on awareness.
Weeks 2-3 should provide value.
Week 4 should focus on conversion and engagement.
Tailor all ideas to the selected persona.

Return JSON only, without markdown or extra text.`;
}

// Generate the complete calendar
app.post("/generate", async (req, res) => {
  try {
    const calendar = await generateJson(buildPrompt(req.body));
    res.json({ calendar });
  } catch (err) {
    console.error("Calendar generation error:", err.message);
    res.status(500).json({
      error: "Failed to generate calendar",
    });
  }
});

// Regenerate one day's content
app.post("/regenerate-day", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    const newItem = await generateJson(prompt);
    res.json({ item: newItem });
  } catch (err) {
    console.error("Day regeneration error:", err.message);
    res.status(500).json({
      error: "Failed to regenerate day",
    });
  }
});

// Check backend status
app.get("/", (req, res) => {
  res.send("Content Calendar backend is running!");
});

// Start server
app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
