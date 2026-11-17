import { useEffect } from "react";
import { AuthPage, LandingPage } from "./PublicPages";
import StudentApp from "./StudentApp";
import { BrandMark } from "./BrandMark";
import { useReducedMotionPreference } from "./useReducedMotion";
import "./site.css";

const TITLES: Record<string, string> = {
  "/": "StudyQuest · Study. Play. Level up.",
  "/login": "Log in · StudyQuest",
  "/register": "Create an account · StudyQuest",
  "/app": "Dashboard · StudyQuest",
  "/app/library": "Study library · StudyQuest",
  "/app/quiz": "Quizzes · StudyQuest",
  "/app/shop": "Character shop · StudyQuest",
  "/app/inventory": "Inventory · StudyQuest",
  "/app/progress": "Progress · StudyQuest",
  "/app/profile": "Profile · StudyQuest",
  "/app/settings": "Settings · StudyQuest",
};

function NotFoundPage() {
  return (
    <main className="sq-not-found">
      <BrandMark light />
      <span className="sq-not-found-code">404</span>
      <h1>This path isn’t part of the quest.</h1>
      <p>Head back to StudyQuest and choose where you’d like to go.</p>
      <a className="sq-button sq-button-primary" href="/">Back to home</a>
    </main>
  );
}

export default function SiteApp() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const reducedMotion = useReducedMotionPreference();

  useEffect(() => {
    document.title = TITLES[pathname] ?? "StudyQuest";
  }, [pathname]);

  if (pathname === "/") return <LandingPage reducedMotion={reducedMotion} />;
  if (pathname === "/login") return <AuthPage mode="login" />;
  if (pathname === "/register") return <AuthPage mode="register" />;
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return <StudentApp pathname={pathname} reducedMotion={reducedMotion} />;
  }
  return <NotFoundPage />;
}
