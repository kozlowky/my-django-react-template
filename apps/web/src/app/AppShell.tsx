import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@selte/shared-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  VideoReplayIcon,
  Notification01Icon,
  SendIcon,
  Search01Icon,
  PlusSignIcon,
  ImageUploadIcon,
  Camera01Icon,
  UserIcon,
  Setting07Icon,
} from "@hugeicons/core-free-icons";
import { getAccessToken } from "../lib/auth";
import { fetchMe } from "../lib/api";
import { mediaUrl } from "../lib/storage";
import { AuthSheet } from "../screens/auth/AuthSheet";

type IconType = typeof Home01Icon;

const tabs: {
  to: string;
  icon: IconType;
  label: string;
  requireAuth?: boolean;
}[] = [
  { to: "/feed", icon: Home01Icon, label: "Лента" },
  { to: "/reels", icon: VideoReplayIcon, label: "Видео" },
  { to: "/messenger", icon: SendIcon, label: "Сообщения", requireAuth: true },
  {
    to: "/activity",
    icon: Notification01Icon,
    label: "Уведомления",
    requireAuth: true,
  },
];

const CREATE_OPTIONS: { type: string; label: string; icon: IconType }[] = [
  { type: "post", label: "Пост", icon: ImageUploadIcon },
  { type: "story", label: "История", icon: Camera01Icon },
  { type: "reel", label: "Reels", icon: VideoReplayIcon },
];

interface NavLinksProps {
  isDesktop: boolean;
  onTabClick?: (tab: (typeof tabs)[number], e: React.MouseEvent) => void;
}

function NavLinks({ isDesktop, onTabClick }: NavLinksProps) {
  return (
    <div
      className={cn(
        "flex",
        isDesktop ? "flex-col gap-2" : "items-center gap-2",
      )}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          onClick={(e) => !isDesktop && onTabClick?.(tab, e)}
          className={({ isActive }) =>
            cn(
              "relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
              isActive
                ? "bg-cream text-charcoal font-medium shadow-sm"
                : "text-charcoal-muted hover:text-charcoal hover:bg-cream/50",
              isDesktop
                ? "w-full justify-start"
                : "justify-center rounded-full px-4 py-2.5",
            )
          }
        >
          {({ isActive }) => (
            <>
              <HugeiconsIcon
                icon={tab.icon}
                size={22}
                color="currentColor"
                strokeWidth={isActive ? 2 : 1.5}
              />
              {isDesktop && <span className="text-sm">{tab.label}</span>}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfile = location.pathname.startsWith("/profile");
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const pendingPath = useRef<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const isAuth = Boolean(getAccessToken());
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: isAuth,
    staleTime: Infinity,
  });
  const avatar = mediaUrl(me?.avatarUrl);
  const profileName = me?.displayName || me?.email?.split("@")[0] || "";

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    const raf = requestAnimationFrame(() => setVisible(false));
    return () => cancelAnimationFrame(raf);
  }, [menuOpen]);

  function handleTabClick(tab: (typeof tabs)[number], e: React.MouseEvent) {
    setMenuOpen(false);
    if (tab.requireAuth && !getAccessToken()) {
      e.preventDefault();
      pendingPath.current = tab.to;
      setAuthOpen(true);
    }
  }

  function handleProfileClick() {
    setMenuOpen(false);
    if (!getAccessToken()) {
      pendingPath.current = "/profile";
      setAuthOpen(true);
    } else {
      navigate("/profile");
    }
  }

  function handleAuthSuccess(isNewUser: boolean) {
    setAuthOpen(false);
    if (isNewUser) {
      navigate("/onboarding/profile");
    } else {
      navigate(pendingPath.current ?? "/feed");
    }
    pendingPath.current = null;
  }

  function handleSelect(type: string) {
    setMenuOpen(false);
    navigate(`/create?type=${type}`);
  }

  return (
    <div className="flex min-h-screen bg-sand">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 md:border-r md:border-border md:bg-cream md:px-4 md:py-6">
        <div className="mb-8 px-2">
          <span className="font-logo text-3xl tracking-tight text-charcoal">
            selte
          </span>
        </div>

        <nav className="flex-1">
          <NavLinks isDesktop={true} />
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => navigate("/search")}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-charcoal-muted transition-colors hover:bg-cream/50 hover:text-charcoal"
          >
            <HugeiconsIcon
              icon={Search01Icon}
              size={22}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span className="text-sm">Поиск</span>
          </button>

          <button
            type="button"
            onClick={handleProfileClick}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-charcoal-muted transition-colors hover:bg-cream/50 hover:text-charcoal"
          >
            <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded-full bg-sand ring-1 ring-border">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Профиль"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <HugeiconsIcon
                    icon={UserIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </div>
            <span className="text-sm truncate">{profileName || "Профиль"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 md:mx-auto md:max-w-2xl md:border-x md:border-border md:bg-cream min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-cream/80 px-5 pb-2 pt-4 backdrop-blur-md">
          {isProfile ? (
            <span className="font-heading text-xl font-bold text-charcoal">
              {profileName}
            </span>
          ) : (
            <span className="font-logo text-3xl tracking-tight text-charcoal">
              selte
            </span>
          )}
          {isProfile ? (
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition-opacity hover:opacity-70"
              aria-label="Настройки"
            >
              <HugeiconsIcon
                icon={Setting07Icon}
                size={22}
                color="currentColor"
                strokeWidth={1.5}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProfileClick}
              className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-sand ring-1 ring-border transition-opacity hover:opacity-80"
              aria-label="Профиль"
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="Профиль"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-charcoal">
                  <HugeiconsIcon
                    icon={UserIcon}
                    size={18}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </button>
          )}
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          ref={navRef}
          className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-3"
        >
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2",
              "rounded-full",
              "bg-cream/75 backdrop-blur-xl backdrop-saturate-150",
              "border border-cream/40",
              "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
              "ring-1 ring-inset ring-cream/60",
            )}
          >
            <NavLinks isDesktop={false} onTabClick={handleTabClick} />
          </div>

          <div className="relative flex-shrink-0">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2">
              <div className="relative">
                {menuOpen && (
                  <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-3 flex flex-col-reverse items-end gap-3">
                    {CREATE_OPTIONS.map((opt, i) => (
                      <div
                        key={opt.type}
                        className={cn(
                          "flex items-center gap-2 transition-all duration-300 ease-out",
                          visible
                            ? "translate-y-0 opacity-100"
                            : "translate-y-4 opacity-0",
                        )}
                        style={{ transitionDelay: `${i * 40}ms` }}
                      >
                        <span className="rounded-full bg-cream/90 px-3 py-1 text-xs font-medium text-charcoal shadow-sm backdrop-blur-xl">
                          {opt.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelect(opt.type)}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-cream text-charcoal shadow-[0_8px_24px_rgba(0,0,0,0.15)]"
                        >
                          <HugeiconsIcon
                            icon={opt.icon}
                            size={20}
                            color="currentColor"
                            strokeWidth={1.5}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className={cn(
                    "flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-full bg-terracotta text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-200",
                    menuOpen && "rotate-45",
                  )}
                >
                  <HugeiconsIcon
                    icon={PlusSignIcon}
                    size={24}
                    color="currentColor"
                    strokeWidth={2}
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/search")}
              className={cn(
                "flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-full",
                "bg-cream/75 backdrop-blur-xl backdrop-saturate-150",
                "border border-cream/40",
                "shadow-[0_8px_24px_rgba(0,0,0,0.15)]",
                "text-charcoal transition-colors hover:text-charcoal-muted",
              )}
              aria-label="Поиск"
            >
              <HugeiconsIcon
                icon={Search01Icon}
                size={22}
                color="currentColor"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </nav>
      </div>

      <AuthSheet
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          pendingPath.current = null;
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
