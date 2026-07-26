import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
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
  Heart,
  Lock,
  Play,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import Layout from "@/components/Layout";
import { CourseCard } from "@/components/CourseCard";
import { Stars } from "@/components/Stars";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { useFavourites } from "@/context/FavouritesContext";
import {
  ApiError,
  courses as coursesApi,
  enrollments as enrollmentsApi,
  payments as paymentsApi,
  reviews as reviewsApi,
  type Curriculum,
  type ReviewList,
} from "@/lib/api";
import {
  formatDuration,
  formatKES,
  shortDuration,
  toViewCourse,
  toViewCourseDetail,
  type ViewCourseDetail,
} from "@/lib/catalog";
import { downloadCourseCertificate } from "@/lib/certificate";

export default function CourseDetailPage() {
  const router = useRouter();
  const slug = typeof router.query.slug === "string" ? router.query.slug : null;

  const { user, requireAuth } = useAuth();
  const { reload: reloadEnrollments } = useEnrollments();
  const { isFavourite, toggle: toggleFavourite } = useFavourites();

  const detail = useAsync(() => coursesApi.get(slug as string), [slug, user?.id], {
    enabled: Boolean(slug),
  });
  const curriculum = useAsync(
    () => coursesApi.curriculum(slug as string),
    [slug, user?.id, detail.data?.enrollment?.progressPct],
    { enabled: Boolean(slug) },
  );
  const related = useAsync(() => coursesApi.related(slug as string, 3), [slug], {
    enabled: Boolean(slug),
  });
  const reviews = useAsync(
    () => coursesApi.reviews(slug as string, { pageSize: 20 }),
    [slug],
    { enabled: Boolean(slug) },
  );

  const [tab, setTab] = useState("overview");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "danger" | "success"; text: string } | null>(
    null,
  );

  // Tab is controllable via ?tab= so "Leave a review" links open Reviews.
  useEffect(() => {
    if (router.isReady && typeof router.query.tab === "string") setTab(router.query.tab);
  }, [router.isReady, router.query.tab]);

  const course: ViewCourseDetail | null = detail.data ? toViewCourseDetail(detail.data) : null;
  const enrollment = detail.data?.enrollment ?? null;
  const completed = enrollment?.status === "completed";
  const learnHref = `/courses/${slug}/learn`;
  const favourite = slug ? isFavourite(slug) : false;

  /** Free courses enrol straight away; premium ones bounce through Paystack. */
  async function handleEnroll() {
    if (!slug || !requireAuth()) return;
    setBusy(true);
    setNotice(null);
    try {
      await enrollmentsApi.enroll(slug);
      detail.reload();
      curriculum.reload();
      reloadEnrollments();
      setNotice({ tone: "success", text: "You're enrolled — happy learning!" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        try {
          const checkout = await paymentsApi.checkout(slug);
          window.location.href = checkout.authorizationUrl;
          return;
        } catch (checkoutErr) {
          setNotice({
            tone: "danger",
            text:
              checkoutErr instanceof ApiError
                ? checkoutErr.message
                : "Checkout is unavailable right now.",
          });
        }
      } else {
        setNotice({
          tone: "danger",
          text: err instanceof ApiError ? err.message : "Could not enrol just now.",
        });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCertificate() {
    if (!slug) return;
    setBusy(true);
    setNotice(null);
    try {
      await downloadCourseCertificate(slug);
    } catch (err) {
      setNotice({
        tone: "danger",
        text: err instanceof ApiError ? err.message : "Could not download the certificate.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (detail.loading || !slug) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="h-8 w-2/3 animate-pulse bg-bg-card" />
          <div className="mt-6 aspect-video animate-pulse bg-bg-card" />
        </div>
      </Layout>
    );
  }

  if (detail.error || !course) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center md:px-6">
          <h1 className="text-2xl font-semibold">Course not found</h1>
          <p className="mt-2 text-text-dim">
            {detail.error?.message ?? "That course is no longer available."}
          </p>
          <Link href="/courses" className="mt-6 inline-block text-accent hover:underline">
            ← Back to all courses
          </Link>
        </div>
      </Layout>
    );
  }

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
                href: course.categorySlug
                  ? `/courses?category=${course.categorySlug}`
                  : "/courses",
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
              <Button
                variant="ghost"
                icon={
                  <Heart size={16} fill={favourite ? "currentColor" : "none"} />
                }
                onClick={() => toggleFavourite(course.slug)}
              >
                {favourite ? "Saved" : "Save"}
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
                <Button
                  variant="primary"
                  loading={busy}
                  iconChip={course.premium ? <Lock size={15} /> : <Play size={14} />}
                  onClick={handleEnroll}
                >
                  {course.premium && course.priceKES
                    ? `Buy · ${formatKES(course.priceKES)}`
                    : "Enroll now"}
                </Button>
              )}
            </div>
          </div>

          {notice && (
            <Alert
              variant={notice.tone === "danger" ? "danger" : "success"}
              className="mt-5"
              onDismiss={() => setNotice(null)}
            >
              {notice.text}
            </Alert>
          )}
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
                onClick={() => router.push(learnHref)}
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
                      {course.description.length > 0 ? (
                        course.description.map((p, i) => <p key={i}>{p}</p>)
                      ) : (
                        <p>{course.summary}</p>
                      )}
                    </div>
                  </section>

                  {course.whatYouLearn.length > 0 && (
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
                  )}

                  {course.requirements.length > 0 && (
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
                  )}
                </div>
              </TabsContent>

              {/* Author */}
              <TabsContent value="author">
                <AuthorBlock course={course} />
              </TabsContent>

              {/* FAQ */}
              <TabsContent value="faq">
                {course.faqs.length === 0 ? (
                  <p className="pt-4 text-text-dim">No questions have been published yet.</p>
                ) : (
                  <Accordion type="single" defaultValue="faq-0" className="pt-2">
                    {course.faqs.map((f, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger>{f.question}</AccordionTrigger>
                        <AccordionContent>{f.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews">
                <ReviewsBlock
                  slug={course.slug}
                  data={reviews.data}
                  loading={reviews.loading}
                  canReview={Boolean(completed)}
                  enrolled={Boolean(enrollment)}
                  progress={enrollment?.progressPct ?? 0}
                  currentUserId={user?.id ?? null}
                  onChanged={() => {
                    reviews.reload();
                    detail.reload();
                  }}
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
                  <Progress value={enrollment.progressPct} label="Your progress" showValue />
                </div>
                <p className="mt-2 text-xs text-text-dim">
                  {enrollment.completedLessons} of {course.lessons} lessons
                </p>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  iconChip={<Play size={14} fill="currentColor" />}
                  onClick={() => router.push(learnHref)}
                >
                  {completed ? "Revisit course" : "Continue learning"}
                </Button>
                {completed && (
                  <>
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      loading={busy}
                      icon={<Download size={15} />}
                      onClick={handleCertificate}
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
                )}
              </Card>
            ) : (
              <Card surface="card" padding="standard" className="border border-border">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-semibold">
                    {course.premium && course.priceKES ? formatKES(course.priceKES) : "Free"}
                  </span>
                  {course.premium && course.originalPriceKES && (
                    <span className="text-sm text-text-muted line-through">
                      {formatKES(course.originalPriceKES)}
                    </span>
                  )}
                </div>
                <Button
                  variant="primary"
                  className="mt-4 w-full"
                  loading={busy}
                  iconChip={course.premium ? <Lock size={15} /> : <Play size={14} />}
                  onClick={handleEnroll}
                >
                  {course.premium ? "Buy this course" : "Enroll now"}
                </Button>
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => toggleFavourite(course.slug)}
                >
                  {favourite ? "Remove from saved" : "Add to wishlist"}
                </Button>
                <ul className="mt-5 flex flex-col gap-2.5 text-sm text-text-dim">
                  <li className="flex items-center gap-2.5">
                    <PlayCircle size={16} className="text-accent" /> {course.lessons} on-demand
                    lessons
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock size={16} className="text-accent" /> {formatDuration(course)} of
                    content
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
            <CurriculumCard curriculum={curriculum.data} loading={curriculum.loading} />

            {/* Author mini card */}
            {course.instructor && (
              <Card surface="card" padding="standard" className="border border-border">
                <div className="flex items-center gap-3">
                  <Avatar name={course.instructor.name} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{course.instructor.name}</p>
                    <p className="truncate text-sm text-text-dim">{course.instructor.title}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-text-dim">
                  <span className="inline-flex items-center gap-1.5">
                    <Star size={13} className="text-warning" fill="currentColor" />{" "}
                    {course.instructor.ratingAvg.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen size={13} /> {course.instructor.coursesCount} courses
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={13} /> {course.instructor.studentsCount.toLocaleString("en-KE")}
                  </span>
                </div>
              </Card>
            )}
          </aside>
        </div>

        {/* Related */}
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">
            More in {course.category}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(related.data ?? []).map((c) => (
              <CourseCard key={c.slug} course={toViewCourse(c)} />
            ))}
          </div>
          <div className="mt-8">
            <Link href="/courses" className="text-sm font-medium text-accent hover:underline">
              ← Back to all courses
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function CurriculumCard({
  curriculum,
  loading,
}: {
  curriculum: Curriculum | null;
  loading: boolean;
}) {
  if (loading) {
    return <div className="h-64 animate-pulse border border-border bg-bg-card" />;
  }
  if (!curriculum || curriculum.sections.length === 0) {
    return (
      <Card surface="card" padding="standard" className="border border-border">
        <h2 className="text-lg font-semibold">Course content</h2>
        <p className="mt-2 text-sm text-text-dim">Lessons are being prepared.</p>
      </Card>
    );
  }

  return (
    <Card surface="card" padding="standard" className="border border-border">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Course content</h2>
        <BookOpen size={18} className="text-text-muted" />
      </div>
      <p className="mb-3 text-xs text-text-dim">
        {curriculum.sections.length} sections · {curriculum.lessonCount} lessons ·{" "}
        {shortDuration(curriculum.durationMinutes)} total
      </p>
      <Divider className="mb-2" />
      <Accordion type="single" defaultValue="sec-0">
        {curriculum.sections.map((section, i) => (
          <AccordionItem key={`${section.title}-${i}`} value={`sec-${i}`}>
            <AccordionTrigger>
              <span className="flex w-full items-center justify-between gap-3 pr-2 text-left">
                <span className="font-medium">
                  {String(i + 1).padStart(2, "0")}. {section.title}
                </span>
                <span className="shrink-0 text-xs font-normal text-text-muted">
                  {section.lessons.length} · {section.minutes}min
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="flex flex-col gap-1">
                {section.lessons.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-3 py-1.5 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-text-dim">
                      {l.completed ? (
                        <Check size={15} className="shrink-0 text-success" />
                      ) : l.locked ? (
                        <Lock size={13} className="shrink-0 text-text-muted" />
                      ) : (
                        <PlayCircle size={15} className="shrink-0 text-accent" />
                      )}
                      <span className="truncate">{l.title}</span>
                      {l.isPreview && (
                        <Badge variant="outline" className="shrink-0">
                          Preview
                        </Badge>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">{l.minutes}min</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}

function AuthorBlock({ course }: { course: ViewCourseDetail }) {
  const a = course.instructor;
  if (!a) return <p className="pt-4 text-text-dim">No instructor assigned yet.</p>;

  return (
    <div className="pt-2">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <Avatar name={a.name} size="xl" />
        <div>
          <h2 className="text-xl font-semibold">{a.name}</h2>
          <p className="text-text-dim">{a.title}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-dim">
            <span className="inline-flex items-center gap-1.5">
              <Star size={15} className="text-warning" fill="currentColor" />{" "}
              {a.ratingAvg.toFixed(1)} rating
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpen size={15} /> {a.coursesCount} courses
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={15} /> {a.studentsCount.toLocaleString("en-KE")} learners
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-text-dim">{a.bio}</p>
        </div>
      </div>
    </div>
  );
}

function ReviewsBlock({
  slug,
  data,
  loading,
  canReview,
  enrolled,
  progress,
  currentUserId,
  onChanged,
}: {
  slug: string;
  data: ReviewList | null;
  loading: boolean;
  canReview: boolean;
  enrolled: boolean;
  progress: number;
  currentUserId: string | null;
  onChanged: () => void;
}) {
  const summary = data?.summary ?? { average: 0, count: 0, histogram: {} };
  const list = data?.data ?? [];
  const mine = list.find((r) => r.userId === currentUserId);

  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = summary.histogram?.[String(stars)] ?? 0;
    return { stars, count, pct: summary.count ? Math.round((count / summary.count) * 100) : 0 };
  });

  return (
    <div className="pt-2">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
        <div className="text-center">
          <div className="text-5xl font-semibold">{summary.average.toFixed(1)}</div>
          <div className="mt-2 flex justify-center">
            <Stars rating={summary.average} size={16} />
          </div>
          <p className="mt-1 text-sm text-text-dim">{summary.count} reviews</p>
        </div>
        <div className="flex-1">
          {breakdown.map((r) => (
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
        {mine ? (
          <Alert variant="success" title="You reviewed this course">
            Thanks for the feedback — your review is below.
          </Alert>
        ) : canReview ? (
          <ReviewForm slug={slug} onPosted={onChanged} />
        ) : enrolled ? (
          <Alert variant="info" title="Finish the course to leave a review">
            You&apos;re {progress}% through this course. Reviews unlock once you complete every
            lesson — keep going!
          </Alert>
        ) : (
          <Alert variant="info" title="Enrol to review this course">
            Only learners who have completed the course can leave a review.
          </Alert>
        )}
      </div>

      <h3 className="mb-4 text-lg font-semibold">
        Learner reviews <span className="text-text-muted">({summary.count})</span>
      </h3>

      {loading ? (
        <div className="h-24 animate-pulse bg-bg-card" />
      ) : list.length === 0 ? (
        <p className="text-text-dim">No reviews yet — be the first once you finish.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {list.map((rev) => (
            <div key={rev.id} className="flex gap-4">
              <Avatar name={rev.author?.name ?? "Learner"} size="md" />
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{rev.author?.name ?? "Learner"}</span>
                  {rev.userId === currentUserId && <Badge variant="accent">Your review</Badge>}
                  <Stars rating={rev.rating} size={12} />
                </div>
                <p className="mt-1 text-sm text-text-dim">{rev.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewForm({ slug, onPosted }: { slug: string; onPosted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || text.trim().length < 10) {
      setError("Pick a rating and write at least 10 characters.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reviewsApi.create(slug, { rating, body: text.trim() });
      setRating(0);
      setText("");
      onPosted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not post your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card surface="surface" padding="standard" className="border border-accent-dim">
      <div className="flex items-center gap-2">
        <Award size={16} className="text-accent" />
        <h3 className="font-semibold">You completed this course — share your review</h3>
      </div>

      {error && (
        <Alert variant="danger" className="mt-4" onDismiss={() => setError(null)}>
          {error}
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
            loading={submitting}
            disabled={!rating || text.trim().length < 10}
          >
            Post review
          </Button>
        </div>
      </form>
    </Card>
  );
}
