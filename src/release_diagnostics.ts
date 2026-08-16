import { createServer, type ServerResponse } from "node:http";
import { ZodError } from "zod";
import { createGatewayDiagnostician, type DiagnoseBuild } from "./gateway_diagnostician.js";
import { BuildEventSchema, decideRelease } from "./release_decision.js";

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readJson(request: AsyncIterable<Uint8Array>): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createReleaseServer(diagnose: DiagnoseBuild) {
  return createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/release-diagnostics") {
      sendJson(response, 404, { error: "Route not found" });
      return;
    }

    try {
      const build = BuildEventSchema.parse(await readJson(request));
      const diagnostic = await diagnose(build);
      sendJson(response, 200, decideRelease(build, diagnostic));
    } catch (error) {
      if (error instanceof ZodError || error instanceof SyntaxError) {
        sendJson(response, 400, { error: "Invalid build event" });
        return;
      }
      const message = error instanceof Error ? error.message : "Diagnostic request failed";
      sendJson(response, 502, { error: message });
    }
  });
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the service");
  const port = Number(process.env.PORT ?? 3000);
  createReleaseServer(createGatewayDiagnostician(apiKey)).listen(port, () => {
    console.log(`Release diagnostics listening on http://localhost:${port}`);
  });
}
