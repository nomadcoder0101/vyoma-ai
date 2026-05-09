const baseUrl = process.env.SMOKE_BASE_URL || "https://vyoma-ai.vercel.app";

const checks = [
  {
    name: "public login",
    url: "/login",
    expected: 200,
  },
  {
    name: "public roadmap",
    url: "/roadmap",
    expected: 200,
  },
  {
    name: "anonymous tracker API blocked",
    url: "/api/tracker",
    expected: 401,
  },
  {
    name: "anonymous dashboard redirects",
    url: "/dashboard",
    expected: 307,
    redirect: "manual",
  },
];

for (const check of checks) {
  const response = await fetch(new URL(check.url, baseUrl), {
    redirect: check.redirect || "follow",
  });
  if (response.status !== check.expected) {
    throw new Error(`${check.name} expected ${check.expected}, got ${response.status}`);
  }
  console.log(`ok ${check.name}: ${response.status}`);
}

const sessionResponse = await fetch(new URL("/api/auth/login", baseUrl), {
  method: "POST",
  redirect: "manual",
  headers: {
    "content-type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({
    name: "Samruddhi Chougule",
    email: "samruddhi@example.com",
    next: "/dashboard",
  }),
});

const cookie = sessionResponse.headers.get("set-cookie");
if (!cookie) throw new Error("login did not set a session cookie");

const signedInTracker = await fetch(new URL("/api/tracker", baseUrl), {
  headers: {
    cookie,
  },
});
if (signedInTracker.status !== 200) {
  throw new Error(`signed-in tracker expected 200, got ${signedInTracker.status}`);
}
console.log("ok signed-in tracker API: 200");
