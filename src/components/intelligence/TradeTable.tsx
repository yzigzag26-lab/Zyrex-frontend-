import type { Trade } from "../../types";
import { cn } from "../../utils/cn";
import { formatDuration, formatR, formatSigned } from "../../utils/format";
import { Badge } from "../ui/Controls";
import { Icon } from "../ui/Icons";

export function DirectionBadge({ direction }: { direction: Trade["direction"] }) {
  return (
    <Badge tone={direction === "long" ? "pos" : "neg"} icon={direction === "long" ? "trendUp" : "trendDown"}>
      {direction === "long" ? "Long" : "Short"}
    </Badge>
  );
}

export function OutcomeBadge({ outcome }: { outcome: Trade["outcome"] }) {
  const map = {
    win: { tone: "pos" as const, label: "Win", icon: "check" as const },
    loss: { tone: "neg" as const, label: "Loss", icon: "trendDown" as const },
    breakeven: { tone: "neutral" as const, label: "BE", icon: "info" as const },
  };
  const meta = map[outcome];
  return (
    <Badge tone={meta.tone} icon={meta.icon}>
      {meta.label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ compact */

export function CompactTradeTable({ trades }: { trades: Trade[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface/60">
      <div className="z-scroll overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left">
          <caption className="sr-only">Trades referenced in this analysis</caption>
          <thead>
            <tr className="border-b border-line bg-surface2/70">
              {["Trade", "Symbol", "Setup", "Session", "R", "Net PnL", ""].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted uppercase"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b border-line/60 last:border-0 hover:bg-surface2/60">
                <td className="z-num px-3 py-2.5 text-[11.5px] font-semibold text-ink">{trade.id}</td>
                <td className="z-num px-3 py-2.5 text-[11.5px] text-ink2">{trade.symbol}</td>
                <td className="max-w-[9rem] truncate px-3 py-2.5 text-[11.5px] text-ink2">{trade.setup}</td>
                <td className="px-3 py-2.5 text-[11.5px] text-ink2">{trade.session}</td>
                <td
                  className={cn(
                    "z-num px-3 py-2.5 text-[11.5px] font-semibold",
                    trade.rMultiple >= 0 ? "text-pos" : "text-neg",
                  )}
                >
                  {formatR(trade.rMultiple)}
                </td>
                <td
                  className={cn(
                    "z-num px-3 py-2.5 text-[11.5px] font-semibold",
                    trade.netPnl >= 0 ? "text-pos" : "text-neg",
                  )}
                >
                  {formatSigned(trade.netPnl)}
                </td>
                <td className="px-3 py-2.5">
                  <OutcomeBadge outcome={trade.outcome} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line bg-surface2/40 px-3 py-2 text-[10px] text-muted">
        {trades.length} journal {trades.length === 1 ? "entry" : "entries"} referenced
      </p>
    </div>
  );
}

/* --------------------------------------------------------------------- full */

interface TradeTableProps {
  trades: Trade[];
  onSelect: (trade: Trade) => void;
  selectedId?: string;
  compactRows?: boolean;
}

export function TradeTable({ trades, onSelect, selectedId }: TradeTableProps) {
  return (
    <>
      {/* Desktop / tablet */}
      <div className="z-scroll hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <caption className="sr-only">Trading journal entries</caption>
          <thead>
            <tr className="border-b border-line">
              {[
                "Date",
                "Trade",
                "Symbol",
                "Side",
                "Setup",
                "Session",
                "Duration",
                "Size",
                "R",
                "Net PnL",
                "Result",
              ].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-3 py-2.5 text-[10px] font-semibold tracking-wider text-muted uppercase"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const isSelected = trade.id === selectedId;
              return (
                <tr
                  key={trade.id}
                  tabIndex={0}
                  onClick={() => onSelect(trade)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(trade);
                    }
                  }}
                  aria-selected={isSelected}
                  className={cn(
                    "cursor-pointer border-b border-line/60 transition-colors last:border-0",
                    isSelected ? "bg-accent/10" : "hover:bg-surface2/70",
                  )}
                >
                  <td className="z-num px-3 py-3 text-[11.5px] whitespace-nowrap text-ink2">{trade.date}</td>
                  <td className="z-num px-3 py-3 text-[11.5px] font-semibold text-ink">{trade.id}</td>
                  <td className="z-num px-3 py-3 text-[11.5px] text-ink2">
                    {trade.symbol}
                    <span className="ml-1.5 text-[10px] text-muted">{trade.market}</span>
                  </td>
                  <td className="px-3 py-3">
                    <DirectionBadge direction={trade.direction} />
                  </td>
                  <td className="max-w-[11rem] truncate px-3 py-3 text-[11.5px] text-ink2">{trade.setup}</td>
                  <td className="px-3 py-3 text-[11.5px] text-ink2">{trade.session}</td>
                  <td className="z-num px-3 py-3 text-[11.5px] whitespace-nowrap text-ink2">
                    {formatDuration(trade.durationMinutes)}
                  </td>
                  <td className="z-num px-3 py-3 text-[11.5px] text-ink2">{trade.positionSize}</td>
                  <td
                    className={cn(
                      "z-num px-3 py-3 text-[11.5px] font-semibold",
                      trade.rMultiple >= 0 ? "text-pos" : "text-neg",
                    )}
                  >
                    {formatR(trade.rMultiple)}
                  </td>
                  <td
                    className={cn(
                      "z-num px-3 py-3 text-[11.5px] font-semibold",
                      trade.netPnl >= 0 ? "text-pos" : "text-neg",
                    )}
                  >
                    {formatSigned(trade.netPnl)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <OutcomeBadge outcome={trade.outcome} />
                      {!trade.ruleFollowed && (
                        <span
                          title={`Rule broken: ${trade.ruleBroken}`}
                          className="text-warn"
                          aria-label={`Rule broken: ${trade.ruleBroken}`}
                        >
                          <Icon name="flag" size={13} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="space-y-2 sm:hidden">
        {trades.map((trade) => (
          <li key={trade.id}>
            <button
              type="button"
              onClick={() => onSelect(trade)}
              className={cn(
                "w-full rounded-2xl border p-3 text-left transition-colors",
                trade.id === selectedId
                  ? "border-accent/40 bg-accent/10"
                  : "border-line bg-surface/70 active:bg-surface2",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="z-num text-[11.5px] font-semibold text-ink">{trade.id}</span>
                  <DirectionBadge direction={trade.direction} />
                </span>
                <OutcomeBadge outcome={trade.outcome} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className="z-num block text-[11px] text-ink2">{trade.symbol}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{trade.setup}</span>
                </span>
                <span className="text-right">
                  <span
                    className={cn(
                      "z-num block text-sm font-semibold",
                      trade.netPnl >= 0 ? "text-pos" : "text-neg",
                    )}
                  >
                    {formatSigned(trade.netPnl)}
                  </span>
                  <span className="z-num mt-0.5 block text-[11px] text-muted">
                    {formatR(trade.rMultiple)}
                  </span>
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted">
                <span className="z-num">
                  {trade.date} · {trade.session} · {formatDuration(trade.durationMinutes)}
                </span>
                {!trade.ruleFollowed && <Icon name="flag" size={12} className="text-warn" />}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
