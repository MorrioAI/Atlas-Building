# ADR-0005: Media access is decided by the database, not by bucket visibility

**Status:** Accepted

## Context
AI Video Intro stores a recording in object storage and saves a reference on the row. The
obvious implementation puts the file in a public bucket and stores the public URL.

That works until the product offers a privacy setting. Changing the setting changes the row; it
does not change what the URL serves. Anyone who ever held the link keeps it — after the owner
makes the profile private, after a moderator removes the content, forever. The row says private
and the bucket says otherwise, and the bucket wins.

This matters more here than in most products. Atlas asks people to record themselves. If we
cannot honour "make this private", we should not be asking.

## Decision
The bucket is private. The database decides.

1. The row stores a path into our own route — `/api/media/video/{key}` — not a storage URL.
2. That route loads the row behind the object, decides whether the caller may see it, and
   **redirects** to a short-lived signed URL.
3. Bytes come from storage directly. The app never proxies a video.

Three details that are not obvious until you hit them, each one enforced in the code:

- **Redirect, don't stream.** Proxying bytes costs bandwidth on every view; a 307 costs one
  function invocation. Range requests survive the redirect, so scrubbing still works.
- **The stored value is relative.** The same row then resolves in every environment. Anything
  that needs an absolute URL — an Open Graph tag, a server-side fetch — converts at the point
  of use, and nowhere else.
- **The parser accepts the old form too.** Legacy absolute storage URLs resolve to the same key.
  The backfill is a tidy-up rather than a prerequisite, and nothing breaks between deploy and
  migration.

## Consequences
Private means private, and revocation is real: changing the row changes what the next request
gets.

**The signed URL is a bearer token for its lifetime.** Anyone who copies it out of a network tab
can replay it until it expires. That is a deliberate trade — a short window of exposure to
someone who has already loaded the page, against a permanent public URL held by anyone who ever
saw the link. It is not the same as "the problem is gone". Keep the expiry short; do not put
signed URLs anywhere durable, such as a cached page or an email.

One extra hop before playback starts, and one function invocation per view.

Implementation: `src/lib/media/paths.ts`, `src/app/api/media/video/[...key]/route.ts`.
