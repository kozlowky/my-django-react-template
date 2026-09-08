import "@fontsource/hachi-maru-pop/400.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import { ToastProvider } from "@selte/shared-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { refreshSession } from "./lib/api";
import "./index.css";

const preload = document.createElement("link");
preload.rel = "preload";
preload.as = "font";
preload.type = "font/woff2";
preload.href = "/fonts/hachi-maru-pop-latin-400.woff2";
preload.crossOrigin = "anonymous";
document.head.appendChild(preload);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Never retry on auth errors
        if (error?.message?.includes("Authentication required") || error?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

function renderApp() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}

// Restore session from HttpOnly cookie before first render.
// This ensures token is set no matter which URL the user refreshes on.
refreshSession().finally(renderApp);
