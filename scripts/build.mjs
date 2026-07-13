import { spawnSync } from "node:child_process";

function run(command, { allowRetry = false } = {}) {
  const maxAttempts = allowRetry ? 3 : 1;
  let lastResult;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    console.log(`\n> ${command}${maxAttempts > 1 ? ` (attempt ${attempt}/${maxAttempts})` : ""}`);
    lastResult = spawnSync(command, {
      shell: true,
      stdio: "inherit",
      env: process.env
    });

    if (lastResult.status === 0) return;
    if (attempt < maxAttempts) {
      console.log("Command failed. Waiting before retry...");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 8000);
    }
  }

  process.exit(lastResult?.status || 1);
}

run("prisma migrate deploy", { allowRetry: true });
run("prisma generate");
run("next build");
