import { type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Footer } from "@kaistrum/stratum-ui";
import SiteHeader from "@/components/SiteHeader";
import { useTracks } from "@/hooks/useTracks";

function Logo({ priority = false }: { priority?: boolean }) {
	return (
		<Link
			href="/"
			className="flex items-center gap-2.5"
			aria-label="Kaistrum Academy home">
			<Image
				src="/logo.png"
				alt=""
				height={30}
				width={32}
				className="object-contain"
				priority={priority}
			/>
			<span
				className="text-lg font-bold uppercase tracking-widest"
				style={{ color: "var(--text)" }}>
				Kaistrum <span className="text-text-dim text-sm">Academy</span>
			</span>
		</Link>
	);
}

export default function Layout({ children }: { children: ReactNode }) {
	const router = useRouter();
	const { tracks } = useTracks();
	const year = new Date().getFullYear();

	return (
		<div className="min-h-screen bg-bg text-text">
			<SiteHeader />
			<main key={router.asPath}>{children}</main>
			<Footer
				logo={<Logo />}
				tagline="Practical, project-based training for people who work with spatial data."
				email="hello@kaistrum.academy"
				year={year}
				columns={[
					{
						heading: "Learn",
						links: [
							{ label: "All courses", href: "/courses" },
							{
								label: "Learning paths",
								href: "/courses?format=learning_path"
							},
							{
								label: "Getting started",
								href: "/courses?category=getting-started"
							},
							{ label: "Free courses", href: "/courses?access=free" }
						]
					},
					{
						heading: "Topics",
						links: tracks.slice(0, 4).map((c) => ({
							label: c.name,
							href: `/courses?category=${c.slug}`
						}))
					},
					{
						heading: "Company",
						links: [
							{ label: "About", href: "/#about" },
							{ label: "For teams", href: "/#teams" },
							{ label: "Careers", href: "/#careers" },
							{ label: "Admin console", href: "/admin" }
						]
					}
				]}
			/>
		</div>
	);
}
