import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import LanguageProvider from "@/providers/LanguageProvider";
import RouterProvider from "@/providers/RouterProvider";
import ThemeProvider from "@/providers/ThemeProvider";

import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <RouterProvider>
                <App />
                <Toaster />
            </RouterProvider>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </HelmetProvider>
  </StrictMode>,
);
