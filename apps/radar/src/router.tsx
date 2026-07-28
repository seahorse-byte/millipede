import { createRootRoute, createRoute, createRouter } from "@tanstack/solid-router";
import { RootLayout } from "./RootLayout";
import { Dashboard } from "./pages/Dashboard";
import { OneOnOnePortal } from "./pages/OneOnOnePortal";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const oneOnOneRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/1on1",
  component: OneOnOnePortal,
});

const routeTree = rootRoute.addChildren([dashboardRoute, oneOnOneRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}
