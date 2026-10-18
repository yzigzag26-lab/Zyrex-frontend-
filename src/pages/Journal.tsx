import { FormEvent, useMemo, useState } from "react";
import { emptyCopy } from "../data/appConfig";
import { useZyrex } from "../store/ZyrexProvider";
import type { JournalEntry, JournalSource } from "../types";
import { PageShell } from "../components/layout/PageShell";
import { Badge, Button, Panel, Select } from "../components/ui/Controls";
import { DataUnavailable } from "../components/ui/EmptyStates";
import { Icon } from "../components/ui/Icons";
import { Dialog } from "../components/ui/Dialog";

const sourceLabel: Record<JournalSource, string> = {
  "ai-analysis": "AI Analysis",
  "manual-note": "Manual Note",
  "imported-trade": "Imported Trade",
};

export function JournalPage() {
  const { journal, addJournalEntry, updateJournalEntry, deleteJournalEntry, setFeedback } = useZyrex();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All");
  const [editor, setEditor] = useState<null | Partial<JournalEntry>>(null);

  const filtered = useMemo(() => {
    return journal.filter((entry) => {
      const matchesQuery =
        query.trim() === "" ||
        [entry.title, entry.content, entry.market, entry.tags.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesSource = source === "All" || entry.source === source;
      return matchesQuery && matchesSource;
    });
  }, [journal, query, source]);

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!editor?.title?.trim() || !editor.content?.trim()) return;
    if (editor.id) {
      setFeedback(
        updateJournalEntry(editor.id, {
          title: editor.title.trim(),
          content: editor.content.trim(),
          market: editor.market,
          tags: editor.tags ?? [],
        }),
      );
    } else {
      setFeedback(
        addJournalEntry({
          title: editor.title.trim(),
          date: new Date().toISOString().slice(0, 10),
          content: editor.content.trim(),
          market: editor.market,
          tags: editor.tags ?? [],
          source: "manual-note",
        }),
      );
    }
    setEditor(null);
  };

  return (
    <PageShell
      eyebrow="Records"
      title="Journal"
      subtitle="Analyses, notes and imported trades. Hypothetical analysis is never labelled as an executed trade."
      actions={
        <Button variant="primary" size="sm" icon="plus" onClick={() => setEditor({ title: "", content: "", tags: [] })}>
          New note
        </Button>
      }
    >
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <div className="relative min-w-[12rem] flex-1">
            <Icon
              name="search"
              size={14}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, content, market or tags…"
              aria-label="Search journal"
              className="h-9 w-full rounded-xl border border-line bg-surface2 pr-3 pl-9 text-xs text-ink placeholder:text-muted focus:border-blue/50 focus:outline-none"
            />
          </div>
          <Select
            label="Filter by source"
            value={source}
            onChange={setSource}
            options={["All", "ai-analysis", "manual-note", "imported-trade"]}
            className="w-[11rem]"
          />
        </div>

        {filtered.length === 0 ? (
          <DataUnavailable
            title={emptyCopy.journal.title}
            hint={emptyCopy.journal.hint}
            icon="book"
            size="lg"
            action={
              <Button variant="primary" size="sm" icon="plus" onClick={() => setEditor({ title: "", content: "", tags: [] })}>
                Write a note
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((entry) => (
              <li key={entry.id} className="px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{entry.title}</h3>
                      <Badge tone={entry.source === "imported-trade" ? "warn" : "neutral"}>
                        {sourceLabel[entry.source]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] text-muted">
                      {entry.date}
                      {entry.market ? ` · ${entry.market}` : ""}
                    </p>
                    <p className="mt-2 max-w-3xl text-[13px] leading-relaxed whitespace-pre-wrap text-ink2">
                      {entry.content.length > 360 ? `${entry.content.slice(0, 360)}…` : entry.content}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="xs" variant="ghost" onClick={() => setEditor(entry)}>
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm("Delete this journal entry?")) {
                          setFeedback(deleteJournalEntry(entry.id));
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={Boolean(editor)} title="Journal entry" onClose={() => setEditor(null)} wide>
        {editor && (
          <form onSubmit={save} className="p-5">
            <h3 className="text-base font-semibold text-ink">{editor.id ? "Edit entry" : "New note"}</h3>
            <label className="mt-4 block text-[12px] font-medium text-ink2">Title</label>
            <input
              value={editor.title ?? ""}
              onChange={(e) => setEditor({ ...editor, title: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-surface2 px-3 text-sm"
              required
            />
            <label className="mt-3 block text-[12px] font-medium text-ink2">Market (optional)</label>
            <input
              value={editor.market ?? ""}
              onChange={(e) => setEditor({ ...editor, market: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-line bg-surface2 px-3 text-sm"
            />
            <label className="mt-3 block text-[12px] font-medium text-ink2">Content</label>
            <textarea
              value={editor.content ?? ""}
              onChange={(e) => setEditor({ ...editor, content: e.target.value })}
              rows={8}
              required
              className="mt-1 w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-sm"
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditor(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </PageShell>
  );
}
