import { useState, type FormEvent } from "react";
import { StudyQuestCharacter } from "../character/StudyQuestCharacter";
import { BrandMark } from "./BrandMark";
import { SiteIcon } from "./icons";

interface LandingPageProps {
  reducedMotion: boolean;
}

export function LandingPage({ reducedMotion }: LandingPageProps) {
  return (
    <div className="sq-public-page">
      <header className="sq-public-header sq-container">
        <BrandMark light />
        <nav className="sq-public-nav" aria-label="Main navigation">
          <a className="sq-public-link" href="/login">Log in</a>
          <a className="sq-button sq-button-small sq-button-primary" href="/register">Create account</a>
        </nav>
      </header>

      <main>
        <section className="sq-landing-hero sq-container" aria-labelledby="landing-title">
          <div className="sq-hero-copy">
            <span className="sq-kicker"><SiteIcon name="sparkle" size={15} /> A new way to review</span>
            <h1 id="landing-title">Turn your notes into your next <em>quest.</em></h1>
            <p>Build a practice habit from the materials you already use. StudyQuest is a place to review, test what you remember, and keep moving forward.</p>
            <div className="sq-hero-actions">
              <a className="sq-button sq-button-gold" href="/app">Open demo dashboard <SiteIcon name="arrow" size={17} /></a>
              <a className="sq-button sq-button-quiet" href="/register">Create an account</a>
            </div>
            <p className="sq-preview-note"><SiteIcon name="lock" size={14} /> Preview only. The demo dashboard uses sample data.</p>
          </div>

          <div className="sq-hero-art" aria-label="The StudyQuest student companion">
            <span className="sq-art-spark sq-art-spark-one">✦</span>
            <span className="sq-art-spark sq-art-spark-two">✦</span>
            <span className="sq-art-cloud sq-art-cloud-one" />
            <span className="sq-art-cloud sq-art-cloud-two" />
            <div className="sq-hero-island" aria-hidden="true"><span /><i /></div>
            <div className="sq-hero-character">
              <StudyQuestCharacter
                state="wave"
                size="large"
                interactive={false}
                dialogue="Ready for your next chapter?"
                reducedMotion={reducedMotion}
              />
            </div>
            <span className="sq-art-caption">Your study companion</span>
          </div>
        </section>

        <section className="sq-how-section sq-container" aria-labelledby="how-title">
          <div className="sq-section-heading">
            <span className="sq-kicker">A little more active. A lot more rewarding.</span>
            <h2 id="how-title">Make each study session count.</h2>
          </div>
          <div className="sq-how-grid">
            <article className="sq-how-card"><span className="sq-how-number">01</span><h3>Bring your reviewer</h3><p>Start with the notes, slides, and study guides you already have.</p></article>
            <article className="sq-how-card"><span className="sq-how-number">02</span><h3>Practice what you know</h3><p>Use short questions to find what you remember and what to revisit.</p></article>
            <article className="sq-how-card"><span className="sq-how-number">03</span><h3>Keep your quest going</h3><p>Build a steady rhythm and collect companions along the way.</p></article>
          </div>
        </section>
      </main>

      <footer className="sq-public-footer sq-container">
        <BrandMark compact />
        <span>StudyQuest · A companion for every chapter</span>
        <a href="/character-lab">Character preview</a>
      </footer>
    </div>
  );
}

interface AuthPageProps {
  mode: "login" | "register";
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const [status, setStatus] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("This is a screen preview. Your details were not sent or saved.");
  };

  return (
    <div className="sq-auth-page">
      <header className="sq-auth-header sq-container">
        <BrandMark light />
        <a className="sq-public-link" href="/">Back to home</a>
      </header>
      <main className="sq-auth-layout sq-container">
        <section className="sq-auth-aside">
          <span className="sq-kicker"><SiteIcon name="sparkle" size={15} /> StudyQuest</span>
          <h1>{isRegister ? "Start your next chapter." : "Welcome back to your quest."}</h1>
          <p>{isRegister ? "A focused place to turn your class materials into a little more practice." : "Pick up where your curiosity left off and keep building your study rhythm."}</p>
          <div className="sq-auth-landscape" aria-hidden="true"><span className="sq-auth-star">✦</span><span className="sq-auth-orb" /></div>
        </section>

        <section className="sq-auth-card" aria-labelledby="auth-title">
          <div className="sq-auth-card-heading">
            <span className="sq-kicker">{isRegister ? "Create a student profile" : "Student sign in"}</span>
            <h2 id="auth-title">{isRegister ? "Create your account" : "Log in"}</h2>
            <p>Account access is shown here as a preview. Nothing is submitted.</p>
          </div>
          <form className="sq-auth-form" onSubmit={handleSubmit}>
            {isRegister && <label>Display name<input name="name" autoComplete="name" placeholder="Your name" required /></label>}
            <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
            <label>Password<input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} placeholder="Your password" required /></label>
            <button className="sq-button sq-button-primary sq-auth-submit" type="submit">{isRegister ? "Create account" : "Log in"}<SiteIcon name="arrow" size={17} /></button>
          </form>
          <p className="sq-auth-status" role="status" aria-live="polite">{status || "Preview screen only. No account will be created."}</p>
          <div className="sq-auth-switch">
            {isRegister ? <>Already have an account? <a href="/login">Log in</a></> : <>New to StudyQuest? <a href="/register">Create an account</a></>}
          </div>
          <a className="sq-demo-link" href="/app">Explore the demo dashboard <SiteIcon name="arrow" size={15} /></a>
        </section>
      </main>
    </div>
  );
}
