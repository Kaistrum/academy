import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Alert, Button, Card, Input } from "@kaistrum/stratum-ui";
import { KeyRound, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { ApiError, auth as authApi } from "@/lib/api";

/** Landing page for the link in the password-reset email. */
export default function ResetPassword() {
  const router = useRouter();
  const token = typeof router.query.token === "string" ? router.query.token : "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await authApi.resetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset your password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Reset password — Kaistrum Academy</title>
      </Head>

      <div className="mx-auto flex max-w-md flex-col px-4 py-20">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-accent text-text-on-accent">
            <KeyRound size={22} strokeWidth={2.2} />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
          <p className="mt-2 text-text-dim">
            Choose something at least 8 characters long, with a letter and a number.
          </p>
        </div>

        <Card surface="card" padding="spacious" className="border border-border">
          {done ? (
            <div className="text-center">
              <Alert variant="success" title="Password updated">
                All other devices have been signed out.
              </Alert>
              <Link href="/signin">
                <Button variant="primary" className="mt-5">
                  Sign in
                </Button>
              </Link>
            </div>
          ) : !token ? (
            <Alert variant="danger" title="Missing token">
              This link is incomplete. Request a new reset email from the sign-in page.
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              {error && (
                <Alert variant="danger" onDismiss={() => setError(null)}>
                  {error}
                </Alert>
              )}
              <Input
                type="password"
                label="New password"
                autoComplete="new-password"
                leadingIcon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Confirm password"
                autoComplete="new-password"
                leadingIcon={<Lock size={16} />}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" fullWidth loading={submitting}>
                Update password
              </Button>
            </form>
          )}
        </Card>
      </div>
    </Layout>
  );
}
