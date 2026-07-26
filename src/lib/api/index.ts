/**
 * Typed bindings for every endpoint the front end uses. One function per
 * route, grouped the way the API groups them, so pages never build URLs.
 */
import {
  API_BASE,
  ApiError,
  clearTokens,
  request,
  requestBlob,
  requestRaw,
  setTokens,
  type QueryValue,
} from "./client";
import type {
  AdminInstructor,
  AdminOverview,
  Certificate,
  CertificateVerification,
  Checkout,
  CourseCard,
  CourseDetail,
  CourseFormat,
  CourseLevel,
  CourseStatus,
  Curriculum,
  Enrollment,
  EnrollmentProgress,
  EnrollmentWithCourse,
  LearnerDetail,
  LearnerRow,
  LessonDetail,
  LessonSummary,
  OAuthProviders,
  Paged,
  Payment,
  PaymentList,
  Review,
  ReviewList,
  RosterRow,
  Session,
  Track,
  UserStats,
} from "./types";

export { API_BASE, ApiError, clearTokens, setTokens };
export {
  getAccessToken,
  hasStoredSession,
  refreshSession,
  setSessionLostHandler,
} from "./client";
export * from "./types";

type Query = Record<string, QueryValue>;

// ---- auth ------------------------------------------------------------------

function keepSession(session: Session): Session {
  setTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
  return session;
}

export const auth = {
  async register(body: { name: string; email: string; password: string }) {
    return keepSession(
      await request<Session>("/auth/register", { method: "POST", body, noRetry: true }),
    );
  },

  async login(body: { email: string; password: string; remember?: boolean }) {
    return keepSession(
      await request<Session>("/auth/login", { method: "POST", body, noRetry: true }),
    );
  },

  async logout() {
    try {
      await request<{ loggedOut: boolean }>("/auth/logout", { method: "POST", noRetry: true });
    } finally {
      clearTokens();
    }
  },

  me() {
    return request<{ user: import("./types").ApiUser }>("/auth/me");
  },

  providers() {
    return request<OAuthProviders>("/auth/providers");
  },

  forgotPassword(email: string) {
    return request<{ sent: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      noRetry: true,
    });
  },

  resetPassword(body: { token: string; password: string }) {
    return request<unknown>("/auth/reset-password", { method: "POST", body, noRetry: true });
  },

  verifyEmail(token: string) {
    return request<unknown>("/auth/verify-email", {
      method: "POST",
      body: { token },
      noRetry: true,
    });
  },

  resendVerification() {
    return request<unknown>("/auth/resend-verification", { method: "POST" });
  },

  /** Swaps the single-use code from `/auth/callback?code=…` for a session. */
  async exchangeOAuthCode(code: string) {
    return keepSession(
      await request<Session>("/auth/oauth/exchange", {
        method: "POST",
        body: { code },
        noRetry: true,
      }),
    );
  },

  /** Full-page redirect target that starts the provider handshake. */
  oauthStartUrl(provider: "google" | "github", returnTo?: string) {
    const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    return `${API_BASE}/auth/oauth/${provider}${qs}`;
  },
};

// ---- users -----------------------------------------------------------------

export const users = {
  me() {
    return request<import("./types").ApiUser>("/users/me");
  },
  updateMe(body: { name?: string; avatarUrl?: string }) {
    return request<import("./types").ApiUser>("/users/me", { method: "PATCH", body });
  },
  changePassword(body: { currentPassword: string; newPassword: string }) {
    return request<{ changed: boolean }>("/users/me/password", { method: "PATCH", body });
  },
  stats() {
    return request<UserStats>("/users/me/stats");
  },
};

// ---- catalogue -------------------------------------------------------------

export interface CourseListParams extends Query {
  q?: string;
  category?: string;
  format?: CourseFormat;
  level?: CourseLevel;
  access?: "free" | "premium";
  sort?: string;
  page?: number;
  pageSize?: number;
}

export const tracks = {
  list() {
    return request<Track[]>("/tracks");
  },
  get(slug: string) {
    return request<Track>(`/tracks/${slug}`);
  },
};

export const courses = {
  list(params: CourseListParams = {}) {
    return requestRaw<Paged<CourseCard>>("/courses", { query: params });
  },
  featured(limit = 6) {
    return request<CourseCard[]>("/courses/featured", { query: { limit } });
  },
  get(slug: string) {
    return request<CourseDetail>(`/courses/${slug}`);
  },
  related(slug: string, limit = 3) {
    return request<CourseCard[]>(`/courses/${slug}/related`, { query: { limit } });
  },
  curriculum(slug: string) {
    return request<Curriculum>(`/courses/${slug}/curriculum`);
  },
  lesson(slug: string, lessonId: string) {
    return request<LessonDetail>(`/courses/${slug}/lessons/${lessonId}`);
  },
  reviews(slug: string, params: Query = {}) {
    return requestRaw<ReviewList>(`/courses/${slug}/reviews`, { query: params });
  },
};

export const instructors = {
  get(id: string) {
    return request<import("./types").Instructor>(`/instructors/${id}`);
  },
  courses(id: string, params: CourseListParams = {}) {
    return requestRaw<Paged<CourseCard>>(`/instructors/${id}/courses`, { query: params });
  },
};

// ---- enrolments & progress -------------------------------------------------

export const enrollments = {
  mine(params: Query = {}) {
    return requestRaw<Paged<EnrollmentWithCourse>>("/me/enrollments", {
      query: { pageSize: 100, ...params },
    });
  },
  enroll(slug: string) {
    return request<{ enrollment: Enrollment; alreadyEnrolled: boolean }>(
      `/courses/${slug}/enroll`,
      { method: "POST" },
    );
  },
  forCourse(slug: string) {
    return request<EnrollmentProgress>(`/courses/${slug}/enrollment`);
  },
  completeLesson(enrollmentId: string, lessonId: string) {
    return request<EnrollmentProgress>(
      `/enrollments/${enrollmentId}/lessons/${lessonId}/complete`,
      { method: "PUT" },
    );
  },
  uncompleteLesson(enrollmentId: string, lessonId: string) {
    return request<EnrollmentProgress>(
      `/enrollments/${enrollmentId}/lessons/${lessonId}/complete`,
      { method: "DELETE" },
    );
  },
  unenroll(enrollmentId: string) {
    return request<{ deleted: boolean; id: string }>(`/enrollments/${enrollmentId}`, {
      method: "DELETE",
    });
  },
};

// ---- favourites ------------------------------------------------------------

export const favourites = {
  list(params: Query = {}) {
    return requestRaw<Paged<CourseCard & { favouritedAt: string }>>("/me/favourites", {
      query: { pageSize: 100, ...params },
    });
  },
  add(slug: string) {
    return request<{ isFavourite: boolean; slug: string }>(`/courses/${slug}/favourite`, {
      method: "PUT",
    });
  },
  remove(slug: string) {
    return request<{ isFavourite: boolean; slug: string }>(`/courses/${slug}/favourite`, {
      method: "DELETE",
    });
  },
};

// ---- reviews ---------------------------------------------------------------

export const reviews = {
  create(slug: string, body: { rating: number; body: string }) {
    return request<Review>(`/courses/${slug}/reviews`, { method: "POST", body });
  },
  update(id: string, body: { rating?: number; body?: string }) {
    return request<Review>(`/reviews/${id}`, { method: "PATCH", body });
  },
  remove(id: string) {
    return request<{ deleted: boolean; id: string }>(`/reviews/${id}`, { method: "DELETE" });
  },
};

// ---- certificates ----------------------------------------------------------

export const certificates = {
  mine(params: Query = {}) {
    return requestRaw<Paged<Certificate>>("/me/certificates", {
      query: { pageSize: 100, ...params },
    });
  },
  issue(slug: string) {
    return request<Certificate>(`/courses/${slug}/certificate`, { method: "POST" });
  },
  get(id: string) {
    return request<Certificate>(`/certificates/${id}`);
  },
  download(id: string, format: "svg" | "pdf" = "pdf") {
    return requestBlob(`/certificates/${id}/download`, { query: { format } });
  },
  verify(serial: string) {
    return request<CertificateVerification>(`/certificates/verify/${serial}`);
  },
};

// ---- payments --------------------------------------------------------------

export const payments = {
  checkout(slug: string) {
    return request<Checkout>(`/courses/${slug}/checkout`, { method: "POST" });
  },
  verify(reference: string) {
    return request<{ payment: Payment; enrolled: boolean; newlyPaid: boolean }>(
      `/payments/${reference}/verify`,
    );
  },
  myOrders(params: Query = {}) {
    return requestRaw<Paged<Payment>>("/me/orders", { query: params });
  },
};

// ---- admin / instructor back office ---------------------------------------

export interface AdminCourseInput {
  title: string;
  slug?: string;
  summary?: string;
  description?: string[];
  contentHTML?: string;
  trackId?: string;
  instructorId?: string;
  format: CourseFormat;
  level: CourseLevel;
  premium?: boolean;
  priceKES?: number | null;
  originalPriceKES?: number | null;
  featured?: boolean;
  status?: CourseStatus;
  whatYouLearn?: string[];
  requirements?: string[];
  faqs?: { question: string; answer: string; sortOrder?: number }[];
}

export interface AdminLessonInput {
  title: string;
  sectionTitle?: string;
  sectionOrder?: number;
  minutes?: number;
  isPreview?: boolean;
  videoUrl?: string;
  contentHTML?: string;
  order?: number;
}

export const admin = {
  overview() {
    return request<AdminOverview>("/admin/overview");
  },

  courses(params: Query = {}) {
    return requestRaw<Paged<CourseCard>>("/admin/courses", {
      query: { pageSize: 100, ...params },
    });
  },
  course(slug: string) {
    return request<CourseDetail>(`/admin/courses/${slug}`);
  },
  createCourse(body: AdminCourseInput) {
    return request<CourseDetail>("/admin/courses", { method: "POST", body });
  },
  updateCourse(slug: string, body: Partial<AdminCourseInput>) {
    return request<CourseDetail>(`/admin/courses/${slug}`, { method: "PATCH", body });
  },
  deleteCourse(slug: string) {
    return request<{ deleted: boolean; slug: string }>(`/admin/courses/${slug}`, {
      method: "DELETE",
    });
  },

  lessons(slug: string) {
    return request<LessonSummary[]>(`/admin/courses/${slug}/lessons`);
  },
  lesson(slug: string, id: string) {
    return request<LessonDetail>(`/admin/courses/${slug}/lessons/${id}`);
  },
  createLesson(slug: string, body: AdminLessonInput) {
    return request<LessonDetail>(`/admin/courses/${slug}/lessons`, { method: "POST", body });
  },
  updateLesson(slug: string, id: string, body: Partial<AdminLessonInput>) {
    return request<LessonDetail>(`/admin/courses/${slug}/lessons/${id}`, {
      method: "PATCH",
      body,
    });
  },
  deleteLesson(slug: string, id: string) {
    return request<{ deleted: boolean; id: string }>(`/admin/courses/${slug}/lessons/${id}`, {
      method: "DELETE",
    });
  },
  reorderLessons(slug: string, lessons: { id: string; order?: number }[]) {
    return request<LessonSummary[]>(`/admin/courses/${slug}/lessons/reorder`, {
      method: "PATCH",
      body: { lessons },
    });
  },

  roster(slug: string, params: Query = {}) {
    return requestRaw<Paged<RosterRow>>(`/admin/courses/${slug}/learners`, {
      query: { pageSize: 100, ...params },
    });
  },
  learners(params: Query = {}) {
    return requestRaw<Paged<LearnerRow>>("/admin/learners", {
      query: { pageSize: 50, ...params },
    });
  },
  learner(userId: string) {
    return request<LearnerDetail>(`/admin/learners/${userId}`);
  },
  setLearnerRole(userId: string, role: "learner" | "instructor" | "admin") {
    return request<import("./types").ApiUser>(`/admin/learners/${userId}/role`, {
      method: "PATCH",
      body: { role },
    });
  },

  reviews(params: Query = {}) {
    return requestRaw<Paged<Review & { course?: { slug: string; title: string } }>>(
      "/admin/reviews",
      { query: { pageSize: 50, ...params } },
    );
  },
  deleteReview(id: string) {
    return request<{ deleted: boolean; id: string }>(`/admin/reviews/${id}`, {
      method: "DELETE",
    });
  },

  payments(params: Query = {}) {
    return requestRaw<PaymentList>("/admin/payments", { query: { pageSize: 50, ...params } });
  },
  refund(id: string, reason?: string) {
    return request<Payment>(`/admin/payments/${id}/refund`, {
      method: "POST",
      body: reason ? { reason } : {},
    });
  },

  tutors(params: Query = {}) {
    return requestRaw<Paged<AdminInstructor>>("/admin/tutors", {
      query: { pageSize: 100, ...params },
    });
  },
  createTutor(body: {
    name: string;
    title?: string;
    bio?: string;
    email?: string;
    avatarUrl?: string;
  }) {
    return request<AdminInstructor>("/admin/tutors", { method: "POST", body });
  },
  updateTutor(
    id: string,
    body: { name?: string; title?: string; bio?: string; email?: string; avatarUrl?: string },
  ) {
    return request<AdminInstructor>(`/admin/tutors/${id}`, { method: "PATCH", body });
  },
  deleteTutor(id: string) {
    return request<{ deleted: boolean; id: string }>(`/admin/tutors/${id}`, {
      method: "DELETE",
    });
  },

  tracks() {
    return request<Track[]>("/admin/tracks");
  },
  createTrack(body: { name: string; slug?: string; icon?: string; blurb?: string }) {
    return request<Track>("/admin/tracks", { method: "POST", body });
  },
  updateTrack(
    slug: string,
    body: { name?: string; slug?: string; icon?: string; blurb?: string },
  ) {
    return request<Track>(`/admin/tracks/${slug}`, { method: "PATCH", body });
  },
  deleteTrack(slug: string) {
    return request<{ deleted: boolean; id: string }>(`/admin/tracks/${slug}`, {
      method: "DELETE",
    });
  },
};
