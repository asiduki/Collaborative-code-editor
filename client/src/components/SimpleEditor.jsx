import CodeMirror from "@uiw/react-codemirror";
import { dracula } from "@uiw/codemirror-theme-dracula";

export default function SimpleEditor({ value, onChange }) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={dracula}
      onChange={(v) => onChange(v)}
      basicSetup={{ lineNumbers: true }}
      style={{ height: "100%", fontSize: "14px" }}
    />
  );
}
