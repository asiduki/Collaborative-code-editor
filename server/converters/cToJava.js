// server/converters/cToJava.js
// BEST-EFFORT C → Java converter using CommonJS

function convertCtoJava(input) {
  let code = input;

  code = code.replace(/#include\s+<.*?>/g, "// include removed");

  code = code.replace(/printf\s*\((.*?)\);/g, (m, inside) => {
    if (inside.includes("%")) return `System.out.printf(${inside});`;
    return `System.out.println(${inside});`;
  });

  code = code.replace(/scanf\s*\((.*?)\);/g, "// TODO: convert scanf");

  code = code.replace(/struct\s+(\w+)\s*\{/g, "class $1 {");

  code = code.replace(/->/g, ".");

  // convert main
  code = code.replace(
    /int\s+main\s*\(\s*\)/g,
    "public static void main(String[] args)"
  );

  // ⭐ FIX: remove invalid Java main return
  code = code.replace(/\breturn\s+0\s*;/g, "// return removed (invalid in Java)");

  code = code.replace(/malloc\s*\((.*?)\)/g, "/* new object */ null");
  code = code.replace(/free\s*\((.*?)\)/g, "/* Java GC */");

  code = code.replace(
    /(\w+)\s+(\w+)\[(\d+)\];/g,
    (m, type, name, size) => `${type}[] ${name} = new ${type}[${size}];`
  );

  if (!code.includes("class")) {
    code = `
public class Main {
${indent(code)}
}
`;
  }

  return `// ===== Converted C → Java =====\n` + code;
}

function indent(str) {
  return str
    .split("\n")
    .map((l) => "    " + l)
    .join("\n");
}

module.exports = convertCtoJava;