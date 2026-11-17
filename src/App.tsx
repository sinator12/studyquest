import CharacterLab from "./character/CharacterLab";
import GamesPage from "./site/GamesPage";
import GamePlayPage from "./site/GamePlayPage";
import StudyCafeGame from "./site/StudyCafeGame";
import AngryNerdsGame from "./site/AngryNerdsGame";
import BingoNightGame from "./site/BingoNightGame";
import DashboardPage from "./site/DashboardPage";
import StudyPlanPage from "./site/StudyPlanPage";
import ExplainPage from "./site/ExplainPage";
import LoginPage from "./site/LoginPage";
import SiteApp from "./site/SiteApp";

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/character-lab") return <CharacterLab />;
  if (pathname === "/login") return <LoginPage />;
  if (pathname === "/dashboard" || pathname === "/app") return <DashboardPage />;
  if (pathname === "/study-plan" || pathname === "/studyplan") return <StudyPlanPage />;
  if (pathname === "/explain") return <ExplainPage />;
  if (pathname === "/games/bingo-night") return <BingoNightGame />;
  if (pathname === "/games/study-cafe") return <StudyCafeGame />;
  if (pathname === "/games/angry-nerds") return <AngryNerdsGame />;
  if (pathname === "/games") return <GamesPage />;
  if (pathname.startsWith("/games/")) {
    window.location.href = "/games";
    return <GamesPage />;
  }
  if (pathname === "/" || pathname === "") return <DashboardPage />;
  return <DashboardPage />;
}
