"use client";

import { useEffect, useRef, useState } from "react";
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
            <h1 className="font-display text-3xl font-semibold text-emerald-950">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-emerald-950/60">
              {groups.length} group{groups.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
            <p className="mb-3 text-sm text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-red-700 underline"
            >
              Retry
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white border border-emerald-100 rounded-2xl p-16 text-center shadow-sm shadow-emerald-950/5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon
                name="folder"
                size={24}
                stroke={1.5}
                className="text-emerald-700"
              />
            </div>
            <h3 className="mb-2 text-lg font-bold text-emerald-950">
              No groups yet
            </h3>
            <p className="mb-6 text-sm text-emerald-950/60">
              Create a group to start organizing your receipts.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition-colors hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
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
                onMenuClose={() => setMenuOpen(null)}
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
            <h2 className="mb-1 text-lg font-bold text-emerald-950">
              Delete group?
            </h2>
            <p className="mb-6 text-sm text-emerald-950/65">
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
                className="flex-1 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
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
  onMenuClose,
  onDelete,
  style,
}: {
  group: Group;
  menuOpen: boolean;
  onOpen: () => void;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  onDelete: () => void;
  style?: React.CSSProperties;
}) {
  const visibleCols = group.columns?.slice(0, 3) ?? [];
  const extraCount = (group.columns?.length ?? 0) - visibleCols.length;
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onMenuClose();
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen, onMenuClose]);

  return (
    <div
      className="group relative cursor-pointer rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm shadow-emerald-950/5 transition-transform hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-950/10"
      style={style}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon name="folder" size={20} stroke={1.75} />
        </div>
        <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            aria-label="Group actions"
          >
            <span className="text-lg leading-none tracking-widest">···</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                onClick={onOpen}
                className="w-full px-3 py-2.5 text-left text-sm text-emerald-950 transition-colors hover:bg-emerald-50"
              >
                Open
              </button>
              <button
                onClick={onDelete}
                className="w-full px-3 py-2.5 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="mb-3 truncate text-base font-bold text-emerald-950">
        {group.name}
      </h3>

      {visibleCols.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {visibleCols.map((col) => (
            <span
              key={col}
            className="max-w-[90px] truncate rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
            >
              {col}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-700/70">
              +{extraCount} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-emerald-950/55">No columns defined</p>
      )}

      <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100">
        <Icon name="columns" size={11} className="text-slate-400" />
        <span className="text-xs text-emerald-700/60">
          {group.columns?.length ?? 0} column
          {(group.columns?.length ?? 0) !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
