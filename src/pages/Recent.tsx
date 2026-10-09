import { useZyrex } from "../store/ZyrexProvider";
import { PageShell } from "../components/layout/PageShell";
import { DataUnavailable } from "../components/ui/EmptyStates";
import { Icon } from "../components/ui/Icons";

export function Recent() {
  const { navigate } = useZyrex();

  return (
    <PageShell
      eyebrow="Recent Activity"
      title="Recent"
      subtitle="Your latest trading activities and updates"
      wide
    >
      <div className="z-panel p-6 sm:p-8">
        <DataUnavailable
          title="No recent activity"
          hint="Your recent trades, journal entries, and AI conversations will appear here"
          icon="clock"
          action={
            <button
              type="button"
              onClick={() => navigate("journal")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-surface2 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface3"
            >
              <Icon name="book" size={16} />
              Go to Journal
            </button>
          }
        />
      </div>
    </PageShell>
  );
}
