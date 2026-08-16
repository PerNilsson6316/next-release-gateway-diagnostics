import assert from "node:assert/strict";
import { test } from "node:test";
import { BuildEventSchema, decideRelease } from "../src/release_decision.js";

test("holds a successful build when diagnostics find a blocking issue", () => {
  const build = BuildEventSchema.parse({
    buildId: "build-1842",
    commitSha: "9a31bc4",
    branch: "main",
    framework: "nextjs",
    status: "succeeded",
    logExcerpt: "Compiled successfully, then found an invalid server import in a client component."
  });

  const result = decideRelease(build, {
    severity: "blocking",
    summary: "A client component imports server-only code.",
    nextAction: "Move the import behind a server component boundary."
  });

  assert.equal(result.releaseStatus, "hold");
  assert.equal(result.buildId, "build-1842");
});
