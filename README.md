# Kaistrum Academy — front end

Next.js 16 (Pages Router) client for the Kaistrum Academy API. Every screen —
catalogue, course detail, the Tiptap lesson player, enrolment and progress,
favourites, reviews, certificates, checkout and the admin/instructor console —
reads and writes the live API. There is no mock data in the app.

## Running it

The API has to be up first (see `../Backend/README.md`):

```bash
cd ../Backend && pnpm seed:fresh && pnpm dev   # http://localhost:4000/api/v1
```

Then:

```bash
npm install
npm run dev                                    # http://localhost:3000
```

`.env.local` points the browser at the API:

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

That origin must appear in the backend's `CORS_ORIGINS`, and requests are sent
with credentials so the `ka_refresh` cookie survives the round trip.

Seeded logins: `admin@kaistrum.com` / `Admin12345`, `grace.wanjiru@kaistrum.com`
/ `Tutor12345`, `learner@kaistrum.com` / `Learner12345`.

## How the API layer is put together

```
src/lib/api/
  client.ts     fetch wrapper: base URL, bearer token, one refresh-and-retry
                on 401, `ApiError` carrying the server's code/fields/checkout
  types.ts      TypeScript mirrors of every response shape
  index.ts      one function per endpoint, grouped as the API groups them
src/lib/catalog.ts   enum labels, money/duration/date formatting, and the
                     API-course → view-model adapter the components render
src/hooks/useAsync.ts  loads on dep change, ignores superseded runs, `reload()`
src/context/    AuthContext · EnrollmentsContext · FavouritesContext
```

Pages never build URLs or parse envelopes: they call `courses.list(…)`,
`admin.updateCourse(…)` and so on, and render the result.

**Tokens.** The 15-minute access token lives in memory and `localStorage`; the
rotating refresh token is held both as the API's `httpOnly` cookie and as a
stored copy, so a browser that drops third-party cookies still refreshes. A 401
triggers exactly one refresh attempt, shared between concurrent callers, before
the original request is replayed; if that fails the session is cleared and the
UI falls back to signed-out.

**Data fetching is client-side.** Course pages have no `getStaticProps` — the
response depends on who is asking (enrolment, favourite and lock state), and the
token only exists in the browser.

**Enrolment.** `POST /courses/:slug/enroll` answers `402` with a `checkout`
block for premium courses; the detail page catches that, calls
`POST /courses/:slug/checkout` and redirects to Paystack. Paystack returns to
`/checkout/callback`, which verifies the reference server-side (idempotent — the
webhook may have granted access already).

**Progress** is never computed in the client. "Mark complete & continue" calls
`PUT /enrollments/:id/lessons/:lessonId/complete` and re-reads the curriculum.

**Roles.** `/admin` is gated on `role` — instructors see the console scoped to
their own courses, admins see everything. The API enforces this independently;
the client-side guard only avoids a wall of 403s.

## Routes

| Page | Endpoints |
|------|-----------|
| `/` | `GET /tracks`, `GET /courses/featured`, `GET /courses` |
| `/courses` | `GET /courses` (server-side search, filter, sort, paging) |
| `/courses/[slug]` | detail, curriculum, related, reviews, enrol/checkout, favourite, certificate |
| `/courses/[slug]/learn` | curriculum, lesson body, complete/uncomplete |
| `/my-learning` | `GET /me/enrollments`, `GET /users/me/stats`, certificate download |
| `/favourites` | `GET /me/favourites` |
| `/signin` | login, register, forgot password, `GET /auth/providers`, OAuth start |
| `/auth/callback` | `POST /auth/oauth/exchange` |
| `/checkout/callback` | `GET /payments/:reference/verify` |
| `/verify-email`, `/reset-password` | the links the API emails |
| `/admin/**` | the `/admin` back office |

> `schema.md` in this folder is the original contract sketch written before the
> API existed. `../Backend/README.md` is the authoritative reference.
