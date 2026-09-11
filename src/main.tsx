import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider, ModalProvider, RouterProvider, ThemeProvider } from "@/providers";

import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TooltipProvider>
            <RouterProvider>
              <ModalProvider>
                <App />
                <Toaster />
              </ModalProvider>
            </RouterProvider>
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </HelmetProvider>
  </StrictMode>,
);
