import { useEffect, useId, useRef, useState } from "react";
import { useZyrex } from "../../store/ZyrexProvider";
import { cn } from "../../utils/cn";
import { Icon } from "../ui/Icons";
import type { ChatAttachmentMeta } from "../../types";

const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_DOC = 8 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DOC_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "text/markdown",
  "application/json",
];

interface LocalFile extends ChatAttachmentMeta {
  previewUrl?: string;
  error?: string;
}

function kindOf(file: File): "image" | "document" | null {
  if (IMAGE_TYPES.includes(file.type) || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) return "image";
  if (
    DOC_TYPES.includes(file.type) ||
    /\.(pdf|txt|csv|md|json)$/i.test(file.name)
  ) {
    return "document";
  }
  return null;
}

export function Composer() {
  const { sendMessage, stopGeneration, isStreaming, generationState } = useZyrex();
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const busy = isStreaming || generationState === "processing" || generationState === "streaming";
  const canSend = (value.trim().length > 0 || files.some((file) => !file.error)) && !busy;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value]);

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
      });
    };
    // revoke only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setError(null);
    const next: LocalFile[] = [];
    for (const file of Array.from(list)) {
      const kind = kindOf(file);
      if (!kind) {
        next.push({
          id: `${file.name}-${file.size}`,
          name: file.name,
          type: file.type,
          size: file.size,
          kind: "document",
          error: "Unsupported file type.",
        });
        continue;
      }
      const limit = kind === "image" ? MAX_IMAGE : MAX_DOC;
      if (file.size > limit) {
        next.push({
          id: `${file.name}-${file.size}`,
          name: file.name,
          type: file.type,
          size: file.size,
          kind,
          error: `File exceeds ${Math.round(limit / 1024 / 1024)}MB limit.`,
        });
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        type: file.type,
        size: file.size,
        kind,
        previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
      });
    }
    setFiles((prev) => [...prev, ...next]);
    setMenuOpen(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((file) => file.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((file) => file.id !== id);
    });
  };

  const submit = () => {
    if (!canSend) return;
    const valid = files
      .filter((file) => !file.error)
      .map((file) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        kind: file.kind,
      }));
    sendMessage(value, valid);
    setValue("");
    files.forEach((file) => {
      if (file.previewUrl) URL.revokeObjectURL(file.previewUrl);
    });
    setFiles([]);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="w-full px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-4">
      <div className="mx-auto w-full max-w-3xl">
        {files.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {files.map((file) => (
              <li
                key={file.id}
                className={cn(
                  "flex max-w-full items-center gap-2 rounded-xl border bg-surface2 px-2 py-1.5 text-[11px]",
                  file.error ? "border-neg/40 text-neg" : "border-line text-ink2",
                )}
              >
                {file.previewUrl ? (
                  <img src={file.previewUrl} alt="" className="size-8 rounded-md object-cover" />
                ) : (
                  <Icon name={file.kind === "image" ? "image" : "file"} size={14} />
                )}
                <span className="min-w-0 truncate">{file.error ? `${file.name} — ${file.error}` : file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeFile(file.id)}
                  className="grid size-6 place-items-center rounded-md hover:bg-surface3"
                >
                  <Icon name="close" size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="relative rounded-[28px] border border-line bg-surface2 shadow-sm focus-within:border-blue/50">
          <div className="flex items-end gap-1 px-2 py-2 sm:px-2.5">
            <div className="relative shrink-0 pb-0.5">
              <button
                type="button"
                aria-label="Add attachment"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="grid size-10 place-items-center rounded-full text-ink2 hover:bg-surface3 hover:text-ink"
              >
                <Icon name="plus" size={18} />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="z-panel absolute bottom-[calc(100%+8px)] left-0 w-52 overflow-hidden p-1"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-surface2"
                  >
                    <Icon name="image" size={15} />
                    Upload image
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => docInputRef.current?.click()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-ink hover:bg-surface2"
                  >
                    <Icon name="file" size={15} />
                    Upload document
                  </button>
                  <p className="px-3 py-2 text-[10.5px] leading-relaxed text-muted">
                    Images and documents stay local until the backend accepts file bytes.
                  </p>
                </div>
              )}
            </div>

            <label htmlFor={inputId} className="sr-only">
              Message HERMES AI
            </label>
            <textarea
              id={inputId}
              ref={textareaRef}
              rows={1}
              value={value}
              disabled={busy}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={busy ? "HERMES is responding…" : "Message HERMES AI"}
              className="max-h-[168px] min-h-[40px] w-full flex-1 resize-none bg-transparent px-1 py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-muted focus:outline-none disabled:opacity-60"
            />

            {busy ? (
              <button
                type="button"
                onClick={stopGeneration}
                aria-label="Stop generating"
                className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bg hover:opacity-90"
              >
                <Icon name="stop" size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                aria-label="Send message"
                className="mb-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-ink text-bg disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Icon name="arrowUp" size={16} />
              </button>
            )}
          </div>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.txt,.csv,.md,.json,application/pdf,text/plain,text/csv,application/json"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {error && <p className="mt-2 text-center text-[11px] text-neg">{error}</p>}
      </div>
    </div>
  );
}
