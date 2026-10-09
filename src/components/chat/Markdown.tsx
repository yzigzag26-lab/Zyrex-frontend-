import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Normalize escaped Markdown and stray HTML tags that an AI model may return
 * so the rendered output matches what it intended.
 */
export function normalizeMarkdown(text: string): string {
  return text
    .replace(/\\\*\\*/g, "**")
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

/** Only allow protocols that cannot execute script or leak data. */
function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:)/i.test(href);
}

const baseComponents = {
  a: ({ node, ...props }: { node?: unknown; href?: string; children?: React.ReactNode }) => {
    const href = props.href;
    if (!href) return <a {...props} />;
    if (!isSafeHref(href)) return <span>{props.children}</span>;
    return <a {...props} target="_blank" rel="noopener noreferrer" />;
  },
};

/**
 * Renders an AI-authored string as Markdown.
 *
 * Used by every chat surface so an answer looks the same wherever it appears.
 * `inline` unwraps paragraphs for dense contexts such as list items.
 */
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
