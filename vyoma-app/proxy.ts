import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login",
  "/roadmap",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isLocalE2eRequest(request)) return;
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

function isLocalE2eRequest(request: Request) {
  return (
    process.env.E2E_TEST_MODE === "true" &&
    Boolean(process.env.E2E_TEST_TOKEN) &&
    request.headers.get("x-vyoma-e2e-token") === process.env.E2E_TEST_TOKEN
  );
}
