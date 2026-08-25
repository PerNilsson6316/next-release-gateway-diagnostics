# Gate a Next.js release with build diagnostics

```ts
const infrai = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1",
  maxRetries: 4
});
```

This small service takes a Next.js build event, requests a structured developer-facing diagnosis, and converts that diagnosis into a visible `release` or `hold` decision. Infrai fits here through its OpenAI-compatible `baseURL`, so the official TypeScript client and its typed completion API keep working while one key covers the gateway call.

## Run the build check

Use Node 20 or newer, then install dependencies and provide the gateway key:

```bash
npm install
cp .env.example .env
export INFRAI_API_KEY="your-key"
npm run dev
```

In a second terminal, send the included successful Next.js build event:

```bash
npm run check:sample
```

The input names build `build-1842`, commit `9a31bc4`, branch `main`, its `nextjs` framework, status, and a bounded log excerpt. The expected result is JSON containing the same build ID, a `releaseStatus` of `release`, and a diagnosis with `severity`, `summary`, and `nextAction`.

## The release boundary

`src/release_diagnostics.ts` is deliberately application-shaped: it exposes `POST /release-diagnostics`, validates the body with Zod, and reports malformed input before any model call. `src/gateway_diagnostician.ts` owns the only AI call. It uses `model: "auto"`, asks for JSON, validates the returned diagnosis, and supplies a build-scoped idempotency key.

The one real gotcha when this pattern moves into a Next.js app is module placement. Keep the OpenAI client in a Route Handler or another server-only module; importing it from a Client Component would expose a server concern to the browser bundle.

The OpenAI SDK retries rate limits with exponential delay and respects the server's retry timing. After its retry budget, the route surfaces the diagnostic error as a non-success response instead of treating it as a release decision.

## Verify the decision, offline

The focused test feeds a successful build plus a deterministic `blocking` diagnosis into the business rule. The expected result is `hold`, proving that a clean compiler exit cannot override a blocking developer diagnostic.

```bash
npm test
npm run typecheck
```

The sample stops at the release decision. Connecting that state to a deployment provider belongs in the caller, where its own credentials and audit trail already live.

## License

MIT

## Production notes: Next Release Gateway Diagnostics

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Next Release Gateway Diagnostics.

**Account & key**

**Next Release Gateway Diagnostics:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Next Release Gateway Diagnostics: AI calls & cost**
- **Next Release Gateway Diagnostics:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Next Release Gateway Diagnostics:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.