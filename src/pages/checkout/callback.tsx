import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@kaistrum/stratum-ui";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { useEnrollments } from "@/context/EnrollmentsContext";
import { ApiError, payments as paymentsApi, type Payment } from "@/lib/api";
import { formatKES } from "@/lib/catalog";

/**
 * Paystack sends the learner back here with `?reference=`. Verification is
 * server-side and idempotent, so it is safe to run on every visit — the webhook
 * may well have granted access already.
 */
export default function CheckoutCallback() {
  const router = useRouter();
  const { reload: reloadEnrollments } = useEnrollments();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const verified = useRef(false);

  useEffect(() => {
    if (!router.isReady || verified.current) return;
    const reference =
      typeof router.query.reference === "string"
        ? router.query.reference
        : typeof router.query.trxref === "string"
          ? router.query.trxref
          : null;

    if (!reference) {
      setError("No payment reference was returned.");
      return;
    }

    verified.current = true;
    paymentsApi
      .verify(reference)
      .then((result) => {
        setPayment(result.payment);
        reloadEnrollments();
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "We couldn't verify that payment.");
      });
  }, [router, reloadEnrollments]);

  const courseSlug = payment?.course?.slug;

  return (
    <Layout>
      <Head>
        <title>Payment — Kaistrum Academy</title>
      </Head>

      <div className="mx-auto max-w-md px-4 py-28 text-center">
        {error ? (
          <>
            <XCircle size={32} className="mx-auto text-danger" />
            <h1 className="mt-4 text-xl font-semibold">Payment not confirmed</h1>
            <p className="mt-2 text-text-dim">{error}</p>
            <Link href="/courses">
              <Button variant="outline" className="mt-6">
                Back to courses
              </Button>
            </Link>
          </>
        ) : payment ? (
          <>
            <CheckCircle2 size={32} className="mx-auto text-success" />
            <h1 className="mt-4 text-xl font-semibold">You&apos;re enrolled</h1>
            <p className="mt-2 text-text-dim">
              {formatKES(payment.amountKES)} paid for{" "}
              <span className="text-text">{payment.course?.title ?? "your course"}</span>.
            </p>
            <p className="mt-1 font-mono text-xs text-text-muted">{payment.reference}</p>
            <div className="mt-6 flex justify-center gap-3">
              {courseSlug && (
                <Link href={`/courses/${courseSlug}/learn`}>
                  <Button variant="primary">Start learning</Button>
                </Link>
              )}
              <Link href="/my-learning">
                <Button variant="outline">My learning</Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <Loader2 size={28} className="mx-auto animate-spin text-accent" />
            <p className="mt-4 text-text-dim">Confirming your payment…</p>
          </>
        )}
      </div>
    </Layout>
  );
}
