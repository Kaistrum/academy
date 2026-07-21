import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Badge, Button, Grid, Section } from "@kaistrum/stratum-ui";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import Contact from "@/components/Contact";
import { CourseCard } from "@/components/CourseCard";
import { categoryIcons } from "@/components/categoryIcons";
import { categories, courses } from "@/data/courses";

const popular = ["Spatial SQL", "Python", "Web maps", "Remote sensing", "3D scenes"];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const featured = courses.filter((c) => c.featured).slice(0, 6);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/courses?q=${encodeURIComponent(query.trim())}` : "/courses");
  }

  return (
    <Layout>
      <Head>
        <title>Kaistrum Academy — Learn spatial data, hands-on</title>
        <meta
          name="description"
          content="Project-based courses in mapping, spatial analysis, remote sensing and geospatial development."
        />
      </Head>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border bg-bg-surface">
        <div className="noise-overlay opacity-40" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 50% -10%, var(--accent-faint), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center md:px-6 md:py-28">
          <Badge variant="accent" icon={<Sparkles size={12} />} className="mb-6">
            120+ courses · updated for 2026
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            Explore our{" "}
            <span
              className="italic text-accent"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              courses
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-text-dim md:text-lg">
            Practical, project-based training in mapping, spatial analysis, remote
            sensing and geospatial development — taught by working practitioners.
          </p>

          <form onSubmit={submitSearch} className="mx-auto mt-8 flex max-w-xl gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, topics, skills…"
                aria-label="Search courses"
                className="h-12 w-full border border-border-strong bg-bg pl-11 pr-4 text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="lg">
              Search
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-text-muted">
            <span>Popular:</span>
            {popular.map((p) => (
              <Link
                key={p}
                href={`/courses?q=${encodeURIComponent(p)}`}
                className="border border-border px-2.5 py-0.5 text-text-dim transition-colors hover:border-accent hover:text-accent"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <Section spacing="compact" surface="bg">
        <dl className="grid grid-cols-2 gap-6 border-y border-border py-8 md:grid-cols-4">
          {[
            { value: "120+", label: "Courses & tutorials" },
            { value: "180k", label: "Learners worldwide" },
            { value: "4.7★", label: "Average rating" },
            { value: "8", label: "Topic tracks" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <dt className="text-3xl font-semibold tracking-tight text-text md:text-4xl">
                {s.value}
              </dt>
              <dd className="mt-1 text-sm text-text-dim">{s.label}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Browse by topic ── */}
      <Section id="topics" spacing="standard" surface="surface">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Browse by topic</h2>
          <p className="mt-2 text-text-dim">Find your track and go deep.</p>
        </div>
        <Grid columns={4} gap="md">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.icon];
            return (
              <Link
                key={cat.slug}
                href={`/courses?category=${cat.slug}`}
                className="group flex flex-col gap-3 border border-border bg-bg-card p-5 transition-colors hover:border-accent"
              >
                <span className="grid h-11 w-11 place-items-center border border-border-strong text-accent transition-colors group-hover:border-accent group-hover:bg-accent-faint">
                  {Icon ? <Icon size={22} strokeWidth={1.7} /> : null}
                </span>
                <span className="font-medium leading-snug">{cat.name}</span>
                <span className="text-sm text-text-dim">{cat.blurb}</span>
              </Link>
            );
          })}
        </Grid>
      </Section>

      {/* ── Featured courses ── */}
      <Section spacing="standard" surface="bg">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Featured courses</h2>
            <p className="mt-2 text-text-dim">Hand-picked, recently updated.</p>
          </div>
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:gap-2.5"
          >
            View all courses <ArrowRight size={16} />
          </Link>
        </div>
        <Grid columns={3} gap="md">
          {featured.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </Grid>
      </Section>

      {/* ── Contact ── */}
      <Contact />
    </Layout>
  );
}
