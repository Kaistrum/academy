import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button, Card, Checkbox, Divider, Input } from "@kaistrum/stratum-ui";
import { GraduationCap, Lock, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import { currentUser } from "@/data/enrollment";

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Mock auth: no real backend — just send the learner to their dashboard.
    setSubmitting(true);
    setTimeout(() => router.push("/my-learning"), 500);
  }

  return (
    <Layout>
      <Head>
        <title>Sign in — Kaistrum Academy</title>
        <meta name="description" content="Sign in to your Kaistrum Academy account." />
      </Head>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(50% 40% at 50% 0%, var(--accent-faint), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex max-w-md flex-col px-4 py-16 md:py-24">
          <div className="mb-8 text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-accent text-text-on-accent">
              <GraduationCap size={24} strokeWidth={2.2} />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 text-text-dim">
              Sign in to continue learning where you left off.
            </p>
          </div>

          <Card surface="card" padding="spacious" className="border border-border">
            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                leadingIcon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                autoComplete="current-password"
                leadingIcon={<Lock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex items-center justify-between">
                <Checkbox label="Remember me" defaultChecked />
                <Link href="/signin" className="text-sm text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={submitting}
              >
                Sign in
              </Button>
            </form>

            <Divider label="or" className="my-6" />

            <div className="flex flex-col gap-3">
              <Button variant="outline" fullWidth onClick={() => router.push("/my-learning")}>
                Continue with Google
              </Button>
              <Button variant="outline" fullWidth onClick={() => router.push("/my-learning")}>
                Continue with GitHub
              </Button>
            </div>
          </Card>

          <p className="mt-6 text-center text-sm text-text-dim">
            New to Kaistrum Academy?{" "}
            <Link href="/signin" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-text-muted">
            Demo only — any credentials will take you to your dashboard.
          </p>
        </div>
      </section>
    </Layout>
  );
}
