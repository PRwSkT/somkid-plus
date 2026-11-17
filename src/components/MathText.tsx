import React, { useMemo } from "react";
import katex from "katex";

interface MathTextProps {
  text?: string;
  className?: string;
  as?: "span" | "div" | "p" | "strong";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function MathText({
  text = "",
  className = "",
  as = "span",
}: MathTextProps) {
  const html = useMemo(() => {
    if (!text) return "";

    // Match LaTeX delimiters: $$...$$, $...$, \[...\], \(...\)
    // or bare LaTeX fraction/sqrt expressions: \frac{a}{b}, \sqrt{x}, \sqrt[n]{x}
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$|\\\[[\s\S]+?\\\]|\\\([^\)]+?\\\)|\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt(?:\[[^\]]*\])?\{[^{}]+\})/g;
    const parts = text.split(regex);

    return parts
      .map((part) => {
        if (!part) return "";
        let math = "";
        let displayMode = false;

        if (part.startsWith("$$") && part.endsWith("$$") && part.length >= 4) {
          math = part.slice(2, -2).trim();
          displayMode = true;
        } else if (
          part.startsWith("\\[") &&
          part.endsWith("\\]") &&
          part.length >= 4
        ) {
          math = part.slice(2, -2).trim();
          displayMode = true;
        } else if (
          part.startsWith("$") &&
          part.endsWith("$") &&
          part.length >= 2
        ) {
          math = part.slice(1, -1).trim();
          displayMode = false;
        } else if (
          part.startsWith("\\(") &&
          part.endsWith("\\)") &&
          part.length >= 4
        ) {
          math = part.slice(2, -2).trim();
          displayMode = false;
        } else if (part.startsWith("\\frac") || part.startsWith("\\sqrt")) {
          math = part.trim();
          displayMode = false;
        }

        if (math) {
          try {
            return katex.renderToString(math, {
              displayMode,
              throwOnError: false,
              strict: false,
              output: "htmlAndMathml",
            });
          } catch {
            return escapeHtml(part);
          }
        }

        return escapeHtml(part);
      })
      .join("");
  }, [text]);

  const Component = as;
  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
