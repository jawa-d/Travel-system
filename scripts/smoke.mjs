const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const paths = ["/", "/policies", "/policies/demo-policy-1", "/reports", "/profile", "/verify", "/api/search?q=demo"];
let failed = false;

for (const path of paths) {
  try {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
    const okay = response.status < 500;
    console.log(`${okay ? "PASS" : "FAIL"} ${path} (${response.status})`);
    if (!okay) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${path}: ${error instanceof Error ? error.message : error}`);
  }
}

if (failed) process.exit(1);
