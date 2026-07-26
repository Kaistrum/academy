import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@kaistrum/stratum-ui";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { ApiError, auth as authApi } from "@/lib/api";

/** Landing page for the link in the verification email. */
export default function VerifyEmail() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [state, setState] = useState<"working" | "done" | "failed">("working");
  const [error, setError] = useState<string | null>(null);
  const consumed = useRef(false);

  useEffect(() => {
    if (!router.isReady || consumed.current) return;
    const token = typeof router.query.token === "string" ? router.query.token : null;
    if (!token) {
      setState("failed");
      setError("That link is missing its token.");
      return;
    }

    consumed.current = true;
    authApi
      .verifyEmail(token)
      .then(async () => {
        await refresh();
        setState("done");
      })
      .catch((err) => {
        setState("failed");
        setError(err instanceof ApiError ? err.message : "That link has expired.");
      });
  }, [router, refresh]);

  return (
    <Layout>
      <Head>
        <title>Verify email — Kaistrum Academy</title>
      </Head>
      <div className="mx-auto max-w-md px-4 py-28 text-center">
        {state === "working" && (
          <>
            <Loader2 size={28} className="mx-auto animate-spin text-accent" />
            <p className="mt-4 text-text-dim">Verifying your email…</p>
          </>
        )}
        {state === "done" && (
          <>
            <CheckCircle2 size={32} className="mx-auto text-success" />
            <h1 className="mt-4 text-xl font-semibold">Email verified</h1>
            <p className="mt-2 text-text-dim">Thanks — your account is fully set up.</p>
            <Link href="/my-learning">
              <Button variant="primary" className="mt-6">
                Go to my learning
              </Button>
            </Link>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle size={32} className="mx-auto text-danger" />
            <h1 className="mt-4 text-xl font-semibold">Verification failed</h1>
            <p className="mt-2 text-text-dim">{error}</p>
            <Link href="/signin">
              <Button variant="outline" className="mt-6">
                Back to sign in
              </Button>
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
}
