// server/converters/javaToC.js
// BEST-EFFORT Java → C converter using CommonJS

function convertJavaToC(input) {
  let code = input;

  code = code.replace(/package\s+.*?;/g, "");
  code = code.replace(/import\s+.*?;/g, "// removed import");

  code = code.replace(
    /System\.out\.println\s*\((.*?)\);/g,
    `printf("%s\\n", $1);`
  );

  code = code.replace(
    /System\.out\.print\s*\((.*?)\);/g,
    `printf("%s", $1);`
  );

  code = code.replace(/System\.out\.printf/g, "printf");

  code = code.replace(
    /public\s+static\s+void\s+main\s*\(String\[\]\s+\w+\)/,
    "int main(int argc, char** argv)"
  );

  code = code.replace(/class\s+(\w+)\s*\{/g, "struct $1 {");

  code = code.replace(/new\s+(\w+)\s*\[(.*?)\]/g, "malloc(sizeof($1) * ($2))");

  code = code.replace(/\b(public|private|protected|static|final)\b/g, "");

  return `/* ===== Converted Java → C ===== */\n${code}`;
}

module.exports = convertJavaToC;
