import type { ChatMessage, ResponseBlock } from "../../types";
import { aiModes } from "../../data/appConfig";
import { responseToText } from "../../utils/responseText";
import { getTradeById } from "../../data/dataset";
import { cn } from "../../utils/cn";
import { ZyrexLogo } from "../brand/ZyrexLogo";
import { Badge, Panel } from "../ui/Controls";
import { Icon } from "../ui/Icons";
import { MetricsBlock } from "../intelligence/PerformanceCard";
import { RiskCard } from "../intelligence/RiskCard";
import { PsychologyCard } from "../intelligence/PsychologyCard";
import { PatternCard } from "../intelligence/PatternCard";
import { CompactTradeTable } from "../intelligence/TradeTable";
import { Markdown } from "./Markdown";
import { ResponseActions } from "./ResponseActions";

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
            <div className="min-w-0">
              <h4 className="text-[11px] font-semibold tracking-wider text-accent uppercase">
                {block.title}
              </h4>
              <div className="mt-1.5"><Markdown>{block.text}</Markdown></div>
            </div>
          </div>
        </Panel>
      );

    case "trades": {
      const rows = block.tradeIds.map(getTradeById).filter((t): t is NonNullable<typeof t> => Boolean(t));
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
                <Markdown inline>{item}</Markdown>
              </li>
            ))}
          </ol>
        </div>
      );

    case "note":
      return (
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
          <Icon
            name={block.tone === "warn" ? "alert" : "info"}
            size={12}
            className={cn("mt-0.5 shrink-0", block.tone === "warn" && "text-warn")}
          />
          <Markdown inline>{block.text}</Markdown>
        </p>
      );

    default:
      return null;
  }
}

export function AIMessage({ message }: { message: ChatMessage }) {
  const mode = aiModes.find((m) => m.id === message.mode);
  const blocks = message.blocks ?? [];
  const plainText = responseToText(message.title ?? "ZYREX Analysis", blocks);

  return (
    <article className="z-rise flex items-start gap-3" aria-label="ZYREX AI response">
      <span className="mt-0.5 hidden size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface2 sm:grid">
        <ZyrexLogo size={26} orbit />
      </span>

      <div className="min-w-0 flex-1 space-y-3">
        <header className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 sm:hidden">
            <ZyrexLogo size={18} orbit={false} />
          </span>
          <h3 className="text-[11px] font-semibold tracking-[0.16em] text-ink uppercase">
            Zyrex Analysis
          </h3>
          <span className="h-3 w-px bg-line" />
          <span className="text-[11px] font-medium text-ink2">{message.title}</span>
          {mode && <Badge tone="accent">{mode.name}</Badge>}
          {message.simulated && (
            <Badge tone="neutral" icon="info">
              Simulated Response
            </Badge>
          )}
        </header>

        <div className="space-y-3">
          {blocks.map((block, index) => (
            <BlockRenderer key={`${message.id}-${index}`} block={block} />
          ))}
        </div>

        <ResponseActions text={plainText} />
      </div>
    </article>
  );
}
