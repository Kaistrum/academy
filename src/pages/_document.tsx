import { Html, Head, Main, NextScript } from "next/document";
import { ColorSchemeScript, mantineHtmlProps } from "@mantine/core";

export default function Document() {
  return (
    <Html lang="en" {...mantineHtmlProps}>
      <Head>
        <ColorSchemeScript defaultColorScheme="dark" />
        {/* Favicons (generated from logo.png) */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#07090F" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
