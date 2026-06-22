import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Bell, Command, Sparkles, Moon, Sun } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { loadBackendData, useTheme } from "../lib/store";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/command-palette";
import { OneShotOrderDialog } from "@/components/one-shot-order";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Please try again."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-semibold text-primary">404</p>
      <p className="mt-2 text-sm text-muted-foreground">This module is not on the route map.</p>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Honey Enterprises ERP" },
      { name: "description", content: "Stone crusher, aggregate trading and transport ERP for Honey Enterprises." },
      { name: "theme-color", content: "#0f172a" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Honey ERP" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "Honey Enterprises ERP" },
      { name: "twitter:title", content: "Honey Enterprises ERP" },
      { property: "og:description", content: "Stone crusher, aggregate trading and transport ERP for Honey Enterprises." },
      { name: "twitter:description", content: "Stone crusher, aggregate trading and transport ERP for Honey Enterprises." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3948ac91-0ca4-4ca1-9b03-9a00f1f7101b/id-preview-ec519bab--ba14a1a2-2524-45d2-be8c-aaeaeb3d1806.lovable.app-1780409184473.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3948ac91-0ca4-4ca1-9b03-9a00f1f7101b/id-preview-ec519bab--ba14a1a2-2524-45d2-be8c-aaeaeb3d1806.lovable.app-1780409184473.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", href: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <html lang="en" className={theme === "dark" ? "dark" : ""}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [oneShot, setOneShot] = useState(false);
  const { theme, toggleTheme, setTheme } = useTheme();

  useEffect(() => {
    loadBackendData().catch((error) => {
      console.warn("Unable to load backend ERP data:", error);
    });
  }, []);

  useEffect(() => {
    // Initialize theme on mount
    setTheme(theme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                className="hidden h-9 max-w-md flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 text-left text-xs text-muted-foreground transition hover:border-primary/50 md:flex"
              >
                <Command className="h-3.5 w-3.5" />
                <span>Quick search & jump…</span>
                <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
              </button>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => setOneShot(true)}>
                  <Sparkles className="mr-1 h-3.5 w-3.5" />One-Shot
                </Button>
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                  title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    HE
                  </div>
                  <div className="hidden text-left leading-tight sm:block">
                    <p className="text-xs font-medium text-foreground">Owner</p>
                    <p className="text-[10px] text-muted-foreground">Honey Enterprises</p>
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
        </div>
        <CommandPalette onCreate={() => setOneShot(true)} />
        <OneShotOrderDialog open={oneShot} onOpenChange={setOneShot} />
        <Toaster richColors position="top-right" />
      </SidebarProvider>
    </QueryClientProvider>
  );
}
