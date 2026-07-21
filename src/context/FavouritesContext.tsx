import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "kaistrum-favourites";

// Seeded so the very first (server + client) render is deterministic; the
// user's real list is loaded from localStorage after mount.
const SEED = ["utility-network-basics", "cartography-for-the-web"];

interface FavouritesValue {
  favourites: string[];
  isFavourite: (slug: string) => boolean;
  toggle: (slug: string) => void;
}

const FavouritesContext = createContext<FavouritesValue>({
  favourites: SEED,
  isFavourite: () => false,
  toggle: () => {},
});

export function FavouritesProvider({ children }: { children: ReactNode }) {
  const [favourites, setFavourites] = useState<string[]>(SEED);
  const [loaded, setLoaded] = useState(false);

  // Load persisted favourites once, on the client.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFavourites(JSON.parse(raw));
    } catch {
      /* ignore malformed storage */
    }
    setLoaded(true);
  }, []);

  // Persist after the initial load so we don't clobber storage with the seed.
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
    } catch {
      /* storage may be unavailable */
    }
  }, [favourites, loaded]);

  const toggle = useCallback((slug: string) => {
    setFavourites((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const isFavourite = useCallback(
    (slug: string) => favourites.includes(slug),
    [favourites],
  );

  return (
    <FavouritesContext.Provider value={{ favourites, isFavourite, toggle }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}
