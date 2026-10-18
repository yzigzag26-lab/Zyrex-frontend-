import { FormEvent, useId, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { DEV_AUTH_NOTICE } from "../auth/devAuth";
import { HermesLogo } from "../components/brand/HermesLogo";
import { Icon } from "../components/ui/Icons";
import { product } from "../data/appConfig";

function MoggedScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="mogged-veil relative flex min-h-dvh w-full flex-col items-center justify-center px-6 text-center">
      <div
        className="mogged-ring pointer-events-none absolute inset-x-0 top-1/3 mx-auto h-56 w-56 rounded-full bg-[#ff3030]/20 blur-3xl"
        aria-hidden="true"
      />
      <p className="z-eyebrow mb-6 text-[#ff8a8a]">Access denied</p>
      <h1 className="mogged-word text-6xl font-bold sm:text-8xl">MOGGED</h1>
      <p className="mt-6 max-w-sm text-sm text-[#ffb0b0]/80">
        The credential was rejected. Return to the login form to try again.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-10 inline-flex h-11 items-center justify-center rounded-xl border border-[#ff3030]/50 bg-black px-5 text-sm font-semibold text-[#ff3030] transition-colors hover:bg-[#1a0000]"
      >
        Return to login
      </button>
    </div>
  );
}

export function LoginPage() {
  const { signIn } = useAuth();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [mogged, setMogged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputId = useId();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const ok = await signIn(password);
    setSubmitting(false);
    setPassword("");
    if (!ok) setMogged(true);
  };

  if (mogged) {
    return <MoggedScreen onBack={() => setMogged(false)} />;
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex flex-col items-center text-center">
          <HermesLogo size={72} rounded="lg" />
          <h1 className="mt-5 text-2xl font-semibold tracking-[0.18em] text-ink">
            HERMES <span className="text-gold">AI</span>
          </h1>
          <p className="mt-2 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
            {product.privateLabel}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="z-panel mt-8 p-6"
          autoComplete="off"
          aria-label="Private admin login"
        >
          <label htmlFor={inputId} className="mb-2 block text-[12px] font-medium text-ink2">
            Password
          </label>
          <div className="relative">
            <Icon
              name="lock"
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              id={inputId}
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              spellCheck={false}
              className="h-12 w-full rounded-xl border border-line bg-surface2 pr-12 pl-10 text-sm text-ink placeholder:text-muted focus:border-blue/60 focus:outline-none"
              placeholder="Enter access password"
            />
            <button
              type="button"
              onClick={() => setShow((prev) => !prev)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-surface3 hover:text-ink"
            >
              <Icon name={show ? "eyeOff" : "eye"} size={16} />
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-gold text-sm font-semibold text-accentink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Access"}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">{DEV_AUTH_NOTICE}</p>
      </div>
    </div>
  );
}
