/**
 * TypeScript mirrors of the Kaistrum Academy API response shapes
 * (`Backend/src/lib/shape.js` and the service return values).
 *
 * Everything here is what the server sends: snake-free camelCase, `id` never
 * `_id`, timestamps as UTC ISO strings, money as whole KES integers.
 */

export type Role = "learner" | "instructor" | "admin";

export type CourseFormat = "web_course" | "training_seminar" | "tutorial" | "learning_path";
export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseStatus = "draft" | "published";
export type EnrollmentStatus = "active" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "abandoned";

/** List envelope metadata — `{ data, meta }`. */
export interface Meta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paged<T> {
  data: T[];
  meta: Meta;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  emailVerified: boolean;
  instructorProfileId: string | null;
  createdAt: string;
}

export interface Session {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: string;
}

export interface Track {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  blurb: string;
  sortOrder: number;
  courseCount: number;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string | null;
  ratingAvg: number;
  studentsCount: number;
  coursesCount: number;
}

/** The admin view adds the contact address and the linked login. */
export interface AdminInstructor extends Instructor {
  email: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  format: CourseFormat;
  level: CourseLevel;
  premium: boolean;
  priceKES: number | null;
  originalPriceKES: number | null;
  featured: boolean;
  status: CourseStatus;
  durationMinutes: number;
  lessonCount: number;
  ratingAvg: number;
  ratingCount: number;
  learnersCount: number;
  publishedAt: string | null;
  createdAt: string;
  track?: Track;
  instructor?: Instructor;
  trackId: string | null;
  instructorId: string | null;
}

export interface Faq {
  question: string;
  answer: string;
  sortOrder: number;
}

export interface CourseDetail extends CourseCard {
  description: string[];
  contentHTML: string;
  whatYouLearn: string[];
  requirements: string[];
  faqs: Faq[];
  updatedAt: string;
  /** Present on `GET /courses/:slug` — null when signed out. */
  enrollment?: Enrollment | null;
  isFavourite?: boolean;
  hasAccess?: boolean;
}

export interface LessonSummary {
  id: string;
  courseId: string;
  sectionTitle: string;
  sectionOrder: number;
  title: string;
  minutes: number;
  isPreview: boolean;
  order: number;
  locked?: boolean;
  completed?: boolean;
  videoUrl?: string | null;
}

export interface LessonDetail extends LessonSummary {
  videoUrl: string | null;
  contentHTML: string;
  completed: boolean;
  enrollmentId: string | null;
  prevLesson: LessonSummary | null;
  nextLesson: LessonSummary | null;
}

export interface CurriculumSection {
  title: string;
  order: number;
  minutes: number;
  lessons: LessonSummary[];
}

export interface Curriculum {
  courseId: string;
  slug: string;
  title: string;
  lessonCount: number;
  durationMinutes: number;
  hasAccess: boolean;
  sections: CurriculumSection[];
}

export interface Enrollment {
  id: string;
  courseId: string;
  status: EnrollmentStatus;
  progressPct: number;
  completedLessons: number;
  completedLessonIds: string[];
  lastAccessedAt: string | null;
  enrolledAt: string;
  completedAt: string | null;
}

export interface EnrollmentWithCourse extends Enrollment {
  course: CourseCard | null;
  nextLesson: LessonSummary | null;
  certificateSerial: string | null;
}

/** `GET /courses/:slug/enrollment` and the progress writes. */
export interface EnrollmentProgress extends Enrollment {
  lessonCount: number;
  nextLesson: LessonSummary | null;
  justCompleted?: boolean;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; avatarUrl: string | null };
}

export interface ReviewSummary {
  average: number;
  count: number;
  histogram: Record<string, number>;
}

export interface ReviewList extends Paged<Review> {
  summary: ReviewSummary;
}

export interface Certificate {
  id: string;
  serial: string;
  courseId: string;
  userId: string;
  issuedAt: string;
  hours: number;
  fileUrl: string | null;
  course?: { id: string; slug: string; title: string };
}

export interface CertificateVerification {
  valid: true;
  serial: string;
  learnerName: string;
  courseTitle: string;
  courseSlug: string | null;
  hours: number;
  issuedAt: string;
}

export interface Payment {
  id: string;
  reference: string;
  courseId: string;
  userId: string;
  amountKES: number;
  currency: "KES";
  provider: string;
  channel: string | null;
  status: PaymentStatus;
  authorizationUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  course?: { id: string; slug: string; title: string };
  learner?: { id: string; name: string; email: string } | null;
}

export interface PaymentList extends Paged<Payment> {
  summary: { paidCount: number; revenueKES: number };
}

export interface Checkout {
  authorizationUrl: string;
  accessCode?: string | null;
  reference: string;
  amountKES: number;
  currency: "KES";
  reused: boolean;
}

/** The `checkout` block a 402 carries when a premium course needs paying for. */
export interface CheckoutHandoff {
  slug: string;
  priceKES: number | null;
  currency: "KES";
  checkoutUrl: string;
}

export interface UserStats {
  enrolled: number;
  inProgress: number;
  notStarted: number;
  completed: number;
  certificates: number;
  lessonsDone: number;
  minutesLearned: number;
  hoursLearned: number;
}

// ---- admin -----------------------------------------------------------------

export interface RevenueBucket {
  month: string;
  label: string;
  revenueKES: number;
  orders: number;
}

export interface AdminOverview {
  totalRevenueKES: number;
  revenueThisMonthKES: number;
  revenueLastMonthKES: number;
  growthMoM: number;
  paidOrders: number;
  publishedCourses: number;
  draftCourses: number;
  tutors: number;
  enrollments: number;
  completions: number;
  reviews: number;
  certificates: number;
  revenueByMonth: RevenueBucket[];
  topCourses: {
    id: string;
    slug: string | null;
    title: string;
    revenueKES: number;
    orders: number;
    learnersCount: number;
    ratingAvg: number;
  }[];
  topTutors: {
    id: string;
    name: string;
    title: string;
    avatarUrl: string | null;
    courses: number;
    learners: number;
    ratingAvg: number;
  }[];
  recentOrders: {
    id: string;
    reference: string;
    amountKES: number;
    channel: string | null;
    paidAt: string | null;
    course: string | null;
  }[];
}

export interface RosterRow {
  enrollmentId: string;
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  status: EnrollmentStatus;
  progressPct: number;
  completedLessons: number;
  enrolledAt: string;
  lastAccessedAt: string | null;
  completedAt: string | null;
}

export interface LearnerRow extends ApiUser {
  enrolled: number;
  inProgress: number;
  completed: number;
  certificates: number;
  lastAccessedAt: string | null;
}

export interface LearnerDetail {
  user: ApiUser;
  totals: { enrolled: number; completed: number; certificates: number; spentKES: number };
  courses: {
    enrollmentId: string;
    courseId: string;
    slug: string | null;
    title: string;
    status: EnrollmentStatus;
    progressPct: number;
    completedLessons: number;
    lessonCount: number;
    enrolledAt: string;
    lastAccessedAt: string | null;
    completedAt: string | null;
  }[];
  certificates: {
    id: string;
    serial: string;
    courseTitle: string | null;
    issuedAt: string;
    hours: number;
  }[];
  payments: {
    id: string;
    reference: string;
    amountKES: number;
    status: PaymentStatus;
    channel: string | null;
    courseTitle: string | null;
    createdAt: string;
    paidAt: string | null;
  }[];
}

export interface OAuthProviders {
  google: boolean;
  github: boolean;
}
