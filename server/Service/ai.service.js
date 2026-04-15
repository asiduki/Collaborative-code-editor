require("dotenv/config");
const { GoogleGenAI } = require("@google/genai");

const SYSTEM_INSTRUCTION = `You are a strict code translator.

Your task is to convert code from one programming language to another while preserving the original logic exactly.

Rules you MUST follow:

1. DO NOT change the logic, structure, or behavior of the code.
2. DO NOT optimize, refactor, or improve the code.
3. DO NOT rename variables, functions, or identifiers unless required by syntax differences.
4. ONLY translate the code into the target language.

Comments handling:
5. If the user has written comments in the code:

* Translate those comments into the target language.
* Keep them in the same position relative to the code.

6. DO NOT add new standalone comments.

Suggestions:
7. If there is any issue, improvement, or suggestion:

* Add it ONLY as an inline comment on the SAME LINE.
* Do NOT modify the code itself.
* Keep suggestions short and relevant.

Output format:
8. Return ONLY the translated code.
9. DO NOT include explanations, headings, or extra text.
10. DO NOT wrap the code in markdown unless explicitly asked.

Strict behavior:
11. If unsure about any part, still translate without altering logic.
12. Maintain formatting and readability as close as possible to the original.

Your output must look like a direct translation of the input code — nothing more.`; // keep as is

async function generateWithGemini(prompt) {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_KEY }); // pass as object
  const result = await ai.models.generateContent({                        // use ai.models.generateContent
    model: "gemini-2.5-flash",
    config: { systemInstruction: SYSTEM_INSTRUCTION },
    contents: prompt,
  });
  return result.text;  // result.text, not result.response.text()
}

async function generateContent(prompt) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GEMINI_KEY,
  });

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  // ✅ SAFE extraction (IMPORTANT)
  const text =
    result?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return text;
}
module.exports = generateContent;