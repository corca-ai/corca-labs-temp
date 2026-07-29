import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "site");
const apps = JSON.parse(await readFile(path.join(root, "apps.json"), "utf8"));
const run = promisify((command, args, options, callback) => {
  const child = spawn(command, args, { ...options, stdio: "inherit" });
  child.once("error", callback);
  child.once("exit", (code) =>
    code === 0 ? callback(null) : callback(new Error(`${command} exited with ${code}`)),
  );
});
const results = [];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const app of apps) {
  const destination = path.join(output, app.slug);
  try {
    await run("npm", ["run", "check", "--workspace", app.workspace], { cwd: root });
    await run("npm", ["run", "build", "--workspace", app.workspace], { cwd: root });
    await cp(path.join(root, app.source), destination, { recursive: true });
    results.push({ ...app, status: "ready" });
  } catch (error) {
    await mkdir(destination, { recursive: true });
    await writeFile(
      path.join(destination, "index.html"),
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
      <title>${app.title} unavailable</title>
      <style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f3efe7;color:#14231f;font:16px system-ui}main{max-width:520px;padding:32px}h1{font-size:32px}p{line-height:1.6;color:#64736d}</style>
      <main><h1>Temporarily unavailable</h1><p>This app failed its isolated build. Other Corca Labs apps are unaffected.</p><a href="../">Back to Corca Labs</a></main>`,
    );
    results.push({ ...app, status: "failed", error: String(error) });
  }
}

const cards = results
  .map(
    (app) => `<a href="./${app.slug}/">
      <strong>${app.title}</strong>
      <span>${app.description}${app.status === "failed" ? " · temporarily unavailable" : ""}</span>
    </a>`,
  )
  .join("\n");

await writeFile(
  path.join(output, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Corca Labs</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;padding:64px 24px;background:#f3efe7;color:#14231f;font-family:Inter,system-ui,sans-serif}
    main{max-width:960px;margin:auto}h1{font-size:clamp(38px,7vw,76px);letter-spacing:-.06em;margin:0 0 12px}p{color:#64736d;margin:0 0 44px}
    section{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}a{display:grid;gap:10px;padding:24px;border:1px solid #d8d3c8;border-radius:18px;background:#fcfaf4;color:inherit;text-decoration:none;box-shadow:0 10px 30px #19231f12}
    a:hover{border-color:#0a8475;transform:translateY(-2px)}strong{font-size:20px}span{color:#64736d;line-height:1.5}
  </style>
</head>
<body><main><h1>Corca Labs</h1><p>Small tools and experiments.</p><section>${cards}</section></main></body>
</html>`,
);

await writeFile(path.join(output, ".nojekyll"), "");
await writeFile(path.join(output, "build-report.json"), JSON.stringify(results, null, 2));
console.log(
  `Assembled ${results.filter((app) => app.status === "ready").length}/${results.length} healthy app(s) into ${output}`,
);
