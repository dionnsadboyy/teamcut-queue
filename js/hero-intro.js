function setupHeroIntro() {
  const hero = document.querySelector(".hero");
  const heading = hero?.querySelector("#hero-title");
  if (!hero || !heading) return;

  const brandText = Array.from(heading.childNodes)
    .find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  if (brandText && !heading.querySelector(".hero-letter")) {
    const accessibleName = heading.textContent.trim();
    const letters = Array.from(brandText.textContent.trim()).map((character) => {
      const letter = document.createElement("span");
      letter.className = "hero-letter";
      letter.setAttribute("aria-hidden", "true");
      letter.textContent = character;
      return letter;
    });
    brandText.replaceWith(...letters);
    heading.setAttribute("aria-label", accessibleName);
  }

  const gsap = window.gsap;
  if (!gsap || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const photo = hero.querySelector(".hero-image");
  const foreground = hero.querySelector(".hero-foreground");
  const letters = Array.from(heading.querySelectorAll(".hero-letter"));
  const accent = heading.querySelector(".hero-accent");
  const tagline = hero.querySelector(".hero-tagline");
  const signature = hero.querySelector(".hero-signature");
  const heroBottom = hero.querySelector(".hero-bottom");
  const targets = [photo, foreground, ...letters, accent, tagline, signature, heroBottom].filter(Boolean);
  gsap.killTweensOf(targets);
  const photoLayers = [photo, foreground].filter(Boolean);

  const letterScatter = [
    { x: -9, y: -138, z: -24, rotationX: -1.5, rotationY: -2.5, rotationZ: -6.5, scale: 0.97 },
    { x: 6, y: -116, z: -12, rotationX: 1.2, rotationY: 2, rotationZ: 5, scale: 1.02 },
    { x: -12, y: -154, z: -28, rotationX: -1, rotationY: -2.8, rotationZ: -7.5, scale: 0.96 },
    { x: 9, y: -104, z: -10, rotationX: 1.4, rotationY: 2.4, rotationZ: 6, scale: 1.03 },
    { x: -5, y: -145, z: -20, rotationX: -1.3, rotationY: -1.8, rotationZ: -4.5, scale: 0.98 },
    { x: 11, y: -124, z: -14, rotationX: 1, rotationY: 2.8, rotationZ: 7, scale: 1.02 },
    { x: -7, y: -110, z: -18, rotationX: -1.2, rotationY: -2.2, rotationZ: -5.5, scale: 0.98 },
  ];

  const intro = gsap.timeline({ defaults: { overwrite: "auto", force3D: true } });
  if (photoLayers.length) {
    intro.fromTo(
      photoLayers,
      {
        scale: 0.955,
        x: -8,
        y: 30,
        z: -64,
        rotationX: -2.6,
        rotationY: 1.2,
        rotationZ: -0.25,
        clipPath: "inset(5% 0% 7% 0%)",
        transformPerspective: 1450,
        transformOrigin: "50% 52%",
      },
      {
        scale: 1.022,
        x: 0,
        y: -2,
        z: 16,
        rotationX: 0.35,
        rotationY: -0.25,
        rotationZ: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.08,
        ease: "power3.out",
      },
      0,
    );
    intro.to(
      photoLayers,
      {
        scale: 1,
        x: 0,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        duration: 0.48,
        ease: "power2.out",
        clearProps: "transform,transformOrigin,clipPath",
      },
      1.08,
    );
  }
  if (photo) {
    intro.fromTo(
      photo,
      {
        autoAlpha: 0.68,
      },
      {
        autoAlpha: 1,
        duration: 0.76,
        ease: "power2.out",
        clearProps: "opacity,visibility",
      },
      0,
    );
  }
  if (foreground) {
    intro.fromTo(
      foreground,
      { autoAlpha: 0.18 },
      {
        autoAlpha: 1,
        duration: 0.92,
        ease: "power2.out",
        clearProps: "opacity,visibility",
      },
      0.12,
    );
  }

  letters.forEach((letter, index) => {
    const scatter = letterScatter[index % letterScatter.length];
    const start = 0.28 + index * 0.055;
    intro.fromTo(
      letter,
      {
        autoAlpha: 0,
        x: scatter.x,
        y: scatter.y,
        z: scatter.z,
        rotationX: scatter.rotationX,
        rotationY: scatter.rotationY,
        rotationZ: scatter.rotationZ,
        scale: scatter.scale,
        transformPerspective: 1200,
        transformOrigin: "50% 65%",
      },
      {
        autoAlpha: 1,
        x: 0,
        y: 1,
        z: 5,
        rotationX: 0.2,
        rotationY: -0.35,
        rotationZ: -0.8,
        scale: 1.012,
        duration: 0.62,
        ease: "power4.out",
      },
      start,
    );
    intro.to(
      letter,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
        clearProps: "transform,transformOrigin,opacity,visibility",
      },
      start + 0.62,
    );
  });

  if (accent) {
    intro.fromTo(
      accent,
      { autoAlpha: 0, x: 5, y: -104, z: -12, rotationX: -1.4, rotationY: 2, rotationZ: 5.5, scale: 0.98, transformOrigin: "50% 65%" },
      { autoAlpha: 1, x: 0, y: 1, z: 4, rotationX: 0.2, rotationY: -0.35, rotationZ: -0.8, scale: 1.012, duration: 0.62, ease: "power4.out" },
      0.62,
    );
    intro.to(
      accent,
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        z: 0,
        rotationX: 0,
        rotationY: 0,
        rotationZ: 0,
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
        clearProps: "transform,transformOrigin,opacity,visibility",
      },
      1.24,
    );
  }

  const supportingCopy = [tagline, signature].filter(Boolean);
  if (supportingCopy.length) {
    intro.fromTo(
      supportingCopy,
      { autoAlpha: 0, y: 12, z: -8, transformPerspective: 1200 },
      {
        autoAlpha: 1,
        y: 0,
        z: 0,
        duration: 0.44,
        stagger: 0.06,
        ease: "power3.out",
        clearProps: "transform,transformOrigin,opacity,visibility",
      },
      1.55,
    );
  }
  if (heroBottom) {
    intro.fromTo(
      heroBottom,
      { autoAlpha: 0, y: 11, z: -10, transformPerspective: 1200 },
      {
        autoAlpha: 1,
        y: 0,
        z: 0,
        duration: 0.88,
        ease: "power3.out",
        clearProps: "transform,transformOrigin,opacity,visibility",
      },
      1.96,
    );
  }

  return intro;
}

setupHeroIntro();
