# Engineering — Error Reporting

An alerting channel has exactly one failure mode that matters: it stops being read. Three rules
keep it readable, and one runtime trap will take the whole site down if you miss it.

## Three rules

**Dedupe on a key.** An alert that fires per request teaches everyone to ignore the sender. One
notification per `(route, error)` per day: a retry loop sends one message, and a genuinely new
failure still gets through.

**Never throw.** A reporter that fails during an incident turns one problem into two, and the
second one hides the first. Swallow, log, carry on.

**Filter what is expected.** A rate limit doing its job is not an incident. Neither is a
framework's redirect-as-control-flow, nor a client that navigated away mid-request. Every
expected error you leave in the channel costs you a reader.

## The runtime trap

This is the part worth writing down, because the symptom does not point at the cause.

Frameworks that compile one file for two runtimes will compile your error reporter for both.
If the reporter imports anything Node-only — a mail library reaching for `stream`, say — the
module fails to compile under the edge runtime. The symptom is not "alerting is off". The
symptom is *every route returning 500*, including in development, with a stack trace that names
the mailer and not your code.

Making the import dynamic does not help. The bundler still follows it.

**The fix: the reporter imports nothing.** It speaks to an ordinary server route over HTTP,
which both runtimes can do. All the Node-only machinery lives behind that route, on one runtime,
where it is allowed to.

```ts
// Imports nothing on purpose — this module is compiled for every runtime.
export function reportError(key: string, err: unknown): void {
  void fetch("/api/internal/error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, message: err instanceof Error ? err.message : String(err) }),
  }).catch(() => {})   // rule 2: never throw
}
```

Exempt that route from every gate you have — auth walls, maintenance mode, the lot. An error
raised *during* an outage is the error most worth hearing about, and a gate that swallows it
is a gate that blinds you exactly when you are looking.

The general rule outlives alerting: **a module that runs in more than one runtime should depend
on the intersection of what they offer, not the union.** When that is too little to do the job,
put the job behind a network boundary.
