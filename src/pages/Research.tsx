import { emptyCopy, integrations } from "../data/appConfig";
import { researchProjects } from "../data/dataset";
import { useZyrex } from "../store/ZyrexProvider";
import { PageShell } from "../components/layout/PageShell";
import { Badge, Button, Panel, PanelHeader } from "../components/ui/Controls";
import { ConnectionPill, DataUnavailable, ListPlaceholder } from "../components/ui/EmptyStates";
import { Icon } from "../components/ui/Icons";

/** Structure of a research project — shown so the workspace is self-explanatory. */
const projectSections = [
  { title: "Research Notes", detail: "Method and working hypotheses", icon: "book" as const },
  { title: "Findings", detail: "Confidence-scored observations", icon: "cpu" as const },
  { title: "Conclusions", detail: "What you take forward", icon: "check" as const },
  { title: "Evidence", detail: "Charts and supporting snapshots", icon: "layers" as const },
];

export function Research() {
  const { aiStatus, aiStatusLabel } = useZyrex();
  const hasProjects = researchProjects.length > 0;

  return (
    <PageShell
      eyebrow="Investigation Workspace"
      title="Research"
      subtitle="Hypothesis-driven investigation of your own trading data — questions, notes, findings, conclusions and evidence."
      wide
      actions={
        <>
          <Badge tone="neutral" icon="flask">
            {researchProjects.length} projects
          </Badge>
          <Button variant="primary" size="sm" icon="plus">
            New project
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        <Panel>
          <PanelHeader title="Research Projects" subtitle="Your investigations" icon="flask" />
          {hasProjects ? (
            <ul className="space-y-1.5 p-3">
              {researchProjects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-line bg-surface/60 p-3 text-left transition-all hover:border-linestrong hover:bg-surface2"
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-[12.5px] leading-snug font-semibold text-ink">
                        {project.title}
                      </span>
                      <Badge tone="neutral">{project.status}</Badge>
                    </span>
                    <span className="mt-1.5 block text-[11px] leading-relaxed text-ink2">
                      {project.question}
                    </span>
                    <span className="z-num mt-2 block text-[10px] text-muted">
                      {project.tradesReviewed} trades reviewed
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3">
              <div className="rounded-xl border border-dashed border-line bg-surface2/30 px-3 py-6 text-center">
                <span className="mx-auto grid size-10 place-items-center rounded-xl border border-dashed border-line bg-surface/60 text-muted">
                  <Icon name="flask" size={16} />
                </span>
                <p className="mt-3 text-[12px] font-semibold text-ink">
                  {emptyCopy.research.title}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                  {emptyCopy.research.hint}
                </p>
                <Button size="sm" variant="subtle" icon="plus" className="mt-4">
                  Create project
                </Button>
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel className="z-rise">
            <div className="flex flex-col items-start gap-5 p-5 sm:p-7">
              <div className="w-full">
                <ConnectionPill state={aiStatus} label={aiStatusLabel} />
                <h2 className="mt-4 text-xl font-semibold text-ink sm:text-[1.5rem]">
                  {emptyCopy.research.title}
                </h2>
                <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed text-ink2">
                  {emptyCopy.research.hint}
                </p>
                <p className="mt-3 max-w-lg text-[11.5px] leading-relaxed text-muted">
                  Research projects run against your journal. Once trades exist and the ZYREX AI
                  backend is connected, each project can review entries, score findings and record
                  conclusions with evidence.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm" icon="plus">
                    Create research project
                  </Button>
                  <Button variant="subtle" size="sm" icon="spark">
                    Connect ZYREX AI
                  </Button>
                </div>
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2">
            {projectSections.map((section) => (
              <Panel key={section.title}>
                <PanelHeader title={section.title} subtitle={section.detail} icon={section.icon} />
                <div className="p-4 sm:p-5">
                  <ListPlaceholder rows={2} label={`${section.title} empty`} />
                  <p className="mt-3 text-[10.5px] text-muted">
                    No {section.title.toLowerCase()} recorded yet
                  </p>
                </div>
              </Panel>
            ))}
          </div>

          <Panel>
            <PanelHeader
              title="Research Requirements"
              subtitle="What a project needs before it can run"
              icon="shield"
            />
            <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
              <DataUnavailable
                title="No trade history"
                hint="Projects review real journal entries — import or create trades first."
                icon="layers"
                size="sm"
              />
              <DataUnavailable
                title="AI backend not connected"
                hint={integrations.ai.requiredFor}
                icon="spark"
                size="sm"
              />
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
