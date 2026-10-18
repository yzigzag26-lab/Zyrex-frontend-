import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Icon } from "../ui/Icons";

export function normalizeMarkdown(text: string): string {
  return text
    .replace(/\\\*\\\*/g, "**")
    .replace(/\\\*/g, "*")
    .replace(/\\_/g, "_")
    .replace(/\\`/g, "`")
    .replace(/\\#/g, "#")
    .replace(/\\\[/g, "[")
    .replace(/\\\]/g, "]")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div>/gi, "")
    .replace(/<\/div>/gi, "\n")
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "");
}

function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:)/i.test(href);
}

function CodeBlock({ language, children }: { language?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(children);
    } catch {
      /* clipboard may be blocked */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-line bg-surface2">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="z-num text-[10.5px] text-muted">{language || "code"}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-ink2 hover:bg-surface3 hover:text-ink"
        >
          <Icon name={copied ? "check" : "copy"} size={12} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="z-scroll overflow-x-auto p-3">
        <code className="font-mono text-[12.5px] leading-relaxed text-ink">{children}</code>
      </pre>
    </div>
  );
}

const baseComponents = {
  a: ({ href, children }: { href?: string; children?: ReactNode }) => {
    if (!href || !isSafeHref(href)) return <span>{children}</span>;
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
  table: ({ children }: { children?: ReactNode }) => (
    <div className="md-table-wrap">
      <table>{children}</table>
    </div>
  ),
  pre: ({ children }: { children?: ReactNode }) => <>{children}</>,
  code: ({ className, children }: { className?: string; children?: ReactNode }) => {
    const text = String(children ?? "").replace(/\n$/, "");
    const language = /language-(\w+)/.exec(className || "")?.[1];
    const isBlock = Boolean(className) || text.includes("\n");
    if (isBlock) return <CodeBlock language={language}>{text}</CodeBlock>;
    return <code>{text}</code>;
  },
};

export function Markdown({ children, inline = false }: { children: string; inline?: boolean }) {
  return (
    <div className="zyrex-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={
          inline
            ? { ...baseComponents, p: ({ children: content }) => <>{content}</> }
            : baseComponents
        }
      >
        {normalizeMarkdown(children)}
      </ReactMarkdown>
    </div>
  );
}
