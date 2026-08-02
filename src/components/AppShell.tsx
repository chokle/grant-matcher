import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Search,
  BarChart3,
  User,
  BookOpen,
  LifeBuoy,
  Menu,
  Leaf,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: LayoutGrid },
  { to: "/discover", label: "Discover Funding", icon: Search },
  { to: "/pipeline", label: "My Pipeline", icon: BarChart3 },
  { to: "/profile", label: "My Business", icon: User },
  { to: "/resource-library", label: "Resources", icon: BookOpen },
  { to: "/help-center", label: "Help Center", icon: LifeBuoy },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="min-w-0 truncate">{item.label}</span>
            {active ? <ChevronRight className="ml-auto size-4 shrink-0 opacity-70" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3 px-6 py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <Leaf className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-lg font-bold text-sidebar-accent-foreground">
          GrantMatch
        </span>
        <span className="block text-xs text-sidebar-foreground/60">Canada</span>
      </span>
    </div>
  );
}

function SidebarFooter() {
  const { user } = useAuth();

  return (
    <div className="safe-bottom mt-auto border-t border-sidebar-border px-6 py-4">
      {user ? (
        <button
          type="button"
          onClick={() => void supabase.auth.signOut()}
          className="flex w-full min-w-0 items-center gap-2 text-left text-xs text-sidebar-foreground/70 transition-colors hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4 shrink-0" />
          <span className="min-w-0 truncate">{user.email}</span>
        </button>
      ) : (
        <Link to="/auth" className="text-xs text-sidebar-foreground/70 hover:text-sidebar-accent-foreground">
          Sign in to save grants
        </Link>
      )}
      <p className="mt-3 text-[11px] leading-tight text-sidebar-foreground/40">
        Canadian Funding Intelligence
        <br />
        Powered by AI
      </p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-sidebar md:flex">
        <Brand />
        <NavList />
        <SidebarFooter />
      </aside>

      <header className="safe-top sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 border-none bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="safe-top flex h-full flex-col">
              <Brand />
              <NavList onNavigate={() => setOpen(false)} />
              <SidebarFooter />
            </div>
          </SheetContent>
        </Sheet>
        <span className="min-w-0 truncate font-display text-base font-bold text-sidebar-accent-foreground">
          GrantMatch Canada
        </span>
      </header>

      <main className="safe-x min-w-0 flex-1 md:ml-64">{children}</main>
    </div>
  );
}
