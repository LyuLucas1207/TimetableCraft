type RouteMap = Record<string, string>;

export function defineRouter<T extends RouteMap>(routes: T): T {
  return routes;
}

export function createRouter<T extends RouteMap>(routes: T) {
  const matchRoute = (pathname: string, route: string) => pathname === route;
  const isActiveRoute = (pathname: string, route: string) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  };
  const buildPath = (route: string) => route;
  return { ROUTES: routes, matchRoute, isActiveRoute, buildPath };
}
