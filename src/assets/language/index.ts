import frPlanner from "./fr/pages/Planner.json";
import zhPlanner from "./zh/pages/Planner.json";
import enPlanner from "./en/pages/Planner.json";
import enLanguage from "./en/language.json";
import enAbout from "./en/pages/About.json";
import enApp from "./en/pages/App.json";
import enFAQ from "./en/pages/FAQ.json";
import enGuide from "./en/pages/Guide.json";
import enHome from "./en/pages/Home.json";
import enTools from "./en/pages/Tools.json";
import enUbc from "./en/pages/Ubc.json";
import frLanguage from "./fr/language.json";
import frAbout from "./fr/pages/About.json";
import frApp from "./fr/pages/App.json";
import frFAQ from "./fr/pages/FAQ.json";
import frGuide from "./fr/pages/Guide.json";
import frHome from "./fr/pages/Home.json";
import frTools from "./fr/pages/Tools.json";
import frUbc from "./fr/pages/Ubc.json";
import zhLanguage from "./zh/language.json";
import zhAbout from "./zh/pages/About.json";
import zhApp from "./zh/pages/App.json";
import zhFAQ from "./zh/pages/FAQ.json";
import zhGuide from "./zh/pages/Guide.json";
import zhHome from "./zh/pages/Home.json";
import zhTools from "./zh/pages/Tools.json";
import zhUbc from "./zh/pages/Ubc.json";

export const LANG_NS = "language" as const;

export const PAGE = {
  Home: "pages.Home",
  Planner: "pages.Planner",
  Ubc: "pages.Ubc",
  App: "pages.App",
  Tools: "pages.Tools",
  Guide: "pages.Guide",
  About: "pages.About",
  FAQ: "pages.FAQ",
} as const;

export const NAMESPACES = ["language", ...Object.values(PAGE)] as const;

export const RESOURCES = {
  en: {
    language: enLanguage,
    [PAGE.Home]: enHome,
    [PAGE.Ubc]: enUbc,
    [PAGE.App]: enApp,
    [PAGE.Tools]: enTools,
    [PAGE.Planner]: enPlanner,
    [PAGE.Guide]: enGuide,
    [PAGE.About]: enAbout,
    [PAGE.FAQ]: enFAQ,
  },
  zh: {
    language: zhLanguage,
    [PAGE.Home]: zhHome,
    [PAGE.Ubc]: zhUbc,
    [PAGE.App]: zhApp,
    [PAGE.Tools]: zhTools,
    [PAGE.Planner]: zhPlanner,
    [PAGE.Guide]: zhGuide,
    [PAGE.About]: zhAbout,
    [PAGE.FAQ]: zhFAQ,
  },
  fr: {
    language: frLanguage,
    [PAGE.Home]: frHome,
    [PAGE.Ubc]: frUbc,
    [PAGE.App]: frApp,
    [PAGE.Tools]: frTools,
    [PAGE.Planner]: frPlanner,
    [PAGE.Guide]: frGuide,
    [PAGE.About]: frAbout,
    [PAGE.FAQ]: frFAQ,
  },
} as const;
