import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { ApiError, auth as authApi } from "@/lib/api";

/**
 * OAuth landing page. The API redirects here with a single-use, two-minute
 * code — never a token — which we swap for a real session.
 */
export default function OAuthCallback() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const exchanged = useRef(false);

  useEffect(() => {
    if (!router.isReady || exchanged.current) return;
    const code = typeof router.query.code === "string" ? router.query.code : null;
    const returnTo =
      typeof router.query.returnTo === "string" ? router.query.returnTo : "/my-learning";

    if (!code) {
      setError("That sign-in link is missing its code.");
      return;
    }

    exchanged.current = true;
    authApi
      .exchangeOAuthCode(code)
      .then(async () => {
        await refresh();
        router.replace(returnTo);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "That sign-in link has expired.",
        );
      });
  }, [router, refresh]);

  return (
    <Layout>
      <Head>
        <title>Signing you in — Kaistrum Academy</title>
      </Head>
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        {error ? (
          <>
            <h1 className="text-xl font-semibold">Sign-in failed</h1>
            <p className="mt-2 text-text-dim">{error}</p>
            <Link href="/signin" className="mt-6 inline-block text-accent hover:underline">
              Try again
            </Link>
          </>
        ) : (
          <>
            <Loader2 size={28} className="mx-auto animate-spin text-accent" />
            <p className="mt-4 text-text-dim">Signing you in…</p>
          </>
        )}
      </div>
    </Layout>
  );
}
