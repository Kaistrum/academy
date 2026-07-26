import "@/styles/globals.css";
import "@mantine/core/styles.css";
import "@mantine/tiptap/styles.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@kaistrum/stratum-ui";
import { MantineProvider, createTheme } from "@mantine/core";
import { AuthProvider } from "@/context/AuthContext";
import { EnrollmentsProvider } from "@/context/EnrollmentsContext";
import { FavouritesProvider } from "@/context/FavouritesContext";

// Keep Mantine (used for the Tiptap course-content editor) visually aligned
// with the Stratum brand: teal primary, SF Pro type, sharp corners.
const mantineTheme = createTheme({
  primaryColor: "teal",
  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  defaultRadius: "sm",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider defaultTheme="dark">
      <MantineProvider theme={mantineTheme} forceColorScheme="dark">
        <AuthProvider>
          <EnrollmentsProvider>
            <FavouritesProvider>
              <Component {...pageProps} />
            </FavouritesProvider>
          </EnrollmentsProvider>
        </AuthProvider>
      </MantineProvider>
    </ThemeProvider>
  );
}
