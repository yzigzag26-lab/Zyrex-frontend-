import { useMemo, useState } from "react";
import { emptyCopy, journalSchema } from "../data/appConfig";
import { trades as datasetTrades } from "../data/dataset";
import type { Trade } from "../types";
import { PageShell } from "../components/layout/PageShell";
import { TradeTable } from "../components/intelligence/TradeTable";
import { Badge, Button, Panel, PanelHeader, Select } from "../components/ui/Controls";
import { DataUnavailable } from "../components/ui/EmptyStates";
import { Icon } from "../components/ui/Icons";

/** Import options — UI affordances only, no importer is connected. */
const importSources = [
  { label: "Exchange account link", detail: "Read-only sync of your trade history", icon: "user" as const },
  { label: "CSV / spreadsheet upload", detail: "Map columns to the journal schema", icon: "download" as const },
  { label: "Manual journal entry", detail: "Log a single trade against the full schema", icon: "book" as const },
];

/** The locked journal schema, presented as a reference. */
function SchemaPanel() {
  return (
    <Panel>
      <PanelHeader
        title="Journal Schema"
        subtitle="Every entry captures these locked field groups"
        icon="layers"
        actions={<Badge tone="neutral">{journalSchema.length} groups</Badge>}
      />
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {journalSchema.map((group) => (
          <div key={group.key} className="rounded-xl border border-line bg-surface/60 p-3.5">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-line bg-surface2 text-accent">
                <Icon name={group.icon} size={13} />
              </span>
              <div className="min-w-0">
                <h3 className="text-[12.5px] font-semibold text-ink">{group.title}</h3>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted">{group.description}</p>
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {group.fields.map((field) => (
                <li
                  key={field}
                  className="rounded-md border border-dashed border-line bg-surface2/50 px-1.5 py-0.5 text-[10px] text-ink2"
                >
                  {field}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function JournalPage() {
  const [query, setQuery] = useState("");
  const [session, setSession] = useState("All");
  const [selected, setSelected] = useState<Trade | null>(null);
  const hasTrades = datasetTrades.length > 0;

  const filtered = useMemo(() => {
    if (!hasTrades) return [];
    return datasetTrades.filter((trade) => {
      const matchesQuery =
        query.trim() === "" ||
        [trade.id, trade.symbol, trade.setup, trade.entryReason, trade.lessonLearned]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesSession = session === "All" || trade.session === session;
      return matchesQuery && matchesSession;
    });
  }, [hasTrades, query, session]);

  return (
    <PageShell
      eyebrow="Trading Journal"
      title="Journal"
      subtitle="Every entry captures identity, timing, plan, execution, result, psychology, mistakes, review and evidence."
      wide
      actions={
        <>
          <Button variant="subtle" size="sm" icon="download">
            Import trades
          </Button>
          <Button variant="primary" size="sm" icon="plus">
            New entry
          </Button>
        </>
      }
    >
      <Panel>
        <PanelHeader
          title="Journal Entries"
          subtitle={hasTrades ? `${filtered.length} entries match your filters` : "No trade history yet"}
          icon="book"
          actions={<Badge tone="neutral">{datasetTrades.length} recorded</Badge>}
        />

        {hasTrades && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-3 sm:px-4">
            <div className="relative min-w-[10rem] flex-1">
              <Icon
                name="search"
                size={14}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ID, symbol, setup or lesson…"
                aria-label="Search journal entries"
                className="h-9 w-full rounded-xl border border-line bg-surface2 pr-3 pl-9 text-xs text-ink placeholder:text-muted focus:border-accent/50 focus:outline-none"
              />
            </div>
            <Select
              label="Filter by session"
              value={session}
              onChange={setSession}
              options={["All", "Asia", "London", "New York"]}
              className="w-[8.5rem]"
            />
          </div>
        )}

        <div className="p-2 sm:p-3">
          {filtered.length > 0 ? (
            <TradeTable trades={filtered} onSelect={setSelected} selectedId={selected?.id} />
          ) : (
            <DataUnavailable
              title={emptyCopy.journal.title}
              hint={emptyCopy.journal.hint}
              icon="book"
              size="lg"
              action={
                <>
                  <Button size="sm" variant="primary" icon="download">
                    Import trades
                  </Button>
                  <Button size="sm" variant="subtle" icon="plus">
                    Create journal entry
                  </Button>
                </>
              }
            />
          )}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        {importSources.map((source) => (
          <Panel key={source.label} interactive>
            <button
              type="button"
              className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
              title="Importer not connected yet"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface2 text-accent">
                <Icon name={source.icon} size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink">{source.label}</span>
                <span className="mt-1 block text-[11.5px] leading-relaxed text-ink2">
                  {source.detail}
                </span>
                <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-line px-1.5 py-0.5 text-[9.5px] font-medium tracking-wide text-muted uppercase">
                  <Icon name="info" size={10} />
                  Not connected
                </span>
              </span>
            </button>
          </Panel>
        ))}
      </div>

      <SchemaPanel />
    </PageShell>
  );
}
