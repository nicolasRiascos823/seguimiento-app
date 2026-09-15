"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings2,
  Upload,
  User,
  UserCog,
  UsersRound,
  AlertTriangle,
  CalendarRange,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { roleLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/layout/command-palette";

interface NavLeaf {
  type: "link";
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
  /** Match only exact path (avoids /apprentices matching /apprentices/import incorrectly when needed) */
  exact?: boolean;
}

interface NavGroup {
  type: "group";
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
  children: NavLeaf[];
}

type NavEntry = NavLeaf | NavGroup;

const navEntries: NavEntry[] = [
  {
    type: "link",
    href: "/dashboard",
    label: "Panel",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    type: "group",
    id: "aprendices",
    label: "Aprendices",
    icon: GraduationCap,
    children: [
      { type: "link", href: "/apprentices", label: "Listado", icon: GraduationCap },
      { type: "link", href: "/groups", label: "Fichas", icon: UsersRound },
      {
        type: "link",
        href: "/apprentices/import",
        label: "Importar",
        icon: Upload,
        roles: ["ADMIN"],
        exact: true,
      },
    ],
  },
  {
    type: "group",
    id: "programacion",
    label: "Programación",
    icon: CalendarDays,
    children: [
      {
        type: "link",
        href: "/trimesters",
        label: "Trimestres",
        icon: CalendarRange,
        roles: ["ADMIN"],
      },
      {
        type: "link",
        href: "/environments",
        label: "Ambientes",
        icon: Building2,
        roles: ["ADMIN"],
      },
      {
        type: "link",
        href: "/schedules/group",
        label: "Horario por ficha",
        icon: UsersRound,
      },
      {
        type: "link",
        href: "/schedules/instructor",
        label: "Horario por instructor",
        icon: User,
      },
      {
        type: "link",
        href: "/schedules/environment",
        label: "Horario por ambiente",
        icon: Building2,
      },
    ],
  },
  {
    type: "group",
    id: "seguimiento",
    label: "Seguimiento",
    icon: ClipboardList,
    children: [
      { type: "link", href: "/follow-ups", label: "Evaluaciones", icon: ClipboardList },
      { type: "link", href: "/warnings", label: "Llamados", icon: AlertTriangle },
      { type: "link", href: "/reports", label: "Reportes", icon: FileText },
    ],
  },
  {
    type: "group",
    id: "sistema",
    label: "Sistema",
    icon: Settings2,
    roles: ["ADMIN"],
    children: [
      { type: "link", href: "/users", label: "Usuarios", icon: UserCog, roles: ["ADMIN"] },
      { type: "link", href: "/catalogs", label: "Catálogos", icon: BookOpen, roles: ["ADMIN"] },
    ],
  },
];

function isLinkActive(pathname: string, item: NavLeaf): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  if (item.href === "/apprentices") {
    return (
      pathname === "/apprentices" ||
      (pathname.startsWith("/apprentices/") &&
        !pathname.startsWith("/apprentices/import"))
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function filterByRole<T extends { roles?: Role[] }>(
  items: T[],
  role: Role | undefined,
): T[] {
  return items.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );
}

function NavLinkItem({
  item,
  pathname,
  onNavigate,
  nested,
}: {
  item: NavLeaf;
  pathname: string;
  onNavigate?: () => void;
  nested?: boolean;
}) {
  const active = isLinkActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md text-sm font-medium transition-colors duration-150",
        nested ? "px-3 py-2 pl-9" : "px-3 py-2",
        active
          ? "bg-[var(--sidebar-active)] text-white"
          : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-white",
      )}
    >
      {active ? (
        <span
          className={cn(
            "absolute top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand",
            nested ? "left-3" : "left-0",
          )}
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-opacity",
          nested ? "opacity-70" : "opacity-80",
          active && "opacity-100 text-brand",
        )}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroupItem({
  group,
  pathname,
  onNavigate,
  open,
  onToggle,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
  open: boolean;
  onToggle: () => void;
}) {
  const Icon = group.icon;
  const childActive = group.children.some((child) =>
    isLinkActive(pathname, child),
  );

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
          childActive && !open
            ? "bg-[var(--sidebar-active)] text-white"
            : childActive
              ? "text-white"
              : "text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-white",
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 opacity-80",
            childActive && !open && "text-brand opacity-100",
          )}
          aria-hidden
        />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-[var(--sidebar-muted)] transition-transform duration-200 ease-out",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="relative space-y-0.5 pb-1 pt-0.5">
            <span
              className="absolute bottom-1 left-[1.15rem] top-1 w-px bg-[var(--sidebar-border)]"
              aria-hidden
            />
            {group.children.map((child) => (
              <NavLinkItem
                key={child.href}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
                nested
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLinks({
  onNavigate,
  pathname,
  entries,
}: {
  onNavigate?: () => void;
  pathname: string;
  entries: NavEntry[];
}) {
  const activeGroupIds = useMemo(
    () =>
      entries
        .filter(
          (entry): entry is NavGroup =>
            entry.type === "group" &&
            entry.children.some((child) => isLinkActive(pathname, child)),
        )
        .map((entry) => entry.id),
    [entries, pathname],
  );

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(activeGroupIds.map((id) => [id, true])),
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of activeGroupIds) {
        if (!next[id]) {
          next[id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activeGroupIds]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <nav
      className="flex-1 space-y-1 overflow-y-auto px-2.5 py-4"
      aria-label="Navegación principal"
    >
      {entries.map((entry) => {
        if (entry.type === "link") {
          return (
            <NavLinkItem
              key={entry.href}
              item={entry}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          );
        }

        return (
          <NavGroupItem
            key={entry.id}
            group={entry}
            pathname={pathname}
            onNavigate={onNavigate}
            open={!!openGroups[entry.id]}
            onToggle={() => toggleGroup(entry.id)}
          />
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const visibleNav = useMemo(() => {
    const role = user?.role;
    return navEntries
      .map((entry) => {
        if (entry.type === "link") {
          return filterByRole([entry], role)[0];
        }
        if (entry.roles && (!role || !entry.roles.includes(role))) {
          return undefined;
        }
        const children = filterByRole(entry.children, role);
        if (!children.length) return undefined;
        return { ...entry, children };
      })
      .filter((entry): entry is NavEntry => !!entry);
  }, [user?.role]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex items-center justify-between bg-[var(--sidebar)] px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-xs font-bold tracking-wide text-white">
            S
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">
              Seguimiento SENA
            </p>
            <p className="text-xs text-[var(--sidebar-muted)]">{user?.fullName}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setOpen((v) => !v)}
          className="text-white hover:bg-[var(--sidebar-hover)] hover:text-white"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[15.5rem] flex-col bg-[var(--sidebar)] transition-transform duration-200 ease-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="hidden border-b border-[var(--sidebar-border)] px-4 pb-4 pt-5 lg:block">
          <Link href="/dashboard" className="group block">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-xs font-bold tracking-wide text-white shadow-[0_1px_0_rgba(0,0,0,0.2)]">
                S
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold tracking-tight text-white">
                  Seguimiento
                </p>
                <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sidebar-muted)]">
                  SENA · Operate
                </p>
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(new Event("open-command-palette"))
            }
            className="mt-4 flex w-full items-center gap-2 rounded-md bg-[var(--sidebar-hover)] px-3 py-2 text-left text-xs text-[var(--sidebar-muted)] transition-colors hover:bg-white/[0.12] hover:text-white"
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            <span className="flex-1">Buscar…</span>
            <kbd className="rounded border border-[var(--sidebar-border)] bg-black/20 px-1.5 py-0.5 font-sans text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>
        </div>

        <NavLinks
          pathname={pathname}
          entries={visibleNav}
          onNavigate={() => setOpen(false)}
        />

        <div className="mt-auto space-y-2 border-t border-[var(--sidebar-border)] px-3 pb-4 pt-3">
          <div className="rounded-md bg-[var(--sidebar-hover)] px-3 py-2.5">
            <p className="truncate text-sm font-medium text-white">
              {user?.fullName}
            </p>
            <p className="truncate text-xs text-[var(--sidebar-muted)]">
              {user ? roleLabels[user.role] : ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-white"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <div className="lg:pl-[15.5rem]">
        <main className="animate-in mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
