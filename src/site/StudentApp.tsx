import type { CSSProperties } from "react";
import { StudyQuestCharacter } from "../character/StudyQuestCharacter";
import { BrandMark } from "./BrandMark";
import { DEMO_ACTIVITY, DEMO_ACCURACY, DEMO_METRICS, DEMO_PROFILE } from "./demoData";
import { SiteIcon, type SiteIconName } from "./icons";

interface StudentAppProps {
  pathname: string;
  reducedMotion: boolean;
}

const navigation: Array<{ href: string; label: string; icon: SiteIconName }> = [
  { href: "/app", label: "Dashboard", icon: "dashboard" },
  { href: "/app/library", label: "Study library", icon: "library" },
  { href: "/app/quiz", label: "Quizzes", icon: "quiz" },
  { href: "/app/shop", label: "Character shop", icon: "shop" },
  { href: "/app/inventory", label: "Inventory", icon: "inventory" },
  { href: "/app/progress", label: "Progress", icon: "progress" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

const placeholders: Record<string, { title: string; description: string; icon: SiteIconName; next: string; href: string }> = {
  "/app/library": {
    title: "Study library",
    description: "Your study materials will live here. Uploading and processing are not connected in this preview.",
    icon: "library",
    next: "See the dashboard",
    href: "/app",
  },
  "/app/quiz": {
    title: "Quizzes",
    description: "Practice sessions will appear here. Quiz generation, answers, and scoring are not connected yet.",
    icon: "quiz",
    next: "Back to the dashboard",
    href: "/app",
  },
  "/app/shop": {
    title: "Character shop",
    description: "This is where you will discover companions. The catalog and purchases are not active in this preview.",
    icon: "shop",
    next: "View your collection preview",
    href: "/app/inventory",
  },
  "/app/inventory": {
    title: "Inventory",
    description: "Characters you collect will be kept here. Collection and equipment data are not connected.",
    icon: "inventory",
    next: "Visit the character shop preview",
    href: "/app/shop",
  },
  "/app/progress": {
    title: "Progress",
    description: "Your study history and learning progress will appear here once account data is available.",
    icon: "progress",
    next: "Back to the dashboard",
    href: "/app",
  },
  "/app/profile": {
    title: "Profile",
    description: "Profile details are shown as a layout preview. Account information is not saved.",
    icon: "profile",
    next: "Back to the dashboard",
    href: "/app",
  },
  "/app/settings": {
    title: "Settings",
    description: "This preview shows where your preferences will live. Changes are not saved to an account.",
    icon: "settings",
    next: "Back to the dashboard",
    href: "/app",
  },
};

function PageHeading({ title }: { title: string }) {
  return (
    <div className="sq-page-heading">
      <div>
        <p className="sq-kicker">Your study space</p>
        <h1>{title}</h1>
      </div>
      <span className="sq-demo-chip"><i /> Sample workspace</span>
    </div>
  );
}

function StudentNavigation({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return (
    <nav className={mobile ? "sq-mobile-nav" : "sq-sidebar-nav"} aria-label="Student navigation">
      {navigation.map((item) => {
        const active = pathname === item.href || (item.href !== "/app" && pathname.startsWith(`${item.href}/`));
        return (
          <a key={item.href} href={item.href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
            <SiteIcon name={item.icon} size={19} /><span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

function DemoCharacter({ state, size = "medium", reducedMotion }: { state: "idle" | "wave"; size?: "small" | "medium" | "large"; reducedMotion: boolean }) {
  return (
    <div className={`sq-character-frame is-${size}`}>
      <div className="sq-mini-island" aria-hidden="true"><span /></div>
      <StudyQuestCharacter state={state} size={size} interactive={false} reducedMotion={reducedMotion} />
    </div>
  );
}

function Dashboard({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <section className="sq-welcome-card" aria-labelledby="welcome-title">
        <div className="sq-welcome-copy">
          <span className="sq-demo-label">{DEMO_PROFILE.label}</span>
          <h2 id="welcome-title">Welcome back, {DEMO_PROFILE.name}!</h2>
          <p>Every small study session moves your quest forward. Pick a topic and keep going at your own pace.</p>
          <a className="sq-button sq-button-gold" href="/app/quiz">Start a demo quiz <SiteIcon name="arrow" size={17} /></a>
        </div>
        <div className="sq-welcome-scene" aria-label="StudyQuest companion in the supplied student design">
          <span className="sq-scene-star sq-scene-star-one">✦</span>
          <span className="sq-scene-star sq-scene-star-two">✦</span>
          <span className="sq-scene-cloud" />
          <div className="sq-welcome-island" aria-hidden="true"><i /></div>
          <div className="sq-welcome-sprite">
            <StudyQuestCharacter state="wave" size="medium" interactive={false} reducedMotion={reducedMotion} />
          </div>
        </div>
      </section>

      <div className="sq-dashboard-grid">
        <section className="sq-panel sq-progress-panel" aria-labelledby="progress-title">
          <div className="sq-panel-heading"><div><span className="sq-kicker">Sample snapshot</span><h2 id="progress-title">Your progress</h2></div><SiteIcon name="progress" size={21} /></div>
          <div className="sq-progress-content">
            <div className="sq-progress-ring" style={{ "--progress": `${DEMO_ACCURACY}%` } as CSSProperties} aria-label={`${DEMO_ACCURACY}% sample accuracy`}><span>{DEMO_ACCURACY}<small>%</small></span></div>
            <div className="sq-metric-list">
              {DEMO_METRICS.map((metric) => <div className="sq-metric-row" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
            </div>
          </div>
          <p className="sq-card-footnote">Example numbers for layout review. No student activity is stored.</p>
        </section>

        <section className="sq-panel sq-companion-panel" aria-labelledby="companion-title">
          <div className="sq-panel-heading"><div><span className="sq-kicker">From the supplied art</span><h2 id="companion-title">Your companion</h2></div><span className="sq-status-pill">Preview</span></div>
          <DemoCharacter state="idle" reducedMotion={reducedMotion} />
          <p className="sq-companion-note">The same StudyQuest student appears across the site.</p>
        </section>

        <section className="sq-panel sq-quick-panel" aria-labelledby="quick-title">
          <div className="sq-panel-heading"><div><span className="sq-kicker">Pick up where you like</span><h2 id="quick-title">Quick actions</h2></div></div>
          <a className="sq-action-link" href="/app/library"><span className="sq-action-icon is-purple"><SiteIcon name="library" /></span><span><strong>Open study library</strong><small>Preview saved materials</small></span><SiteIcon name="arrow" size={17} /></a>
          <a className="sq-action-link" href="/app/shop"><span className="sq-action-icon is-gold"><SiteIcon name="shop" /></span><span><strong>Visit character shop</strong><small>Preview the collection page</small></span><SiteIcon name="arrow" size={17} /></a>
        </section>

        <section className="sq-panel sq-activity-panel" aria-labelledby="activity-title">
          <div className="sq-panel-heading"><div><span className="sq-kicker">Example entries</span><h2 id="activity-title">Recent activity</h2></div><a href="/app/progress">View all</a></div>
          <div className="sq-activity-list">
            {DEMO_ACTIVITY.map((item) => <article className="sq-activity-row" key={item.title}><span className="sq-activity-icon"><SiteIcon name="book" size={17} /></span><div><strong>{item.title}</strong><small>{item.detail}</small></div><span className="sq-activity-date">{item.date}</span></article>)}
          </div>
        </section>
      </div>

      <section className="sq-state-previews" aria-labelledby="state-preview-title">
        <div className="sq-state-preview-heading"><div><span className="sq-kicker">Interface examples</span><h2 id="state-preview-title">Helpful states for each step</h2></div><span>Examples only</span></div>
        <div className="sq-state-preview-grid">
          <article className="sq-state-example">
            <span className="sq-state-tag">Empty state preview</span>
            <h3>Your library is ready for its first reviewer.</h3>
            <p>A clear next step helps students get started.</p>
            <a href="/app/library">View library preview <SiteIcon name="arrow" size={15} /></a>
          </article>
          <article className="sq-state-example sq-loading-example" aria-label="Loading state example">
            <span className="sq-state-tag">Loading state preview</span>
            <div className="sq-skeleton-title" aria-hidden="true" />
            <div className="sq-skeleton-line" aria-hidden="true" />
            <div className="sq-skeleton-line is-short" aria-hidden="true" />
            <span className="sq-sr-only">Static example of a loading card.</span>
          </article>
        </div>
      </section>
    </>
  );
}

function PlaceholderPage({ page }: { page: (typeof placeholders)[string] }) {
  return (
    <section className="sq-placeholder-card">
      <div className="sq-placeholder-icon"><SiteIcon name={page.icon} size={31} /></div>
      <span className="sq-kicker">Page preview</span>
      <h2>{page.title}</h2>
      <p>{page.description}</p>
      <a className="sq-button sq-button-primary" href={page.href}>{page.next}<SiteIcon name="arrow" size={17} /></a>
      <div className="sq-placeholder-lines" aria-hidden="true"><i /><i /><i /></div>
    </section>
  );
}

export default function StudentApp({ pathname, reducedMotion }: StudentAppProps) {
  const dashboard = pathname === "/app" || pathname === "/app/";
  const profilePage = pathname === "/app/profile";
  const page = placeholders[pathname];
  const title = dashboard ? "Dashboard" : page?.title ?? "Page not found";

  return (
    <div className="sq-student-layout">
      <aside className="sq-sidebar">
        <BrandMark href="/app" />
        <div className="sq-sidebar-label">Study space</div>
        <StudentNavigation pathname={pathname} />
        <div className="sq-sidebar-bottom">
          <a className={`sq-sidebar-profile${profilePage ? " is-active" : ""}`} href="/app/profile" aria-current={profilePage ? "page" : undefined}>
            <span className="sq-avatar">A</span><span><strong>{DEMO_PROFILE.name}</strong><small>Sample profile</small></span><SiteIcon name="profile" size={17} />
          </a>
          <a className="sq-exit-link" href="/">Exit preview</a>
        </div>
      </aside>

      <div className="sq-student-main">
        <header className="sq-app-header">
          <div className="sq-mobile-brand"><BrandMark href="/app" compact /></div>
          <div className="sq-app-header-context"><span>StudyQuest</span><strong>{title}</strong></div>
          <div className="sq-app-header-actions">
            <span className="sq-coin-chip"><span>✦</span>{DEMO_PROFILE.coinBalance}<small>sample</small></span>
            <a className="sq-header-avatar" href="/app/profile" aria-label="Open sample profile">A</a>
          </div>
        </header>
        <div className="sq-mobile-nav-wrap"><StudentNavigation pathname={pathname} mobile /></div>

        <main className="sq-student-content">
          <PageHeading title={title} />
          {dashboard ? <Dashboard reducedMotion={reducedMotion} /> : page ? <PlaceholderPage page={page} /> : <section className="sq-placeholder-card"><h2>That page isn't here.</h2><p>Choose a page from the student navigation.</p><a className="sq-button sq-button-primary" href="/app">Go to dashboard<SiteIcon name="arrow" size={17} /></a></section>}
        </main>
      </div>
    </div>
  );
}
