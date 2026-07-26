import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/router";
import { favourites as favouritesApi, type CourseCard } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface FavouritesValue {
  /** Slugs of the signed-in learner's saved courses. */
  favourites: string[];
  saved: CourseCard[];
  loading: boolean;
  isFavourite: (slug: string) => boolean;
  toggle: (slug: string) => void;
  reload: () => void;
}

const FavouritesContext = createContext<FavouritesValue>({
  favourites: [],
  saved: [],
  loading: false,
  isFavourite: () => false,
  toggle: () => {},
  reload: () => {},
});

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, status } = useAuth();
  const [saved, setSaved] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setSaved([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    favouritesApi
      .list()
      .then(({ data }) => {
        if (!cancelled) setSaved(data);
      })
      .catch(() => {
        if (!cancelled) setSaved([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, user?.id, nonce]);

  const favourites = useMemo(() => saved.map((c) => c.slug), [saved]);

  const isFavourite = useCallback((slug: string) => favourites.includes(slug), [favourites]);

  const toggle = useCallback(
    (slug: string) => {
      if (!user) {
        router.push(`/signin?next=${encodeURIComponent(router.asPath)}`);
        return;
      }

      const wasSaved = saved.some((c) => c.slug === slug);
      // Optimistic: drop or stub the row now, reconcile from the server after.
      setSaved((prev) =>
        wasSaved
          ? prev.filter((c) => c.slug !== slug)
          : [...prev, { slug } as CourseCard],
      );

      const call = wasSaved ? favouritesApi.remove(slug) : favouritesApi.add(slug);
      call
        .then(() => setNonce((n) => n + 1))
        .catch(() => setNonce((n) => n + 1));
    },
    [router, saved, user],
  );

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const value = useMemo<FavouritesValue>(
    () => ({ favourites, saved, loading, isFavourite, toggle, reload }),
    [favourites, saved, loading, isFavourite, toggle, reload],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  return useContext(FavouritesContext);
}
