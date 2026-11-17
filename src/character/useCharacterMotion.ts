import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { RefObject } from "react";
import type { CharacterState } from "./types";

gsap.registerPlugin(useGSAP);

type MotionRecipe = (timeline: gsap.core.Timeline, character: HTMLElement) => void;

const motionRecipes: Record<CharacterState, MotionRecipe> = {
  idle: (timeline, character) => {
    timeline
      .to(character, { y: -4, duration: 1.35, ease: "sine.inOut" })
      .to(character, { y: 0, duration: 1.35, ease: "sine.inOut" });
  },
  wave: (timeline, character) => {
    timeline
      .to(character, { y: -5, rotation: -3.5, duration: 0.24, ease: "power1.out" })
      .to(character, { y: -1, rotation: 3.5, duration: 0.34, ease: "sine.inOut" })
      .to(character, { y: 0, rotation: 0, duration: 0.28, ease: "power2.out" })
      .to(character, { duration: 0.7 });
  },
  running: (timeline, character) => {
    timeline
      .to(character, { y: -6, rotation: 2, duration: 0.2, ease: "power1.inOut" })
      .to(character, { y: 0, rotation: -2, duration: 0.2, ease: "power1.inOut" });
  },
  thinking: (timeline, character) => {
    timeline
      .to(character, { y: -3, rotation: 1, duration: 1.2, ease: "sine.inOut" })
      .to(character, { y: 0, rotation: 0, duration: 1.2, ease: "sine.inOut" });
  },
  curious: (timeline, character) => {
    timeline
      .to(character, { x: 5, rotation: 2.6, duration: 0.42, ease: "sine.inOut" })
      .to(character, { x: -3, rotation: -1.8, duration: 0.52, ease: "sine.inOut" })
      .to(character, { x: 0, rotation: 0, duration: 0.38, ease: "power1.out" });
  },
  happy: (timeline, character) => {
    timeline
      .to(character, { y: -7, scale: 1.025, duration: 0.24, ease: "power2.out" })
      .to(character, { y: 0, scale: 1, duration: 0.44, ease: "bounce.out" });
  },
  confused: (timeline, character) => {
    timeline
      .to(character, { rotation: -4, y: -2, duration: 0.3, ease: "sine.inOut" })
      .to(character, { rotation: 3.5, y: 0, duration: 0.42, ease: "sine.inOut" })
      .to(character, { rotation: 0, duration: 0.3, ease: "power1.out" });
  },
  frustrated: (timeline, character) => {
    timeline
      .to(character, { y: -3, rotation: 2, duration: 0.15, ease: "power1.out" })
      .to(character, { y: 0, rotation: -1.8, duration: 0.18, ease: "power1.in" })
      .to(character, { rotation: 0, duration: 0.16, ease: "sine.out" })
      .to(character, { duration: 0.65 });
  },
  reading: (timeline, character) => {
    timeline
      .to(character, { y: -1, rotation: -0.5, duration: 1.4, ease: "sine.inOut" })
      .to(character, { y: 0, rotation: 0, duration: 1.4, ease: "sine.inOut" });
  },
  celebrating: (timeline, character) => {
    timeline
      .to(character, { y: -13, scale: 1.035, duration: 0.26, ease: "power2.out" })
      .to(character, { y: 0, scale: 1, duration: 0.48, ease: "bounce.out" })
      .to(character, { duration: 0.55 });
  },
  disappointed: (timeline, character) => {
    timeline
      .to(character, { y: 4, rotation: 1, duration: 0.35, ease: "sine.inOut" })
      .to(character, { y: 0, rotation: 0, duration: 0.5, ease: "sine.inOut" });
  },
  shopping: (timeline, character) => {
    timeline
      .to(character, { x: 4, rotation: 2.1, duration: 0.48, ease: "sine.inOut" })
      .to(character, { x: -4, rotation: -2.1, duration: 0.52, ease: "sine.inOut" })
      .to(character, { x: 0, rotation: 0, duration: 0.4, ease: "sine.inOut" });
  },
};

export function useCharacterMotion(
  characterRef: RefObject<HTMLElement | null>,
  state: CharacterState,
  reducedMotion: boolean,
): void {
  useGSAP(() => {
    const character = characterRef.current;
    if (!character || reducedMotion) return;

    gsap.set(character, { transformOrigin: "50% 92%", force3D: true });
    const timeline = gsap.timeline({ repeat: -1, repeatDelay: 0.28 });
    motionRecipes[state](timeline, character);
  }, {
    scope: characterRef,
    dependencies: [state, reducedMotion],
    revertOnUpdate: true,
  });
}

interface SpriteTransitionOptions {
  scopeRef: RefObject<HTMLElement | null>;
  currentRef: RefObject<HTMLImageElement | null>;
  previousRef: RefObject<HTMLImageElement | null>;
  currentSrc?: string;
  previousSrc?: string;
  reducedMotion: boolean;
}

export function useCharacterSpriteTransition({
  scopeRef,
  currentRef,
  previousRef,
  currentSrc,
  previousSrc,
  reducedMotion,
}: SpriteTransitionOptions): void {
  useGSAP(() => {
    const current = currentRef.current;
    const previous = previousRef.current;
    if (!current) return;

    if (reducedMotion) {
      gsap.set(current, { autoAlpha: 1, clearProps: "transform" });
      if (previous) gsap.set(previous, { autoAlpha: 0, clearProps: "transform" });
      return;
    }

    const transition = gsap.timeline();
    transition.fromTo(
      current,
      { autoAlpha: 0, y: previous ? 5 : 3, scale: 0.985 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: "power2.out" },
    );
    if (previous) {
      transition.fromTo(
        previous,
        { autoAlpha: 1, y: 0, scale: 1 },
        { autoAlpha: 0, y: -3, scale: 0.99, duration: 0.3, ease: "power1.inOut" },
        0,
      );
    }
  }, {
    scope: scopeRef,
    dependencies: [currentSrc, previousSrc, reducedMotion],
    revertOnUpdate: true,
  });
}
