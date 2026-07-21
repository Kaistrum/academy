import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import type { GetStaticPaths, GetStaticProps } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Divider,
  IconButton,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@kaistrum/stratum-ui";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Check,
  Clock,
  Download,
  Lock,
  Play,
  PlayCircle,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import Layout from "@/components/Layout";
import { CourseCard } from "@/components/CourseCard";
import { Stars } from "@/components/Stars";
import {
  categories,
  courses,
  coursePriceKES,
  formatDuration,
  formatKES,
  getCourse,
  type Course,
} from "@/data/courses";
import { currentUser, getEnrollment, isCompleted } from "@/data/enrollment";
import { downloadCertificate } from "@/lib/certificate";

interface Props {
  course: Course;
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: courses.map((c) => ({ params: { slug: c.slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  const course = getCourse(params?.slug as string);
  if (!course) return { notFound: true };
  return { props: { course } };
};

const ratingBreakdown = [
  { stars: 5, pct: 72 },
  { stars: 4, pct: 19 },
  { stars: 3, pct: 6 },
  { stars: 2, pct: 2 },
  { stars: 1, pct: 1 },
];

export default function CourseDetail({ course }: Props) {
  const router = useRouter();
  const enrollment = getEnrollment(course.slug);
  const completed = isCompleted(course.slug);
  const price = coursePriceKES(course);
  const learnHref = `/courses/${course.slug}/learn`;

  // Tab is controllable via ?tab= so "Leave a review" links open Reviews.
  const [tab, setTab] = useState("overview");
  // Initial deep-link: read the query synchronously on mount (reliable on
  // statically-generated pages where router.query hydrates asynchronously).
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("tab");
    if (initial) setTab(initial);
  }, []);
  // Same-page client navigations that change ?tab=.
  useEffect(() => {
    if (router.isReady && typeof router.query.tab === "string") {
      setTab(router.query.tab);
    }
  }, [router.isReady, router.query.tab]);

  const categorySlug = categories.find((c) => c.name === course.category)?.slug;
  const related = courses
    .filter((c) => c.category === course.category && c.slug !== course.slug)
    .slice(0, 3);
  const fallbackRelated = courses.filter((c) => c.slug !== course.slug).slice(0, 3);
  const relatedCourses = related.length ? related : fallbackRelated;

  const totalLessonMinutes = course.curriculum.reduce(
    (sum, s) => sum + s.lessons.reduce((a, l) => a + l.minutes, 0),
    0,
  );

  return (
    <Layout>
      <Head>
        <title>{course.title} — Kaistrum Academy</title>
        <meta name="description" content={course.summary} />
      </Head>

      {/* ── Header ── */}
      <section className="border-b border-border bg-bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 md:px-6">
          <Breadcrumb
            items={[
              { label: "Courses", href: "/courses" },
              {
                label: course.category,
                href: categorySlug ? `/courses?category=${categorySlug}` : "/courses",
              },
              { label: course.title },
            ]}
          />

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <IconButton
                  aria-label="Back to courses"
                  variant="ghost"
                  icon={<ArrowLeft size={18} />}
                  onClick={() => router.push("/courses")}
                  className="mt-1 shrink-0"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                      {course.title}
                    </h1>
                    <Badge variant="accent">{course.category}</Badge>
                    {enrollment && (
                      <Badge variant="success" icon={<Check size={12} />}>
                        Enrolled
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-dim">
                    <span className="inline-flex items-center gap-1.5">
                      <PlayCircle size={15} /> {course.lessons} lessons
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={15} /> {formatDuration(course)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Star size={15} className="text-warning" fill="currentColor" />{" "}
                      {course.rating.toFixed(1)} ({course.reviews} reviews)
                    </span>
                    <Badge variant="neutral">{course.level}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button variant="ghost" icon={<Share2 size={16} />}>
                Share
              </Button>
              {enrollment ? (
                <Button
                  variant="primary"
                  iconChip={<Play size={14} fill="currentColor" />}
                  onClick={() => router.push(learnHref)}
                >
                  {completed ? "Revisit course" : "Continue learning"}
                </Button>
              ) : (
                <Button variant="primary" iconChip={<Lock size={15} />}>
                  Enroll now
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div className="min-w-0">
            {/* Preview media */}
            <div className="course-media relative flex aspect-video items-center justify-center overflow-hidden border border-border">
              <div className="noise-overlay opacity-30" aria-hidden />
              <button
                aria-label="Play course preview"
                className="relative grid h-16 w-16 place-items-center rounded-full bg-accent text-text-on-accent shadow-md transition-transform hover:scale-105"
              >
                <Play size={26} fill="currentColor" className="ml-0.5" />
              </button>
              <span className="absolute bottom-3 left-3 text-xs font-medium uppercase tracking-[0.14em] text-text-dim">
                Course preview
              </span>
            </div>

            {/* Tabs */}
            <Tabs value={tab} defaultValue="overview" onValueChange={setTab} className="mt-8">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="author">Author</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview">
                <div className="flex flex-col gap-10 pt-2">
                  <section>
                    <h2 className="text-xl font-semibold">About this course</h2>
                    <div className="mt-3 flex flex-col gap-3 text-text-dim">
                      {course.description.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold">What you&apos;ll learn</h2>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {course.whatYouLearn.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm">
                          <Check
                            size={18}
                            className="mt-0.5 shrink-0 text-success"
                            strokeWidth={2.4}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold">Requirements</h2>
                    <ul className="mt-3 flex flex-col gap-2 text-text-dim">
                      {course.requirements.map((r) => (
                        <li key={r} className="flex items-start gap-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </TabsContent>

              {/* Author */}
              <TabsContent value="author">
                <AuthorBlock course={course} />
              </TabsContent>

              {/* FAQ */}
              <TabsContent value="faq">
                <Accordion type="single" defaultValue="faq-0" className="pt-2">
                  {course.faqs.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger>{f.q}</AccordionTrigger>
                      <AccordionContent>{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews">
                <ReviewsBlock
                  course={course}
                  canReview={completed}
                  enrolled={!!enrollment}
                  progress={enrollment?.progress ?? 0}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
            {/* Enroll / progress card */}
            {enrollment ? (
              <Card surface="card" padding="standard" className="border border-accent-dim">
                <div className="flex items-center gap-2 text-sm font-medium text-accent">
                  <Check size={16} /> You&apos;re enrolled
                </div>
                <div className="mt-4">
                  <Progress
                    value={enrollment.progress}
                    label="Your progress"
                    showValue
                  />
                </div>
                <p className="mt-2 text-xs text-text-dim">
                  {enrollment.completedLessons} of {course.lessons} lessons · last opened{" "}
                  {enrollment.lastAccessed}
                </p>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  iconChip={<Play size={14} fill="currentColor" />}
                  onClick={() => router.push(learnHref)}
                >
                  {completed ? "Revisit course" : "Continue learning"}
                </Button>
                {completed ? (
                  <>
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      icon={<Download size={15} />}
                      onClick={() =>
                        downloadCertificate({
                          name: currentUser.name,
                          courseTitle: course.title,
                          slug: course.slug,
                          hours: course.hours,
                        })
                      }
                    >
                      Download certificate
                    </Button>
                    <Link
                      href={`/courses/${course.slug}?tab=reviews`}
                      className="mt-3 block text-center text-xs font-medium text-accent hover:underline"
                    >
                      Leave a review →
                    </Link>
                  </>
                ) : (
                  <p className="mt-3 text-xs text-text-muted">
                    Up next:{" "}
                    <span className="text-text-dim">{enrollment.nextLesson}</span>
                  </p>
                )}
              </Card>
            ) : (
              <Card surface="card" padding="standard" className="border border-border">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold">
                    {price ? formatKES(price.price) : "Free"}
                  </span>
                  {price && (
                    <span className="text-sm text-text-muted line-through">
                      {formatKES(price.original)}
                    </span>
                  )}
                </div>
                <Button variant="primary" className="mt-4 w-full" iconChip={<Lock size={15} />}>
                  Enroll now
                </Button>
                <Button variant="outline" className="mt-2 w-full">
                  Add to wishlist
                </Button>
                <ul className="mt-5 flex flex-col gap-2.5 text-sm text-text-dim">
                  <li className="flex items-center gap-2.5">
                    <PlayCircle size={16} className="text-accent" /> {course.lessons} on-demand
                    lessons
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock size={16} className="text-accent" /> {formatDuration(course)} of content
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Award size={16} className="text-accent" /> Certificate of completion
                  </li>
                  <li className="flex items-center gap-2.5">
                    <ShieldCheck size={16} className="text-accent" /> Lifetime access
                  </li>
                </ul>
              </Card>
            )}

            {/* Course content */}
            <Card surface="card" padding="standard" className="border border-border">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Course content</h2>
                <BookOpen size={18} className="text-text-muted" />
              </div>
              <p className="mb-3 text-xs text-text-dim">
                {course.curriculum.length} sections · {course.lessons} lessons ·{" "}
                {Math.round(totalLessonMinutes / 60) || 1}h total
              </p>
              <Divider className="mb-2" />
              <Accordion type="single" defaultValue="sec-0">
                {course.curriculum.map((section, i) => {
                  const mins = section.lessons.reduce((a, l) => a + l.minutes, 0);
                  return (
                    <AccordionItem key={i} value={`sec-${i}`}>
                      <AccordionTrigger>
                        <span className="flex w-full items-center justify-between gap-3 pr-2 text-left">
                          <span className="font-medium">
                            {String(i + 1).padStart(2, "0")}. {section.title}
                          </span>
                          <span className="shrink-0 text-xs font-normal text-text-muted">
                            {section.lessons.length} · {mins}min
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="flex flex-col gap-1">
                          {section.lessons.map((l, j) => (
                            <li
                              key={j}
                              className="flex items-center justify-between gap-3 py-1.5 text-sm"
                            >
                              <span className="flex min-w-0 items-center gap-2 text-text-dim">
                                {l.preview ? (
                                  <PlayCircle size={15} className="shrink-0 text-accent" />
                                ) : (
                                  <Lock size={13} className="shrink-0 text-text-muted" />
                                )}
                                <span className="truncate">{l.title}</span>
                                {l.preview && (
                                  <Badge variant="outline" className="shrink-0">
                                    Preview
                                  </Badge>
                                )}
                              </span>
                              <span className="shrink-0 text-xs text-text-muted">
                                {l.minutes}min
                              </span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </Card>

            {/* Author mini card */}
            <Card surface="card" padding="standard" className="border border-border">
              <div className="flex items-center gap-3">
                <Avatar name={course.author.name} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{course.author.name}</p>
                  <p className="truncate text-sm text-text-dim">{course.author.title}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-text-dim">
                <span className="inline-flex items-center gap-1.5">
                  <Star size={13} className="text-warning" fill="currentColor" />{" "}
                  {course.author.rating}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={13} /> {course.author.courses} courses
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} /> {course.author.learners}
                </span>
              </div>
            </Card>
          </aside>
        </div>

        {/* Related */}
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            More in {course.category}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCourses.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
          <div className="mt-8">
            <Link
              href="/courses"
              className="text-sm font-medium text-accent hover:underline"
            >
              ← Back to all courses
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function AuthorBlock({ course }: { course: Course }) {
  const a = course.author;
  return (
    <div className="pt-2">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar name={a.name} size="xl" />
        <div>
          <h2 className="text-xl font-semibold">{a.name}</h2>
          <p className="text-text-dim">{a.title}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-dim">
            <span className="inline-flex items-center gap-1.5">
              <Star size={15} className="text-warning" fill="currentColor" /> {a.rating} rating
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={15} /> {a.courses} courses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} /> {a.learners} learners
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-text-dim">{a.bio}</p>
        </div>
      </div>
    </div>
  );
}

interface ReviewItem {
  name: string;
  rating: number;
  text: string;
  you?: boolean;
}

function ReviewsBlock({
  course,
  canReview,
  enrolled,
  progress,
}: {
  course: Course;
  canReview: boolean;
  enrolled: boolean;
  progress: number;
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>([
    {
      name: "Jordan M.",
      rating: 5,
      text: "Exactly the practical depth I needed. The worked examples map straight onto my day job.",
    },
    {
      name: "Sofia K.",
      rating: 5,
      text: "Clear, well-paced, and no filler. I was applying the ideas the same week.",
    },
    {
      name: "Wei L.",
      rating: 4,
      text: "Great content overall — I'd have loved one more advanced module at the end.",
    },
  ]);

  return (
    <div className="pt-2">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
        <div className="text-center">
          <div className="text-5xl font-semibold">{course.rating.toFixed(1)}</div>
          <div className="mt-2 flex justify-center">
            <Stars rating={course.rating} size={16} />
          </div>
          <p className="mt-1 text-sm text-text-dim">{course.reviews} reviews</p>
        </div>
        <div className="flex-1">
          {ratingBreakdown.map((r) => (
            <div key={r.stars} className="flex items-center gap-3 py-1">
              <span className="inline-flex w-10 shrink-0 items-center gap-1 text-xs text-text-dim">
                {r.stars} <Star size={11} className="text-warning" fill="currentColor" />
              </span>
              <Progress value={r.pct} className="flex-1" />
              <span className="w-9 shrink-0 text-right text-xs text-text-muted">{r.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <Divider className="my-8" />

      {/* Review-after-completion */}
      <div id="write-review" className="mb-8">
        {canReview ? (
          <ReviewForm
            onSubmit={(rating, text) =>
              setReviews((prev) => [{ name: "You", rating, text, you: true }, ...prev])
            }
          />
        ) : enrolled ? (
          <Alert variant="info" title="Finish the course to leave a review">
            You&apos;re {progress}% through this course. Reviews unlock once you complete
            every lesson — keep going!
          </Alert>
        ) : (
          <Alert variant="info" title="Enrol to review this course">
            Only learners who have completed the course can leave a review.
          </Alert>
        )}
      </div>

      <h3 className="mb-4 text-lg font-semibold">
        Learner reviews{" "}
        <span className="text-text-muted">({reviews.length})</span>
      </h3>
      <div className="flex flex-col gap-6">
        {reviews.map((rev, i) => (
          <div key={i} className="flex gap-4">
            <Avatar name={rev.name} size="md" />
            <div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{rev.name}</span>
                {rev.you && <Badge variant="accent">Your review</Badge>}
                <Stars rating={rev.rating} size={12} />
              </div>
              <p className="mt-1 text-sm text-text-dim">{rev.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ onSubmit }: { onSubmit: (rating: number, text: string) => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !text.trim()) return;
    onSubmit(rating, text.trim());
    setSubmitted(true);
    setRating(0);
    setText("");
  }

  return (
    <Card surface="surface" padding="standard" className="border border-accent-dim">
      <div className="flex items-center gap-2">
        <Award size={16} className="text-accent" />
        <h3 className="font-semibold">You completed this course — share your review</h3>
      </div>

      {submitted && (
        <Alert variant="success" className="mt-4" onDismiss={() => setSubmitted(false)}>
          Thanks! Your review has been posted.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
            Your rating
          </span>
          <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hover || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className="p-0.5"
                >
                  <Star
                    size={26}
                    className={active ? "text-warning" : "text-text-muted"}
                    fill={active ? "currentColor" : "none"}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <Textarea
          label="Your review"
          placeholder="What did you think of the course? What stood out?"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div>
          <Button
            type="submit"
            variant="primary"
            disabled={!rating || !text.trim()}
          >
            Post review
          </Button>
        </div>
      </form>
    </Card>
  );
}
