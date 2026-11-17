import CharacterLab from "./character/CharacterLab";
import GamesPage from "./site/GamesPage";
import GamePlayPage from "./site/GamePlayPage";
import StudyCafeGame from "./site/StudyCafeGame";
import AngryNerdsGame from "./site/AngryNerdsGame";
import DashboardPage from "./site/DashboardPage";
import SiteApp from "./site/SiteApp";

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/character-lab") return <CharacterLab />;
  if (pathname === "/dashboard" || pathname === "/app") return <DashboardPage />;
  if (pathname === "/games/study-cafe") return <StudyCafeGame />;
  if (pathname === "/games/angry-nerds") return <AngryNerdsGame />;
  if (pathname === "/games") return <GamesPage />;
  if (pathname.startsWith("/games/")) return <GamePlayPage />;
  if (pathname === "/" || pathname === "") return <DashboardPage />;
  return <DashboardPage />;
}
