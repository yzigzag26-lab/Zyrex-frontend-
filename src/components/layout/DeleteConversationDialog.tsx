import { useEffect, useId, useState } from "react";
import { verifyDevelopmentCredential } from "../../auth/devAuth";
import { useZyrex } from "../../store/ZyrexProvider";
import type { Conversation } from "../../types";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icons";

/**
 * Two-step chat deletion:
 *  1. "Are you sure?" confirmation.
 *  2. Admin password entry — verified with the SAME credential check as
 *     the admin sign-in (`verifyDevelopmentCredential` in auth/devAuth),
 *     so the delete password always matches the admin password and is
 *     never duplicated or stored separately.
 */
export function DeleteConversationDialog({
  conversation,
  onClose,
}: {
  conversation: Conversation | null;
  onClose: () => void;
}) {
  const { deleteConversation } = useZyrex();
  const [step, setStep] = useState<"confirm" | "password">("confirm");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const passwordId = useId();

  useEffect(() => {
    if (conversation) {
      setStep("confirm");
      setPassword("");
      setError(null);
    }
  }, [conversation]);

  if (!conversation) return null;
  const target = conversation;

  const confirmDelete = (event: React.FormEvent) => {
    event.preventDefault();
    if (!verifyDevelopmentCredential(password)) {
      setError("Incorrect password. Please try again.");
      return;
    }
    deleteConversation(target.id);
    onClose();
  };

  return (
    <Dialog open title="Delete chat" onClose={onClose}>
      <div className="p-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-neg/10 text-neg">
            <Icon name="trash" size={16} />
          </span>
          <h3 className="text-base font-semibold text-ink">Delete chat</h3>
        </div>

        {step === "confirm" ? (
          <>
            <p className="mt-3 text-[13px] leading-relaxed text-ink2">
              Are you sure you want to delete{" "}
              <span className="font-medium text-ink">“{target.title}”</span>? This can’t be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line bg-surface2 px-4 py-2 text-[13px] font-medium text-ink2 transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("password")}
                className="rounded-xl bg-neg px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                I’m sure
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={confirmDelete}>
            <p className="mt-3 text-[13px] leading-relaxed text-ink2">
              Enter the admin password to permanently delete this chat.
            </p>
            <label htmlFor={passwordId} className="mt-4 block text-[12px] font-medium text-ink2">
              Admin password
            </label>
            <input
              id={passwordId}
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className="mt-1.5 w-full rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-blue/50 focus:outline-none"
              placeholder="Password"
            />
            {error && (
              <p role="alert" className="mt-2 text-[12px] text-neg">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-line bg-surface2 px-4 py-2 text-[13px] font-medium text-ink2 transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={password.length === 0}
                className="rounded-xl bg-neg px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete chat
              </button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
