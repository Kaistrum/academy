import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { enrollments as enrollmentsApi, type EnrollmentWithCourse } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface EnrollmentsValue {
  list: EnrollmentWithCourse[];
  loading: boolean;
  getEnrollment: (slug: string) => EnrollmentWithCourse | undefined;
  isEnrolled: (slug: string) => boolean;
  isCompleted: (slug: string) => boolean;
  reload: () => void;
}

const EnrollmentsContext = createContext<EnrollmentsValue>({
  list: [],
  loading: false,
  getEnrollment: () => undefined,
  isEnrolled: () => false,
  isCompleted: () => false,
  reload: () => {},
});

/**
 * The signed-in learner's enrolments, loaded once and shared. Course cards read
 * it to show the "Enrolled" badge and progress bar without a request each.
 */
export function EnrollmentsProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [list, setList] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setList([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    enrollmentsApi
      .mine()
      .then(({ data }) => {
        if (!cancelled) setList(data);
      })
      .catch(() => {
        if (!cancelled) setList([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, user?.id, nonce]);

  const bySlug = useMemo(() => {
    const map = new Map<string, EnrollmentWithCourse>();
    for (const row of list) if (row.course?.slug) map.set(row.course.slug, row);
    return map;
  }, [list]);

  const getEnrollment = useCallback((slug: string) => bySlug.get(slug), [bySlug]);
  const isEnrolled = useCallback((slug: string) => bySlug.has(slug), [bySlug]);
  const isCompleted = useCallback(
    (slug: string) => bySlug.get(slug)?.status === "completed",
    [bySlug],
  );
  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const value = useMemo<EnrollmentsValue>(
    () => ({ list, loading, getEnrollment, isEnrolled, isCompleted, reload }),
    [list, loading, getEnrollment, isEnrolled, isCompleted, reload],
  );

  return <EnrollmentsContext.Provider value={value}>{children}</EnrollmentsContext.Provider>;
}

export function useEnrollments() {
  return useContext(EnrollmentsContext);
}
