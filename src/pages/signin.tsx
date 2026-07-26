import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Alert, Button, Card, Checkbox, Divider, Input } from "@kaistrum/stratum-ui";
import { GraduationCap, Lock, Mail, User } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";
import { ApiError, auth as authApi, type OAuthProviders } from "@/lib/api";

type Mode = "signin" | "register" | "forgot";

export default function SignIn() {
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<string | null>(null);
  const [providers, setProviders] = useState<OAuthProviders>({ google: false, github: false });

  const next = typeof router.query.next === "string" ? router.query.next : "/my-learning";

  useEffect(() => {
    authApi.providers().then(setProviders).catch(() => {});
  }, []);

  // The provider redirect appends ?error= when consent is declined.
  useEffect(() => {
    if (typeof router.query.error === "string") setError(`Sign-in failed: ${router.query.error}`);
  }, [router.query.error]);

  // Already signed in — don't make them do it twice.
  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFields({});
    setInfo(null);
    try {
      if (mode === "signin") {
        await signIn(email, password, remember);
        router.push(next);
      } else if (mode === "register") {
        await signUp(name, email, password);
        router.push(next);
      } else {
        await authApi.forgotPassword(email);
        setInfo("If that address has an account, a reset link is on its way.");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFields(err.fields ?? {});
      } else {
        setError("Could not reach the server. Is the API running?");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const heading =
    mode === "signin"
      ? "Welcome back"
      : mode === "register"
        ? "Create your account"
        : "Reset your password";

  const blurb =
    mode === "signin"
      ? "Sign in to continue learning where you left off."
      : mode === "register"
        ? "Start learning in under a minute."
        : "We'll email you a link to set a new password.";

  return (
    <Layout>
      <Head>
        <title>{heading} — Kaistrum Academy</title>
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
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{heading}</h1>
            <p className="mt-2 text-text-dim">{blurb}</p>
          </div>

          <Card surface="card" padding="spacious" className="border border-border">
            {error && (
              <Alert variant="danger" className="mb-5" onDismiss={() => setError(null)}>
                {error}
              </Alert>
            )}
            {info && (
              <Alert variant="success" className="mb-5" onDismiss={() => setInfo(null)}>
                {info}
              </Alert>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              {mode === "register" && (
                <Input
                  label="Full name"
                  placeholder="Sam Okoro"
                  autoComplete="name"
                  leadingIcon={<User size={16} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={fields.name}
                  required
                />
              )}

              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                leadingIcon={<Mail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={fields.email}
                required
              />

              {mode !== "forgot" && (
                <Input
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  leadingIcon={<Lock size={16} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={fields.password}
                  hint={
                    mode === "register"
                      ? "At least 8 characters, with a letter and a number."
                      : undefined
                  }
                  required
                />
              )}

              {mode === "signin" && (
                <div className="flex items-center justify-between">
                  <Checkbox
                    label="Remember me"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm text-accent hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" variant="primary" fullWidth loading={submitting}>
                {mode === "signin"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create account"
                    : "Email me a link"}
              </Button>
            </form>

            {mode !== "forgot" && (providers.google || providers.github) && (
              <>
                <Divider label="or" className="my-6" />
                <div className="flex flex-col gap-3">
                  {providers.google && (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        window.location.href = authApi.oauthStartUrl("google", next);
                      }}
                    >
                      Continue with Google
                    </Button>
                  )}
                  {providers.github && (
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        window.location.href = authApi.oauthStartUrl("github", next);
                      }}
                    >
                      Continue with GitHub
                    </Button>
                  )}
                </div>
              </>
            )}
          </Card>

          <p className="mt-6 text-center text-sm text-text-dim">
            {mode === "signin" ? (
              <>
                New to Kaistrum Academy?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-medium text-accent hover:underline"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-medium text-accent hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
          <p className="mt-3 text-center text-xs text-text-muted">
            By continuing you agree to our{" "}
            <Link href="/#about" className="hover:text-text-dim">
              terms
            </Link>
            .
          </p>
        </div>
      </section>
    </Layout>
  );
}
