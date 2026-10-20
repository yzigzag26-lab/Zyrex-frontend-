import { useState } from "react";
import { useAuth } from "../../auth/AuthProvider";
import { navItems, product } from "../../data/appConfig";
import { useZyrex } from "../../store/ZyrexProvider";
import type { Conversation } from "../../types";
import { cn } from "../../utils/cn";
import { HermesLogo } from "../brand/HermesLogo";
import { Icon, type IconName } from "../ui/Icons";
import { Popover } from "../ui/Popover";
import { DeleteConversationDialog } from "./DeleteConversationDialog";

export function Sidebar() {
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);
  const {
    conversations,
    activeConversationId,
    selectConversation,
    startNewConversation,
    page,
    navigate,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarOpen,
    setSidebarOpen,
    isMobile,
    profile,
  } = useZyrex();
  const { signOut } = useAuth();

  const collapsed = !isMobile && sidebarCollapsed;
  const visible = isMobile ? sidebarOpen : true;

  const pinned = conversations.filter((conversation) => conversation.pinned);
  const recent = conversations.filter((conversation) => !conversation.pinned);

  const body = (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-line bg-elev text-ink",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className={cn("flex items-center gap-2 px-3 pt-3 pb-2", collapsed && "justify-center px-2")}>
        <button
          type="button"
          onClick={() => navigate("dashboard")}
          className={cn("flex min-w-0 items-center gap-2 rounded-lg p-1", collapsed && "justify-center")}
          aria-label="HERMES AI home"
        >
          <HermesLogo size={collapsed ? 32 : 34} />
          {!collapsed && (
            <span className="min-w-0 text-left">
              <span className="block text-[13px] font-semibold tracking-[0.14em] text-ink">
                HERMES <span className="text-gold">AI</span>
              </span>
              <span className="mt-0.5 block text-[9.5px] tracking-[0.14em] text-muted uppercase">
                {product.privateLabel}
              </span>
            </span>
          )}
        </button>
        {!isMobile && (
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "ml-auto grid size-8 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-ink",
              collapsed && "ml-0",
            )}
          >
            <Icon name="panelLeft" size={15} />
          </button>
        )}
      </div>

      <div className="px-2 pb-2">
        <button
          type="button"
          onClick={startNewConversation}
          title="New chat"
          className={cn(
            "flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface2",
            collapsed && "justify-center px-0",
          )}
        >
          <Icon name="plus" size={16} />
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      <nav className="px-2" aria-label="Primary">
        {navItems.map((item) => {
          const active = page === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              title={item.label}
              className={cn(
                "mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                collapsed && "justify-center px-0",
                active ? "bg-surface2 text-ink" : "text-ink2 hover:bg-surface2 hover:text-ink",
              )}
            >
              <Icon name={item.icon as IconName} size={16} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="z-scroll mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {!collapsed && (
          <>
            {pinned.length > 0 && (
              <p className="px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted uppercase">Pinned</p>
            )}
            {pinned.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                title={conversation.title}
                active={conversation.id === activeConversationId}
                pinned
                onSelect={() => selectConversation(conversation.id)}
                onDelete={() => setPendingDelete(conversation)}
              />
            ))}
            <p className="mt-2 px-2 pb-1 text-[10px] font-semibold tracking-wider text-muted uppercase">Chats</p>
            {recent.length === 0 && pinned.length === 0 ? (
              <p className="px-2 py-4 text-center text-[11px] text-muted">No conversations yet</p>
            ) : (
              recent.map((conversation) => (
                <ConversationRow
                  key={conversation.id}
                  title={conversation.title}
                  active={conversation.id === activeConversationId}
                  onSelect={() => selectConversation(conversation.id)}
                  onDelete={() => setPendingDelete(conversation)}
                />
              ))
            )}
          </>
        )}
      </div>

      <div className="border-t border-line p-2">
        <Popover
          label="Account menu"
          widthClass="w-56"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-2 py-2 hover:bg-surface2",
                collapsed && "justify-center",
              )}
            >
              {profile.imageDataUrl ? (
                <img
                  src={profile.imageDataUrl}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="grid size-8 place-items-center rounded-full bg-surface3 text-[11px] font-semibold">
                  {profile.displayName.slice(0, 2).toUpperCase()}
                </span>
              )}
              {!collapsed && (
                <span className="min-w-0 text-left">
                  <span className="block truncate text-[12px] font-semibold">{profile.displayName}</span>
                  <span className="block truncate text-[10px] text-muted">Admin · Private</span>
                </span>
              )}
            </button>
          )}
        >
          {() => (
            <div className="p-1">
              <button
                type="button"
                onClick={() => navigate("settings")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-surface2"
              >
                <Icon name="settings" size={14} />
                Settings
              </button>
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-ink hover:bg-surface2"
              >
                <Icon name="logout" size={14} />
                Log out
              </button>
            </div>
          )}
        </Popover>
      </div>

      <DeleteConversationDialog
        conversation={pendingDelete}
        onClose={() => setPendingDelete(null)}
      />
    </aside>
  );

  if (isMobile) {
    if (!visible) return null;
    return (
      <div className="fixed inset-0 z-50 flex">
        <button
          type="button"
          aria-label="Close navigation"
          className="absolute inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative z-10 h-full">{body}</div>
      </div>
    );
  }

  return body;
}

function ConversationRow({
  title,
  active,
  pinned,
  onSelect,
  onDelete,
}: {
  title: string;
  active: boolean;
  pinned?: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative mb-0.5 flex items-center rounded-xl px-2.5 py-2 text-[12.5px]",
        active ? "bg-surface2 text-ink" : "text-ink2 hover:bg-surface2 hover:text-ink",
      )}
    >
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <Icon name={pinned ? "pin" : "spark"} size={13} className="shrink-0" />
        <span className="truncate">{title}</span>
      </button>
      <button
        type="button"
        aria-label="Delete conversation"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 hover:text-neg"
      >
        <Icon name="trash" size={12} />
      </button>
    </div>
  );
}
