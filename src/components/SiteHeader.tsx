import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ThemeToggle } from "@kaistrum/stratum-ui";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { categories, courses } from "@/data/courses";
import { categoryIcons } from "@/components/categoryIcons";

const navLinks = [
	{ label: "Explore tracks", href: "/tracks" },
	{ label: "My learning", href: "/my-learning" },
	{ label: "Saved", href: "/favourites" },
	{ label: "For teams", href: "/#teams" }
];

function coursesForTrack(name: string) {
	return courses.filter((c) => c.category === name).slice(0, 3);
}

function Logo() {
	return (
		<Link href="/" className="flex items-center gap-2.5" aria-label="Kaistrum Academy home">
			<Image src="/logo.png" alt="" height={30} width={32} className="object-contain" priority />
			<span className="text-lg font-bold uppercase tracking-widest text-text">
				Kaistrum <span className="text-sm text-text-dim">Academy</span>
			</span>
		</Link>
	);
}

export default function SiteHeader() {
	const router = useRouter();
	const [megaOpen, setMegaOpen] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const headerRef = useRef<HTMLElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	function openMega() {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		setMegaOpen(true);
	}
	// Delay closing so the pointer can travel from the trigger to the panel.
	function closeMega() {
		if (closeTimer.current) clearTimeout(closeTimer.current);
		closeTimer.current = setTimeout(() => setMegaOpen(false), 120);
	}

	// Close menus on route change.
	useEffect(() => {
		const close = () => {
			setMegaOpen(false);
			setMobileOpen(false);
		};
		router.events.on("routeChangeStart", close);
		return () => router.events.off("routeChangeStart", close);
	}, [router.events]);

	// Close on outside click / Escape.
	useEffect(() => {
		function onClick(e: MouseEvent) {
			if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
				setMegaOpen(false);
			}
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setMegaOpen(false);
		}
		document.addEventListener("mousedown", onClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onClick);
			document.removeEventListener("keydown", onKey);
		};
	}, []);

	return (
		<header
			ref={headerRef}
			className="sticky top-0 z-40 border-b border-border bg-nav-bg backdrop-blur"
		>
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
				<Logo />

				{/* Desktop nav */}
				<nav className="hidden items-center gap-1 lg:flex">
					<div onMouseEnter={openMega} onMouseLeave={closeMega}>
						<button
							type="button"
							aria-expanded={megaOpen}
							onClick={() => setMegaOpen((v) => !v)}
							className="inline-flex items-center gap-1 px-3 py-2 text-sm text-text-dim transition-colors hover:text-text"
						>
							Courses
							<ChevronDown
								size={15}
								className={`transition-transform ${megaOpen ? "rotate-180" : ""}`}
							/>
						</button>
					</div>

					{navLinks.map((l) => (
						<Link
							key={l.href}
							href={l.href}
							className="px-3 py-2 text-sm text-text-dim transition-colors hover:text-text"
						>
							{l.label}
						</Link>
					))}
				</nav>

				{/* Right actions */}
				<div className="flex items-center gap-2">
					<ThemeToggle />
					<Link
						href="/signin"
						className="hidden bg-accent px-4 py-2 text-sm font-medium text-text-on-accent transition-colors hover:bg-accent-strong sm:inline-flex"
					>
						Sign in
					</Link>
					<button
						type="button"
						aria-label="Toggle menu"
						className="grid h-9 w-9 place-items-center text-text lg:hidden"
						onClick={() => setMobileOpen((v) => !v)}
					>
						{mobileOpen ? <X size={20} /> : <Menu size={20} />}
					</button>
				</div>
			</div>

			{/* Full-width Courses mega-menu (desktop) */}
			{megaOpen && (
				<div
					className="absolute inset-x-0 top-full hidden border-b border-border bg-drop-bg shadow-lg lg:block"
					onMouseEnter={openMega}
					onMouseLeave={closeMega}
				>
					<div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
						<div className="grid grid-cols-4 gap-x-8 gap-y-7">
							{categories.map((cat) => {
								const Icon = categoryIcons[cat.icon];
								return (
									<div key={cat.slug}>
										<div className="mb-2.5 flex items-center gap-2">
											<span className="text-accent">
												{Icon ? <Icon size={16} /> : null}
											</span>
											<span className="text-sm font-semibold leading-tight">
												{cat.name}
											</span>
										</div>
										<ul className="flex flex-col gap-1.5">
											{coursesForTrack(cat.name).map((c) => (
												<li key={c.slug}>
													<Link
														href={`/courses/${c.slug}`}
														className="block truncate text-[13px] text-text-dim transition-colors hover:text-accent"
													>
														{c.title}
													</Link>
												</li>
											))}
										</ul>
										<Link
											href={`/courses?category=${cat.slug}`}
											className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-accent hover:gap-1.5"
										>
											View more <ArrowRight size={12} />
										</Link>
									</div>
								);
							})}
						</div>

						<div className="mt-7 flex items-center gap-6 border-t border-border pt-5">
							<Link
								href="/tracks"
								className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:gap-2.5"
							>
								Explore all tracks <ArrowRight size={14} />
							</Link>
							<Link
								href="/courses"
								className="inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-text"
							>
								Browse all courses <ArrowRight size={14} />
							</Link>
						</div>
					</div>
				</div>
			)}

			{/* Mobile menu */}
			{mobileOpen && (
				<div className="border-t border-border bg-nav-bg lg:hidden">
					<nav className="mx-auto flex max-w-6xl flex-col px-4 py-3 md:px-6">
						<Link
							href="/courses"
							className="border-b border-border-subtle py-3 text-sm text-text-dim hover:text-text"
						>
							Courses
						</Link>
						{navLinks.map((l) => (
							<Link
								key={l.href}
								href={l.href}
								className="border-b border-border-subtle py-3 text-sm text-text-dim hover:text-text"
							>
								{l.label}
							</Link>
						))}
						<Link
							href="/signin"
							className="mt-3 inline-flex w-fit bg-accent px-4 py-2 text-sm font-medium text-text-on-accent"
						>
							Sign in
						</Link>
					</nav>
				</div>
			)}
		</header>
	);
}
