import { useZyrex } from "../../store/ZyrexProvider";
import { Icon } from "../ui/Icons";

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    deleteConversation,
    startNewConversation,
    page,
    navigate,
  } = useZyrex();

  return (
    <aside className="w-[260px] h-full bg-[#171717] flex flex-col p-3 border-r border-[#2f2f2f] shrink-0 hidden md:flex text-white select-none">
      {/* Top Header / New Chat */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={startNewConversation}
          className="flex-1 flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium rounded-xl bg-[#212121] hover:bg-[#2f2f2f] border border-[#2f2f2f] text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <Icon name="spark" size={16} className="text-white" />
            <span>New chat</span>
          </span>
          <Icon name="plus" size={14} className="text-white" />
        </button>
      </div>

      {/* Nav Section: Recent AI History */}
      <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[#b4b4b4]">
        Recent
      </div>

      {/* Conversations / Recent tabs list */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {conversations.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-[#8e8e8e]">
            No recent AI chats yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <div
                key={conv.id}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-sm cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[#2f2f2f] text-white font-medium"
                    : "text-white hover:bg-[#212121]"
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <div className="flex items-center gap-2.5 truncate mr-2">
                  <Icon name="spark" size={14} className="shrink-0 text-white" />
                  <span className="truncate text-white text-xs">{conv.title}</span>
                </div>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 text-[#8e8e8e] transition-opacity"
                >
                  <Icon name="trash" size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Workspace Navigation */}
      <div className="pt-2 border-t border-[#2f2f2f] space-y-1">
        <button
          type="button"
          onClick={() => navigate("ai")}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
            page === "ai" ? "bg-[#2f2f2f] text-white" : "text-white hover:bg-[#212121]"
          }`}
        >
          <Icon name="spark" size={14} className="text-white" />
          <span>ZYREX AI</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("dashboard")}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
            page === "dashboard" ? "bg-[#2f2f2f] text-white" : "text-white hover:bg-[#212121]"
          }`}
        >
          <Icon name="grid" size={14} className="text-white" />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => navigate("settings")}
          className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
            page === "settings" ? "bg-[#2f2f2f] text-white" : "text-white hover:bg-[#212121]"
          }`}
        >
          <Icon name="settings" size={14} className="text-white" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
