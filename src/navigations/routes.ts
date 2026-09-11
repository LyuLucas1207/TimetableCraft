import { createRouter, defineRouter } from "@/utils/router";

const router = createRouter(
  defineRouter({
    HOME: "/",
    TOOLS: "/tools",
    TOOL_SCHEDULE_MAKER: "/tools/schedule-maker",
    GUIDE: "/guide",
    FAQ: "/faq",
    CONTACT: "/contact",
  }),
);

const { ROUTES, matchRoute, isActiveRoute, buildPath } = router;

export { ROUTES, matchRoute, isActiveRoute, buildPath };
