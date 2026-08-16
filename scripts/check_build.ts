const response = await fetch("http://localhost:3000/release-diagnostics", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    buildId: "build-1842",
    commitSha: "9a31bc4",
    branch: "main",
    framework: "nextjs",
    status: "succeeded",
    logExcerpt: "Compiled successfully. Lint and type checks passed."
  })
});

if (!response.ok) throw new Error(`Request failed with HTTP ${response.status}`);
console.log(await response.json());

export {};
