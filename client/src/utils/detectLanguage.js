export function detectLanguage(code) {
  if (!code) return "plaintext";

  const trimmed = code.trim();

  // C language
  if (trimmed.match(/^#include\s*<.*?>/)) return "c";
  if (trimmed.includes("printf(") && trimmed.includes("#include")) return "c";

  // Java
  if (trimmed.includes("public class") || trimmed.includes("System.out")) return "java";

  // C++
  if (trimmed.includes("#include") && trimmed.includes("std::")) return "cpp";
  if (trimmed.includes("cout <<") || trimmed.includes("cin >>")) return "cpp";

  // Python
  if (trimmed.startsWith("def ") || trimmed.includes("print(") && !trimmed.includes(";")) return "python";

  // JavaScript
  if (trimmed.includes("function") || trimmed.includes("console.log")) return "javascript";

  // HTML
  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) return "html";

  // SQL
  if (trimmed.match(/^(SELECT|INSERT|UPDATE|DELETE)/i)) return "sql";

  // JSON
  try {
    JSON.parse(trimmed);
    return "json";
  } catch {}

  return "plaintext";
}
