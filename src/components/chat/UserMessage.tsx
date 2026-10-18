import type { ChatMessage } from "../../types";
import { Icon } from "../ui/Icons";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex w-full justify-end">
      <div className="max-w-[min(85%,42rem)]">
        {message.attachments && message.attachments.length > 0 && (
          <ul className="mb-1.5 flex flex-wrap justify-end gap-1.5">
            {message.attachments.map((file) => (
              <li
                key={file.id}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface2 px-2 py-1 text-[11px] text-ink2"
              >
                <Icon name={file.kind === "image" ? "image" : "file"} size={12} />
                {file.name}
              </li>
            ))}
          </ul>
        )}
        <div className="rounded-2xl bg-surface2 px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-ink">
          {message.text}
        </div>
      </div>
    </div>
  );
}
