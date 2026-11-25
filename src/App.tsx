import { useState, useEffect } from "react";
import CharacterLab from "./character/CharacterLab";
import GamesPage from "./site/GamesPage";
import GamePlayPage from "./site/GamePlayPage";
import StudyCafeGame from "./site/StudyCafeGame";
import BingoNightGame from "./site/BingoNightGame";
import DashboardPage from "./site/DashboardPage";
import StudyPlanPage from "./site/StudyPlanPage";
import ExplainPage from "./site/ExplainPage";
import LoginPage from "./site/LoginPage";
import SiteApp from "./site/SiteApp";
import AuthGate from "./site/AuthGate";
import { initSupabaseAuth } from "./site/supabaseClient";
import { restoreProgressFromCloud } from "./site/progressSync";

/**
 * Programmatic client-side navigation helper.
 * Call this anywhere to navigate without full page reload.
 */
export function navigateTo(to: string) {
  const normalized = to.replace(/\/+$/, "") || "/";
  if (window.location.pathname === normalized) return;
  window.history.pushState({}, "", normalized);
  window.dispatchEvent(new CustomEvent("sq_navigate", { detail: normalized }));
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname.replace(/\/+$/, "") || "/");

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname.replace(/\/+$/, "") || "/");
    };

    const handleCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setPathname(customEvent.detail || window.location.pathname.replace(/\/+$/, "") || "/");
    };

    // Global link interceptor: intercepts clicks on internal <a href="/..."> tags
    // so navigating between Dashboard, Games, Plan, Explain, etc. NEVER triggers a full page reload!
    const handleGlobalClick = (e: MouseEvent) => {
      // Allow user to use middle-click or Ctrl/Cmd-click to open in new tab
      if (e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey || e.defaultPrevented) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external URLs, mailto, tel, anchor hashes, or target="_blank"
      if (
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      // Seamless client-side transition
      e.preventDefault();
      const targetPath = href.replace(/\/+$/, "") || "/";
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, "", targetPath);
        setPathname(targetPath);
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("sq_navigate", handleCustomNavigate);
    document.addEventListener("click", handleGlobalClick);

    // Initialize Supabase Auth listener to restore Google OAuth user & sync cloud progress
    const unsubSupabase = initSupabaseAuth((user) => {
      restoreProgressFromCloud(user.id);
    });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("sq_navigate", handleCustomNavigate);
      document.removeEventListener("click", handleGlobalClick);
      unsubSupabase();
    };
  }, []);

  const renderContent = () => {
    if (pathname === "/character-lab") return <CharacterLab />;
    if (pathname === "/login") return <LoginPage />;
    if (pathname === "/dashboard" || pathname === "/app") return <DashboardPage />;
    if (pathname === "/study-plan" || pathname === "/studyplan") return <StudyPlanPage />;
    if (pathname === "/explain") return <ExplainPage />;
    if (pathname === "/games/bingo-night") return <BingoNightGame />;
    if (pathname === "/games/study-cafe") return <StudyCafeGame />;
    if (pathname === "/games") return <GamesPage />;
    if (pathname.startsWith("/games/")) return <GamesPage />;
    if (pathname === "/" || pathname === "") return <DashboardPage />;
    return <DashboardPage />;
  };

  return (
    <AuthGate>
      <div key={pathname} className="sq-page-transition">
        {renderContent()}
      </div>
    </AuthGate>
  );
}
