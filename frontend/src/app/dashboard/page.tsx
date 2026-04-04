"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { groupsApi } from "@/lib/api";
import { Group } from "@/types";
import AppShell from "@/components/layout/Appshell";
import Icon from "@/components/ui/Icon";
import CreateGroupModal from "@/components/modals/CreateGroupModal";

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, groups, setGroups, removeGroup, setUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(!user);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAuthChecking(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/users/`,
          { credentials: "include" },
        );
        if (response.ok) {
          const data = await response.json();
          const userData = data.user || data;
          if (userData?.email) {
            setUser(userData);
            setIsAuthChecking(false);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to restore auth:", err);
      }
      router.replace("/login");
    }, 100);

    return () => clearTimeout(timer);
  }, [user, pathname, setUser]);

  useEffect(() => {
    if (isAuthChecking || !user) return;

    const fetchGroups = () => {
      groupsApi
        .list()
        .then(setGroups)
        .catch(() => setError("Failed to load groups."))
        .finally(() => setLoading(false));
    };

    fetchGroups();

    // bfcache restore: Chrome freezes the entire page on navigate-away.
    // JS doesn't re-run, React doesn't remount — pageshow(persisted=true)
    // is the only reliable hook back in.
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) fetchGroups();
    };
    // Tab-switch / window focus
    const onVisible = () => {
      if (!document.hidden) fetchGroups();
    };
    // SPA back-navigation when Next.js router cache serves the component
    // without remounting (popstate fires before the route actually changes)
    const onPopState = () => fetchGroups();

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("popstate", onPopState);
    };
  }, [user, isAuthChecking]);

  const handleDeleteConfirmed = async () => {
    if (confirmDeleteId === null) return;
    setDeleting(true);
    try {
      await groupsApi.remove(confirmDeleteId);
      removeGroup(confirmDeleteId);
    } catch {
      alert("Failed to delete group.");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
      setMenuOpen(null);
    }
  };

  return (
    <AppShell>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-[13px] text-slate-400 mt-1">
              {groups.length} group{groups.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-colors shadow-sm"
          >
            <Icon name="plus" size={14} />
            New Group
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
            <p className="text-[13px] text-red-600 mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[13px] text-red-700 underline"
            >
              Retry
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon
                name="folder"
                size={24}
                stroke={1.5}
                className="text-slate-400"
              />
            </div>
            <h3 className="text-[15px] font-bold text-slate-700 mb-2">
              No groups yet
            </h3>
            <p className="text-[13px] text-slate-400 mb-6">
              Create a group to start organizing your receipts.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-semibold transition-colors"
            >
              <Icon name="plus" size={14} />
              New Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group: Group, idx: number) => (
              <GroupCard
                key={group.id}
                group={group}
                menuOpen={menuOpen === group.id}
                onOpen={() => router.push(`/groups/${group.id}`)}
                onMenuToggle={() =>
                  setMenuOpen(menuOpen === group.id ? null : group.id)
                }
                onDelete={() => {
                  setMenuOpen(null);
                  setConfirmDeleteId(group.id);
                }}
                style={{ animationDelay: `${idx * 0.04}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <CreateGroupModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Delete confirmation modal */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmDeleteId(null)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-xl border border-slate-200 p-6">
            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <Icon name="trash" size={20} className="text-red-500" />
            </div>
            <h2 className="text-[15px] font-bold text-slate-900 mb-1">
              Delete group?
            </h2>
            <p className="text-[13px] text-slate-500 mb-6">
              Group{" "}
              <span className="font-semibold text-slate-700">
                {groups.find((g) => g.id === confirmDeleteId)?.name}
              </span>{" "}
              will be permanently deleted and cannot be recovered.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icon name="trash" size={13} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function GroupCard({
  group,
  menuOpen,
  onOpen,
  onMenuToggle,
  onDelete,
  style,
}: {
  group: Group;
  menuOpen: boolean;
  onOpen: () => void;
  onMenuToggle: () => void;
  onDelete: () => void;
  style?: React.CSSProperties;
}) {
  const visibleCols = group.columns?.slice(0, 3) ?? [];
  const extraCount = (group.columns?.length ?? 0) - visibleCols.length;

  return (
    <div
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group relative"
      style={style}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
          <Icon name="folder" size={20} stroke={1.75} />
        </div>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMenuToggle}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <span className="text-lg leading-none tracking-widest">···</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                onClick={onOpen}
                className="w-full text-left px-3 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Open
              </button>
              <button
                onClick={onDelete}
                className="w-full text-left px-3 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="font-bold text-[14px] text-slate-900 tracking-tight mb-3 truncate">
        {group.name}
      </h3>

      {visibleCols.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {visibleCols.map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[11px] rounded-full truncate max-w-[90px]"
            >
              {col}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[11px] rounded-full">
              +{extraCount} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-slate-400">No columns defined</p>
      )}

      <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100">
        <Icon name="columns" size={11} className="text-slate-400" />
        <span className="text-[11px] text-slate-400">
          {group.columns?.length ?? 0} column
          {(group.columns?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
