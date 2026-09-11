import { createRouter, defineRouter } from "@/utils/router";

const router = createRouter(
  defineRouter({
    HOME: "/",
    TOOLS: "/tools",
    TOOL_SCHEDULE_MAKER: "/tools/schedule-maker",
    UBC_TIMETABLE_MAKER: "/ubc-timetable-maker",
    GUIDE: "/guide",
    FAQ: "/faq",
    CONTACT: "/contact",
    NOT_FOUND: "/404",
  }),
);

const { ROUTES, matchRoute, isActiveRoute, buildPath } = router;

export { ROUTES, matchRoute, isActiveRoute, buildPath };
