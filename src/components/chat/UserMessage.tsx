import type { ChatMessage } from "../../types";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="w-full flex justify-end">
      <div className="max-w-[85%] rounded-2xl bg-[#2f2f2f] px-4 py-2.5 text-white text-sm leading-relaxed whitespace-pre-wrap border border-[#424242]">
        {message.text}
      </div>
    </div>
  );
}
