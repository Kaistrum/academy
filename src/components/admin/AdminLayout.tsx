import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  BookOpen,
  CreditCard,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  Users,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/tracks", label: "Tracks", icon: Layers, adminOnly: true },
  { href: "/admin/tutors", label: "Tutors", icon: Users, adminOnly: true },
  { href: "/admin/learners", label: "Learners", icon: GraduationCap, adminOnly: true },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

export default function AdminLayout({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, status, isAdmin, isStaff, signOut } = useAuth();

  const isActive = (href: string, exact?: boolean) =>
    exact ? router.pathname === href : router.pathname.startsWith(href);

  // The API enforces this too; the redirect just avoids a wall of 403s.
  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/signin?next=${encodeURIComponent(router.asPath)}`);
    }
  }, [status, router]);

  if (status === "loading" || (status === "anonymous" && !user)) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg text-text-dim">Loading…</div>
    );
  }

  if (!isStaff) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-4 text-center text-text">
        <div>
          <ShieldCheck size={28} className="mx-auto text-text-muted" />
          <h1 className="mt-3 text-xl font-semibold">Staff only</h1>
          <p className="mt-1 text-text-dim">
            This console is for instructors and administrators.
          </p>
          <Link href="/" className="mt-4 inline-block text-accent hover:underline">
            Back to the site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="flex flex-col border-b border-border bg-bg-surface lg:h-screen lg:border-b-0 lg:border-r lg:sticky lg:top-0">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <span className="grid h-8 w-8 place-items-center bg-accent text-text-on-accent">
            <ShieldCheck size={18} strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Kaistrum</p>
            <p className="text-xs text-text-muted">
              {isAdmin ? "Admin console" : "Instructor console"}
            </p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:gap-0.5">
          {nav.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex shrink-0 items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent-faint font-medium text-accent"
                    : "text-text-dim hover:bg-bg-card hover:text-text",
                ].join(" ")}
              >
                <item.icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-border p-3 lg:block">
          <p className="px-3 pb-2 text-xs text-text-muted">
            Signed in as <span className="text-text-dim">{user?.name}</span>
          </p>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-dim hover:text-accent"
          >
            View site <ArrowUpRight size={14} />
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm text-text-dim hover:text-accent"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-nav-bg px-5 py-4 backdrop-blur md:px-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <div className="px-5 py-6 md:px-8">{children}</div>
      </div>
    </div>
  );
}
