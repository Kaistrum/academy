import { type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  BookOpen,
  CreditCard,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Users,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/tracks", label: "Tracks", icon: Layers },
  { href: "/admin/tutors", label: "Tutors", icon: Users },
  { href: "/admin/learners", label: "Learners", icon: GraduationCap },
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

  const isActive = (href: string, exact?: boolean) =>
    exact ? router.pathname === href : router.pathname.startsWith(href);

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
            <p className="text-xs text-text-muted">Admin console</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:gap-0.5">
          {nav.map((item) => {
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
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-dim hover:text-accent"
          >
            View site <ArrowUpRight size={14} />
          </Link>
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
