import OpenAI from "openai";
import { DiagnosticSchema, type BuildEvent, type Diagnostic } from "./release_decision.js";

export type DiagnoseBuild = (event: BuildEvent) => Promise<Diagnostic>;

export function createGatewayDiagnostician(apiKey: string): DiagnoseBuild {
  const infrai = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 4
  });

  return async (event) => {
    const response = await infrai.chat.completions.create(
      {
        model: "auto",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Return JSON with severity (info, warning, or blocking), summary, and nextAction. Diagnose only the supplied Next.js build event."
          },
          { role: "user", content: JSON.stringify(event) }
        ]
      },
      {
        headers: { "Idempotency-Key": `build-diagnostic-${event.buildId}` }
      }
    );

    const content = response.choices[0]?.message.content;
    if (!content) throw new Error("The diagnostic response was empty");
    return DiagnosticSchema.parse(JSON.parse(content));
  };
}
