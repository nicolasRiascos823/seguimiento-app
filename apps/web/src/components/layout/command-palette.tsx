"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Search,
  User,
  UserCog,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommandItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  roles?: Role[];
}

const COMMANDS: CommandItem[] = [
  { id: "dashboard", label: "Panel", href: "/dashboard", icon: LayoutDashboard, keywords: "inicio home" },
  { id: "apprentices", label: "Aprendices", href: "/apprentices", icon: GraduationCap },
  { id: "groups", label: "Fichas", href: "/groups", icon: UsersRound },
  { id: "schedules-group", label: "Horario por ficha", href: "/schedules/group", icon: CalendarDays, keywords: "calendario" },
  { id: "schedules-instructor", label: "Horario por instructor", href: "/schedules/instructor", icon: User, keywords: "calendario" },
  { id: "schedules-environment", label: "Horario por ambiente", href: "/schedules/environment", icon: Building2, keywords: "calendario ambiente" },
  { id: "follow-ups", label: "Seguimiento / Evaluaciones", href: "/follow-ups", icon: ClipboardList, keywords: "matriz" },
  { id: "warnings", label: "Llamados", href: "/warnings", icon: AlertTriangle },
  { id: "reports", label: "Reportes", href: "/reports", icon: FileText, keywords: "pdf" },
  { id: "users", label: "Usuarios", href: "/users", icon: UserCog, roles: ["ADMIN"] },
];

export function CommandPalette() {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const items = useMemo(() => {
    const role = user?.role;
    const visible = COMMANDS.filter(
      (item) => !item.roles || (role && item.roles.includes(role)),
    );
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q) ||
        item.href.includes(q),
    );
  }, [query, user?.role]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-0 px-4 pb-0 pt-4 pr-12">
          <DialogTitle className="sr-only">Buscar en el sistema</DialogTitle>
          <DialogDescription className="sr-only">
            Navegación rápida por módulos
          </DialogDescription>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ir a… (Ctrl/Cmd+K)"
              className="h-10 w-full border-0 bg-transparent pl-7 text-sm outline-none placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter" && items[0]) {
                  e.preventDefault();
                  go(items[0].href);
                }
              }}
            />
          </div>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto border-t border-border p-2">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Sin coincidencias
            </p>
          ) : (
            items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                    index === 0 && query && "bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="font-medium text-foreground">{item.label}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          Enter para abrir · Esc para cerrar
        </div>
      </DialogContent>
    </Dialog>
  );
}
