import { z } from "zod";

export const BuildEventSchema = z.object({
  buildId: z.string().min(1),
  commitSha: z.string().regex(/^[a-f0-9]{7,40}$/),
  branch: z.string().min(1),
  framework: z.literal("nextjs"),
  status: z.enum(["succeeded", "failed"]),
  logExcerpt: z.string().min(1).max(8_000)
});

export type BuildEvent = z.infer<typeof BuildEventSchema>;

export const DiagnosticSchema = z.object({
  severity: z.enum(["info", "warning", "blocking"]),
  summary: z.string().min(1),
  nextAction: z.string().min(1)
});

export type Diagnostic = z.infer<typeof DiagnosticSchema>;
export type ReleaseDecision = {
  buildId: string;
  releaseStatus: "release" | "hold";
  diagnostic: Diagnostic;
};

export function decideRelease(build: BuildEvent, diagnostic: Diagnostic): ReleaseDecision {
  const releaseStatus = build.status === "succeeded" && diagnostic.severity !== "blocking"
    ? "release"
    : "hold";

  return { buildId: build.buildId, releaseStatus, diagnostic };
}
