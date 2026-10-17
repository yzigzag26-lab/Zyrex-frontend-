import type { ChatMessage } from "../../types";
import { Markdown } from "./Markdown";

export function ZyrexMessage({ message }: { message: ChatMessage }) {
  const text =
    message.text ||
    (message.blocks && message.blocks.length > 0
      ? message.blocks.map((b) => ("text" in b ? b.text : "")).filter(Boolean).join("\n\n")
      : message.title) ||
    "";

  return (
    <div className="w-full flex items-start gap-3">
      <div className="size-7 rounded-full bg-[#171717] border border-[#424242] flex items-center justify-center shrink-0 text-white font-bold text-xs mt-0.5">
        Z
      </div>
      <div className="flex-1 min-w-0 text-white text-sm leading-relaxed prose prose-invert max-w-none">
        <Markdown>{text}</Markdown>
      </div>
    </div>
  );
}
