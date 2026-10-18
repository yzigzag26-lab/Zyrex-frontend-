import { FormEvent, useState } from "react";
import { emptyCopy } from "../data/appConfig";
import { useZyrex } from "../store/ZyrexProvider";
import { PageShell } from "../components/layout/PageShell";
import { Button, Panel } from "../components/ui/Controls";
import { DataUnavailable } from "../components/ui/EmptyStates";
import { Dialog } from "../components/ui/Dialog";

export function StrategiesPage() {
  const { strategies, addStrategy, deleteStrategy, setFeedback } = useZyrex();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [market, setMarket] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [risk, setRisk] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const result = addStrategy({
      name: name.trim(),
      description: description.trim(),
      rules: rules.trim(),
      market: market.trim() || "Unspecified",
      timeframe: timeframe.trim() || "Unspecified",
      riskParameters: risk.trim(),
    });
    setFeedback(result);
    setOpen(false);
    setName("");
    setDescription("");
    setRules("");
    setMarket("");
    setTimeframe("");
    setRisk("");
  };

  return (
    <PageShell
      eyebrow="Playbook"
      title="Strategies"
      subtitle="Store draft rules and parameters. Backtesting, paper trading and live execution are not connected."
      actions={
        <Button variant="primary" size="sm" icon="plus" onClick={() => setOpen(true)}>
          Create Strategy
        </Button>
      }
    >
      {strategies.length === 0 ? (
        <Panel>
          <DataUnavailable
            title={emptyCopy.strategies.title}
            hint={emptyCopy.strategies.hint}
            icon="target"
            size="lg"
            action={
              <Button variant="primary" size="sm" icon="plus" onClick={() => setOpen(true)}>
                Create Strategy
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {strategies.map((strategy) => (
            <Panel key={strategy.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-wide text-gold uppercase">
                    {strategy.status} · v{strategy.version}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-ink">{strategy.name}</h3>
                </div>
                <button
                  type="button"
                  className="text-[12px] text-muted hover:text-neg"
                  onClick={() => {
                    if (window.confirm(`Delete draft “${strategy.name}”?`)) {
                      setFeedback(deleteStrategy(strategy.id));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink2">{strategy.description || "No description"}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-ink2">
                <div>
                  <dt className="text-muted">Market</dt>
                  <dd>{strategy.market}</dd>
                </div>
                <div>
                  <dt className="text-muted">Timeframe</dt>
                  <dd>{strategy.timeframe}</dd>
                </div>
              </dl>
              {strategy.rules && <p className="mt-3 whitespace-pre-wrap text-[12.5px] text-ink2">{strategy.rules}</p>}
              <p className="mt-3 text-[11px] text-muted">Draft only — not executable.</p>
            </Panel>
          ))}
        </div>
      )}

      <Dialog open={open} title="Create strategy" onClose={() => setOpen(false)} wide>
        <form onSubmit={submit} className="p-5">
          <h3 className="text-base font-semibold text-ink">Create strategy</h3>
          <p className="mt-1 text-[12px] text-ink2">Saved as a local draft. Nothing is backtested or sent to a broker.</p>
          <div className="mt-4 space-y-3">
            <Field label="Strategy name" value={name} onChange={setName} required />
            <Field label="Description" value={description} onChange={setDescription} multiline />
            <Field label="Rules" value={rules} onChange={setRules} multiline />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Market" value={market} onChange={setMarket} />
              <Field label="Timeframe" value={timeframe} onChange={setTimeframe} />
            </div>
            <Field label="Risk parameters" value={risk} onChange={setRisk} />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!name.trim()} type="submit">
              Save draft
            </Button>
          </div>
        </form>
      </Dialog>
    </PageShell>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-ink2">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-line bg-surface2 px-3 py-2 text-sm text-ink"
        />
      ) : (
        <input
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-line bg-surface2 px-3 text-sm text-ink"
        />
      )}
    </label>
  );
}
