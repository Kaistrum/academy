import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  categories,
  courses,
  coursePriceKES,
  type Category,
  type CourseFormat,
  type CourseLevel,
} from "@/data/courses";
import { tutors as seedTutors, tutorIdForCourse, type Tutor } from "@/data/tutors";
import { seedReviews, type Review } from "@/data/reviews";
import { seedLessons, type AdminLesson } from "@/data/lessons";

export interface AdminCourse {
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  tutorId: string;
  format: CourseFormat;
  level: CourseLevel;
  premium: boolean;
  priceKES: number | null;
  status: "draft" | "published";
  /** Rich course content authored in the Mantine Tiptap editor. */
  contentHTML: string;
  lessons: number;
  learners: string;
  rating: number;
  createdAt: string; // yyyy-mm-dd
}

const COURSES_KEY = "kaistrum-admin-courses";
const TUTORS_KEY = "kaistrum-admin-tutors";
const REVIEWS_KEY = "kaistrum-admin-reviews";
const LESSONS_KEY = "kaistrum-admin-lessons";
const TRACKS_KEY = "kaistrum-admin-tracks";

function seedCourses(): AdminCourse[] {
  return courses.map((c) => {
    // Spread creation dates across the last ~12 months using addedOrder.
    const month = ((c.addedOrder + 6) % 12) + 1;
    return {
      slug: c.slug,
      title: c.title,
      summary: c.summary,
      categorySlug: categories.find((cat) => cat.name === c.category)?.slug ?? categories[0].slug,
      tutorId: tutorIdForCourse(c) ?? seedTutors[0].id,
      format: c.format,
      level: c.level,
      premium: c.premium,
      priceKES: coursePriceKES(c)?.price ?? null,
      status: "published" as const,
      contentHTML: `<p>${c.description.join("</p><p>")}</p>`,
      lessons: c.lessons,
      learners: c.learners,
      rating: c.rating,
      createdAt: `2025-${String(month).padStart(2, "0")}-12`,
    };
  });
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface AdminValue {
  courses: AdminCourse[];
  tutors: Tutor[];
  getCourse: (slug: string) => AdminCourse | undefined;
  addCourse: (c: Omit<AdminCourse, "slug" | "createdAt"> & { slug?: string }) => string;
  updateCourse: (slug: string, patch: Partial<AdminCourse>) => void;
  deleteCourse: (slug: string) => void;
  getTutor: (id: string) => Tutor | undefined;
  addTutor: (t: Omit<Tutor, "id">) => string;
  updateTutor: (id: string, patch: Partial<Tutor>) => void;
  deleteTutor: (id: string) => void;
  reviews: Review[];
  reviewsForCourse: (slug: string) => Review[];
  removeReview: (id: string) => void;
  lessons: AdminLesson[];
  lessonsForCourse: (slug: string) => AdminLesson[];
  getLesson: (id: string) => AdminLesson | undefined;
  lessonCount: (slug: string) => number;
  courseDuration: (slug: string) => number;
  addLesson: (slug: string, data: { title: string; minutes: number; contentHTML?: string }) => string;
  updateLesson: (
    id: string,
    patch: Partial<Pick<AdminLesson, "title" | "minutes" | "contentHTML">>,
  ) => void;
  deleteLesson: (id: string) => void;
  tracks: Category[];
  getTrack: (slug: string) => Category | undefined;
  addTrack: (t: Omit<Category, "slug"> & { slug?: string }) => string;
  updateTrack: (slug: string, patch: Partial<Category>) => void;
  deleteTrack: (slug: string) => void;
}

const AdminContext = createContext<AdminValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [courseList, setCourseList] = useState<AdminCourse[]>(seedCourses);
  const [tutorList, setTutorList] = useState<Tutor[]>(seedTutors);
  const [reviewList, setReviewList] = useState<Review[]>(seedReviews);
  const [lessonList, setLessonList] = useState<AdminLesson[]>(seedLessons);
  const [trackList, setTrackList] = useState<Category[]>(categories);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(COURSES_KEY);
      const t = localStorage.getItem(TUTORS_KEY);
      const r = localStorage.getItem(REVIEWS_KEY);
      const l = localStorage.getItem(LESSONS_KEY);
      const k = localStorage.getItem(TRACKS_KEY);
      if (c) setCourseList(JSON.parse(c));
      if (t) setTutorList(JSON.parse(t));
      if (r) setReviewList(JSON.parse(r));
      if (l) setLessonList(JSON.parse(l));
      if (k) setTrackList(JSON.parse(k));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(COURSES_KEY, JSON.stringify(courseList));
      localStorage.setItem(TUTORS_KEY, JSON.stringify(tutorList));
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviewList));
      localStorage.setItem(LESSONS_KEY, JSON.stringify(lessonList));
      localStorage.setItem(TRACKS_KEY, JSON.stringify(trackList));
    } catch {
      /* ignore */
    }
  }, [courseList, tutorList, reviewList, lessonList, trackList, loaded]);

  const getCourse = useCallback(
    (slug: string) => courseList.find((c) => c.slug === slug),
    [courseList],
  );

  const addCourse = useCallback<AdminValue["addCourse"]>((data) => {
    let slug = data.slug || slugify(data.title) || `course-${Date.now()}`;
    setCourseList((prev) => {
      if (prev.some((c) => c.slug === slug)) slug = `${slug}-${prev.length + 1}`;
      const created: AdminCourse = {
        ...data,
        slug,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      return [created, ...prev];
    });
    return slug;
  }, []);

  const updateCourse = useCallback<AdminValue["updateCourse"]>((slug, patch) => {
    setCourseList((prev) => prev.map((c) => (c.slug === slug ? { ...c, ...patch } : c)));
  }, []);

  const deleteCourse = useCallback<AdminValue["deleteCourse"]>((slug) => {
    setCourseList((prev) => prev.filter((c) => c.slug !== slug));
  }, []);

  const getTutor = useCallback(
    (id: string) => tutorList.find((t) => t.id === id),
    [tutorList],
  );

  const addTutor = useCallback<AdminValue["addTutor"]>((data) => {
    const id = `t-${slugify(data.name) || Date.now()}`;
    setTutorList((prev) => [{ id, ...data }, ...prev]);
    return id;
  }, []);

  const updateTutor = useCallback<AdminValue["updateTutor"]>((id, patch) => {
    setTutorList((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const deleteTutor = useCallback<AdminValue["deleteTutor"]>((id) => {
    setTutorList((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reviewsForCourse = useCallback(
    (slug: string) =>
      reviewList
        .filter((r) => r.courseSlug === slug)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [reviewList],
  );

  const removeReview = useCallback<AdminValue["removeReview"]>((id) => {
    setReviewList((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ── Lessons ──
  const lessonsForCourse = useCallback(
    (slug: string) =>
      lessonList.filter((l) => l.courseSlug === slug).sort((a, b) => a.order - b.order),
    [lessonList],
  );

  const getLesson = useCallback(
    (id: string) => lessonList.find((l) => l.id === id),
    [lessonList],
  );

  const lessonCount = useCallback(
    (slug: string) => lessonList.reduce((n, l) => (l.courseSlug === slug ? n + 1 : n), 0),
    [lessonList],
  );

  const courseDuration = useCallback(
    (slug: string) =>
      lessonList.reduce((n, l) => (l.courseSlug === slug ? n + l.minutes : n), 0),
    [lessonList],
  );

  const addLesson = useCallback<AdminValue["addLesson"]>((slug, data) => {
    const id = `LSN-${slug}-${Date.now()}`;
    setLessonList((prev) => {
      const order = prev.filter((l) => l.courseSlug === slug).length;
      return [
        ...prev,
        {
          id,
          courseSlug: slug,
          title: data.title,
          minutes: data.minutes,
          contentHTML: data.contentHTML ?? "",
          order,
        },
      ];
    });
    return id;
  }, []);

  const updateLesson = useCallback<AdminValue["updateLesson"]>((id, patch) => {
    setLessonList((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const deleteLesson = useCallback<AdminValue["deleteLesson"]>((id) => {
    setLessonList((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // ── Tracks (categories) ──
  const getTrack = useCallback(
    (slug: string) => trackList.find((t) => t.slug === slug),
    [trackList],
  );

  const addTrack = useCallback<AdminValue["addTrack"]>((data) => {
    let slug = data.slug || slugify(data.name) || `track-${Date.now()}`;
    setTrackList((prev) => {
      if (prev.some((t) => t.slug === slug)) slug = `${slug}-${prev.length + 1}`;
      return [...prev, { ...data, slug }];
    });
    return slug;
  }, []);

  const updateTrack = useCallback<AdminValue["updateTrack"]>((slug, patch) => {
    setTrackList((prev) => prev.map((t) => (t.slug === slug ? { ...t, ...patch } : t)));
  }, []);

  const deleteTrack = useCallback<AdminValue["deleteTrack"]>((slug) => {
    setTrackList((prev) => prev.filter((t) => t.slug !== slug));
  }, []);

  return (
    <AdminContext.Provider
      value={{
        courses: courseList,
        tutors: tutorList,
        getCourse,
        addCourse,
        updateCourse,
        deleteCourse,
        getTutor,
        addTutor,
        updateTutor,
        deleteTutor,
        reviews: reviewList,
        reviewsForCourse,
        removeReview,
        lessons: lessonList,
        lessonsForCourse,
        getLesson,
        lessonCount,
        courseDuration,
        addLesson,
        updateLesson,
        deleteLesson,
        tracks: trackList,
        getTrack,
        addTrack,
        updateTrack,
        deleteTrack,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>");
  return ctx;
}
