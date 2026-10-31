// West High Science Olympiad — cinematic scroll motion (GSAP ScrollTrigger + Lenis)

(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // No motion library, or the visitor asked for less motion: show everything, animate nothing.
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    root.classList.add("static");
    return;
  }
  root.classList.add("js");

  try {
    gsap.registerPlugin(ScrollTrigger);

    /* Smooth scrolling */
    if (window.Lenis) {
      const lenis = new Lenis({ lerp: 0.09 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    /* Header turns to dark glass once the page moves */
    const header = document.querySelector(".site-header");
    ScrollTrigger.create({
      start: 60,
      onToggle: (self) => header && header.classList.toggle("scrolled", self.isActive),
    });

    /* Hero (home and inner pages): title slides up on load, then layers drift apart as you scroll */
    const hero = document.querySelector(".c-hero, .p-hero");
    if (hero) {
      const heroLines = gsap.utils.toArray(".c-title .line > span", hero);
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      gsap.set(heroLines, { yPercent: 115 });
      const heroImg = hero.querySelector(".c-hero-bg img");
      if (heroImg) intro.fromTo(heroImg, { scale: 1.25 }, { scale: 1.05, duration: 2.4 }, 0);
      intro.to(heroLines, { yPercent: 0, duration: 1.4, stagger: 0.14 }, 0.15);
      const fades = gsap.utils.toArray(".c-eyebrow, .p-crumb, .c-hero-foot, .p-hero-sub", hero);
      if (fades.length) intro.from(fades, { opacity: 0, y: 24, duration: 1, stagger: 0.12 }, 0.7);

      const heroBg = hero.querySelector(".c-hero-bg");
      if (heroBg) {
        gsap.to(heroBg, {
          yPercent: 14,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
        });
      }
      heroLines.forEach((el, i) => {
        gsap.to(el, {
          y: -(30 + i * 36),
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
        });
      });
      const foot = hero.querySelector(".c-hero-foot, .p-hero-sub");
      if (foot) {
        gsap.to(foot, {
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "30% top", end: "70% top", scrub: true },
        });
      }
    }

    /* Photos drift inside their frames */
    gsap.utils.toArray(".p-photo").forEach((frame) => {
      const img = frame.querySelector("img");
      if (!img) return;
      gsap.fromTo(
        img,
        { yPercent: -7 },
        { yPercent: 0, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } }
      );
    });

    /* Timeline rail fills in as you read down it */
    const rail = document.querySelector(".p-tl-rail i");
    if (rail) {
      gsap.to(rail, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: ".p-timeline", start: "top 70%", end: "bottom 60%", scrub: true },
      });
    }

    /* Statement: words light up as you read */
    const stmt = document.querySelector(".c-reveal-words");
    if (stmt) {
      const words = stmt.textContent.trim().split(/\s+/);
      stmt.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
      gsap.fromTo(
        stmt.querySelectorAll(".w"),
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.12,
          ease: "none",
          scrollTrigger: { trigger: stmt, start: "top 82%", end: "bottom 48%", scrub: true },
        }
      );
    }

    /* Numbers count up when they arrive */
    gsap.utils.toArray("[data-count]").forEach((el) => {
      const end = Number(el.dataset.count);
      const state = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () =>
          gsap.to(state, {
            v: end,
            duration: 1.8,
            ease: "power2.out",
            onUpdate: () => (el.textContent = Math.round(state.v)),
          }),
      });
    });

    /* Everything tagged data-rise fades up as it enters */
    ScrollTrigger.batch("[data-rise]", {
      start: "top 90%",
      once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: "power3.out" }),
    });

    const mm = gsap.matchMedia();

    /* Events: pin the section and scroll the track sideways (desktop) */
    mm.add("(min-width: 901px)", () => {
      const track = document.querySelector(".c-track");
      const bar = document.querySelector(".c-progress i");
      if (!track) return;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const slide = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: ".c-pin",
          start: "top top",
          end: () => "+=" + dist(),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => bar && gsap.set(bar, { scaleX: self.progress }),
        },
      });
      gsap.utils.toArray(".c-panel").forEach((panel) => {
        gsap.from(panel.querySelector(".num"), {
          xPercent: -30,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: slide,
            start: "left 95%",
            end: "left 45%",
            scrub: true,
          },
        });
      });
    });

    /* Photo reveal: the frame opens up to full screen while the picture settles */
    const reveal = document.querySelector(".c-reveal");
    if (reveal) {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: reveal, start: "top top", end: "+=110%", pin: true, scrub: 0.6 },
      });
      tl.to(".c-reveal-frame", { clipPath: "inset(0% 0% 0% 0% round 0px)" }, 0)
        .to(".c-reveal-frame img", { scale: 1 }, 0)
        .from(".c-reveal-copy", { opacity: 0, y: 60 }, 0.35);
    }

    /* Gallery rows drift in opposite directions */
    if (document.querySelector(".c-gallery")) {
    gsap.to(".c-gallery-row--a", {
      xPercent: -22,
      ease: "none",
      scrollTrigger: { trigger: ".c-gallery", start: "top bottom", end: "bottom top", scrub: 0.6 },
    });
    gsap.fromTo(
      ".c-gallery-row--b",
      { xPercent: -22 },
      {
        xPercent: 0,
        ease: "none",
        scrollTrigger: { trigger: ".c-gallery", start: "top bottom", end: "bottom top", scrub: 0.6 },
      }
    );
    }

    /* Fonts and images change layout: recalc once everything has loaded */
    window.addEventListener("load", () => ScrollTrigger.refresh());
  } catch (err) {
    // If anything fails, fall back to the plain, fully visible page.
    console.error("Cinematic motion disabled:", err);
    root.classList.remove("js");
    root.classList.add("static");
  }
})();
