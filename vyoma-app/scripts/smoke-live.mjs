const baseUrl = process.env.SMOKE_BASE_URL || "https://vyoma-ai.vercel.app";

const checks = [
  {
    name: "public login",
    url: "/login",
    expected: [200],
  },
  {
    name: "public roadmap",
    url: "/roadmap",
    expected: [200],
  },
  {
    name: "anonymous tracker API blocked",
    url: "/api/tracker",
    expected: [401, 403, 404, 307, 308],
    redirect: "manual",
  },
  {
    name: "anonymous dashboard blocked",
    url: "/dashboard",
    expected: [307, 308, 401, 403, 404],
    redirect: "manual",
  },
];

for (const check of checks) {
  const response = await fetch(new URL(check.url, baseUrl), {
    redirect: check.redirect || "follow",
  });
  if (!check.expected.includes(response.status)) {
    throw new Error(`${check.name} expected ${check.expected.join("/")} got ${response.status}`);
  }
  console.log(`ok ${check.name}: ${response.status}`);
}

console.log("ok Clerk smoke baseline: signed-in checks require a real Clerk test session.");
