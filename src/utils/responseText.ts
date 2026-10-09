import { getTradeById } from "../data/dataset";
import type { ResponseBlock } from "../types";

/**
 * Flatten a structured ZYREX response into plain text.
 *
 * Used for the copy action and to give the backend real conversation context.
 */
export function responseToText(title: string, blocks: ResponseBlock[]): string {
  const lines: string[] = [`ZYREX ANALYSIS — ${title.toUpperCase()}`, ""];
  for (const block of blocks) {
    switch (block.type) {
      case "summary":
        lines.push(block.text, "");
        break;
      case "metrics":
        lines.push(`${block.title.toUpperCase()}`);
        block.rows.forEach((row) => lines.push(`${row.label}: ${row.value}`));
        lines.push("");
        break;
      case "observation":
        lines.push(`${block.title.toUpperCase()}`, block.text, "");
        break;
      case "trades":
        lines.push(block.title.toUpperCase());
        block.tradeIds.forEach((id) => {
          const trade = getTradeById(id);
          if (trade)
            lines.push(
              `${trade.id} ${trade.symbol} ${trade.direction} ${trade.setup} ${trade.rMultiple}R ${trade.netPnl}`,
            );
        });
        lines.push("");
        break;
      case "risk":
        lines.push(block.title.toUpperCase());
        block.items.forEach((item) => lines.push(`${item.label}: ${item.value} — ${item.detail}`));
        lines.push("");
        break;
      case "psychology":
        lines.push(block.title.toUpperCase());
        block.findings.forEach((f) => lines.push(`${f.emotion}: ${f.trades} trades, ${f.winRate}% WR, ${f.avgR}R`));
        lines.push("");
        break;
      case "pattern":
        lines.push(block.insight.title.toUpperCase(), block.insight.statement);
        lines.push(`Confidence: ${block.insight.confidence}%`);
        block.insight.evidence.forEach((item) => lines.push(`- ${item}`));
        lines.push("");
        break;
      case "actions":
        lines.push(block.title.toUpperCase());
        block.items.forEach((item, index) => lines.push(`${index + 1}. ${item}`));
        lines.push("");
        break;
      case "note":
        lines.push(block.text, "");
        break;
    }
  }
  return lines.join("\n");
}
