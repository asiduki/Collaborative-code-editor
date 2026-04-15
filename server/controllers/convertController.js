// server/controllers/convertController.js

const convertCtoJava = require("../converters/cToJava");
const convertJavaToC = require("../converters/javaToC");

exports.convertCode = (req, res) => {
  try {
    const { code, mode } = req.body;

    if (!code || !mode) {
      return res.status(400).json({ error: "Missing code or mode" });
    }

    let output = "";

    if (mode === "c2java") {
      output = convertCtoJava(code);
    } else if (mode === "java2c") {
      output = convertJavaToC(code);
    } else {
      return res.status(400).json({ error: "Invalid mode" });
    }

    res.json({ output });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
