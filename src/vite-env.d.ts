/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_ENV?: "dev" | "prod";
  readonly VITE_APP_ID?: string;
  readonly VITE_PORT?: string;
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
