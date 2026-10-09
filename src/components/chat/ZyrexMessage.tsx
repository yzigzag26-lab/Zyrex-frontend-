import { capabilities, product } from "../../data/appConfig";
import { getTradeById } from "../../data/dataset";
import type { ChatMessage, ResponseBlock } from "../../types";
import { cn } from "../../utils/cn";
import { ZyrexLogo } from "../brand/ZyrexLogo";
import { Badge, Panel } from "../ui/Controls";
import { ConnectionPill } from "../ui/EmptyStates";
import { Icon } from "../ui/Icons";
import { MetricsBlock } from "../intelligence/PerformanceCard";
import { RiskCard } from "../intelligence/RiskCard";
import { PsychologyCard } from "../intelligence/PsychologyCard";
import { PatternCard } from "../intelligence/PatternCard";
import { CompactTradeTable } from "../intelligence/TradeTable";
import { Markdown } from "./Markdown";
import { MessageActions } from "./MessageActions";

/* --------------------------------------------------------------------------
 * Block renderer — the contract for real ZYREX AI payloads.
 *
 * The backend is not connected yet, so nothing currently produces these
 * blocks. The renderer is kept intact so a live response can be displayed
 * the moment one exists, with no UI changes.
 * ------------------------------------------------------------------------ */
function BlockRenderer({ block }: { block: ResponseBlock }) {
  switch (block.type) {
    case "summary":
      return (
        <div className="relative rounded-2xl border border-line bg-surface/60 py-3 pr-4 pl-4 sm:pl-5">
          <span className="absolute top-3.5 bottom-3.5 left-0 w-[2.5px] rounded-full bg-gradient-to-b from-orange-400 via-orange-500 to-amber-500" />
          <Markdown>{block.text}</Markdown>
        </div>
      );

    case "metrics":
      return <MetricsBlock title={block.title} rows={block.rows} />;

    case "observation":
      return (
        <Panel className="bg-surface/60">
          <div className="flex items-start gap-3 p-3.5 sm:p-4">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent">
              <Icon name="search" size={14} />
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-[11px] font-semibold tracking-wider text-accent uppercase">
                {block.title}
              </h4>
              <div className="mt-1.5"><Markdown>{block.text}</Markdown></div>
            </div>
          </div>
        </Panel>
      );

    case "trades": {
      const rows = block.tradeIds
        .map(getTradeById)
        .filter((trade): trade is NonNullable<typeof trade> => Boolean(trade));
      if (rows.length === 0) return null;
      return <CompactTradeTable trades={rows} />;
    }

    case "risk":
      return (
        <div className="rounded-2xl border border-line bg-surface/60 p-3.5 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{block.title}</h4>
            <Icon name="shield" size={13} className="text-muted" />
          </div>
          <RiskCard items={block.items} variant="inline" />
        </div>
      );

    case "psychology":
      return (
        <div className="rounded-2xl border border-line bg-surface/60 p-3.5 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{block.title}</h4>
            <Icon name="brain" size={13} className="text-muted" />
          </div>
          <PsychologyCard findings={block.findings} variant="inline" />
        </div>
      );

    case "pattern":
      return <PatternCard insight={block.insight} variant="inline" title="Pattern Confidence" />;

    case "actions":
      return (
        <div className="rounded-2xl border border-line bg-surface/60 p-3.5 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-semibold tracking-wider text-muted uppercase">{block.title}</h4>
            <Icon name="zap" size={13} className="text-muted" />
          </div>
          <ol className="space-y-2">
            {block.items.map((item, index) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="z-num mt-px grid size-5 shrink-0 place-items-center rounded-md border border-line bg-surface2 text-[10px] font-semibold text-ink2">
                  {index + 1}
                </span>
                <span className="text-[12.5px] leading-relaxed text-ink">
                  <Markdown inline>{item}</Markdown>
                </span>
              </li>
            ))}
          </ol>
        </div>
      );

    case "note":
      return (
        <div className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <Icon
            name={block.tone === "warn" ? "alert" : "info"}
            size={12}
            className={cn("mt-0.5 shrink-0", block.tone === "warn" && "text-warn")}
          />
          <Markdown inline>{block.text}</Markdown>
        </div>
      );

    default:
      return null;
  }
}

/* -------------------------------------------------------------- offline view */

/**
 * The only ZYREX output rendered while the backend is disconnected.
 * States capability, not intelligence.
 */
function OfflineNotice({ reason }: { reason: string }) {
  return (
    <div className="space-y-4">
      <Panel className="bg-surface/70">
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <h3 className="text-base font-semibold text-ink sm:text-[1.0625rem]">
              Hello, I&rsquo;m ZYREX AI.
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink2">
              Your personal trading intelligence system.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-y border-line py-3">
            <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
              Current Status
            </span>
            <ConnectionPill state="disconnected" label="Offline" />
          </div>

          <div>
            <p className="z-eyebrow mb-2.5">Capabilities</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <li
                  key={capability.id}
                  className="flex items-start gap-2.5 rounded-xl border border-line bg-surface2/50 px-3 py-2.5"
                >
                  <Icon name={capability.icon} size={14} className="mt-0.5 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-medium text-ink">{capability.label}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-relaxed text-muted">
                      {capability.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-dashed border-line bg-surface2/40 px-3 py-2.5 text-[11.5px] leading-relaxed text-ink2">
            <Icon name="info" size={13} className="mt-0.5 shrink-0 text-accent" />
            {product.offlineDetail}
          </p>
        </div>
      </Panel>

      {reason && (
        <p className="text-[11px] leading-relaxed text-muted">
          <span className="font-semibold text-ink2">Connection report:</span> {reason}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ message */

export function ZyrexMessage({ message }: { message: ChatMessage }) {
  const isOffline = message.kind === "offline";
  const blocks = message.blocks ?? [];
  const plainText = isOffline
    ? `${product.name} — ${product.offlineTitle}\n\n${product.offlineDetail}`
    : blocks.map((block) => ("text" in block ? block.text : "")).join("\n");

  return (
    <article className="z-rise flex items-start gap-3" aria-label="ZYREX AI message">
      <span className="mt-0.5 hidden size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface2 sm:grid">
        <ZyrexLogo size={26} orbit state={isOffline ? "off" : "idle"} />
      </span>

      <div className="min-w-0 flex-1 space-y-3">
        <header className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 sm:hidden">
            <ZyrexLogo size={18} orbit={false} state={isOffline ? "off" : "idle"} />
          </span>
          <h3 className="text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
            {isOffline ? "ZYREX AI" : "ZYREX Analysis"}
          </h3>
          {isOffline && <Badge tone="neutral" icon="info">Not connected</Badge>}
        </header>

        {isOffline ? (
          <OfflineNotice reason={message.title ?? ""} />
        ) : (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <BlockRenderer key={`${message.id}-${index}`} block={block} />
            ))}
          </div>
        )}

        <MessageActions text={plainText} />
      </div>
    </article>
  );
}
