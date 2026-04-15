const generateContent = require("../Service/ai.service");

const generateText = async (req, res) => {
  try {
    const { code, fromLang, toLang } = req.body;

    if (!code || !fromLang || !toLang) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // ✅ SMART PROMPT
    const prompt = `Convert ${fromLang} code to ${toLang}.

Return ONLY code. Ensure it is runnable.

Language rules:

Java:
class Main {
  public static void main(String[] args) {
    // code
  }
}

C++:
#include <iostream>
using namespace std;

int main() {
  // code
  return 0;
}

Python:
(no wrapper needed)

Here is the code:
${code}`;

    let aiResponse = await generateContent(prompt);

    // ✅ BACKEND SAFETY (VERY IMPORTANT)
    if (toLang === "java" && !aiResponse.includes("class")) {
      aiResponse = `class Main {
    public static void main(String[] args) {
        ${aiResponse}
    }
}`;
    }

    if (toLang === "c++" && !aiResponse.includes("#include")) {
      aiResponse = `#include <iostream>
using namespace std;

int main() {
    ${aiResponse}
    return 0;
}`;
    }

    return res.json({
      result: aiResponse,
    });

  } catch (err) {
    console.error("AI Error:", err.message);
    return res.status(500).json({
      message: "Conversion failed",
    });
  }
};

module.exports = { generateText };