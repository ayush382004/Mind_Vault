import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { logoData } from "../../constants/logoData";
import Footer from "./Footer";
import { useNavigate } from "react-router";
import Features from "./Features";

export default function Hero() {
  const heroRef = useRef();
  const logoMaskRef = useRef();
  const logoContainerRef = useRef();
  const overlayCopyRef = useRef();
  const heroImgContainerRef = useRef();
  const heroImgLogoRef = useRef();
  const heroImageCopyRef = useRef();
  const fadeOverlayRef = useRef();
  const svgOverlayRef = useRef();

  const navigate = useNavigate();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    const updateLogoMaskPosition = () => {
      const logoMask = logoMaskRef.current;
      const logoContainer = logoContainerRef.current;

      if (!logoMask || !logoContainer) return;

      logoMask.setAttribute("d", logoData);

      const logoDimensions = logoContainer.getBoundingClientRect();
      const logoBoundingBox = logoMask.getBBox();

      const horizontalScaleRatio = logoDimensions.width / logoBoundingBox.width;
      const verticalScaleRatio = logoDimensions.height / logoBoundingBox.height;
      const logoScaleFactor = Math.min(horizontalScaleRatio, verticalScaleRatio);

      const logoHorizontalPosition =
        logoDimensions.left +
        (logoDimensions.width - logoBoundingBox.width * logoScaleFactor) / 2 -
        logoBoundingBox.x * logoScaleFactor;

      const logoVerticalPosition =
        logoDimensions.top +
        (logoDimensions.height - logoBoundingBox.height * logoScaleFactor) / 2 -
        logoBoundingBox.y * logoScaleFactor;

      logoMask.setAttribute(
        "transform",
        `translate(${logoHorizontalPosition}, ${logoVerticalPosition}) scale(${logoScaleFactor})`
      );
    };

    updateLogoMaskPosition();
    window.addEventListener("resize", updateLogoMaskPosition);

    ScrollTrigger.create({
      trigger: heroRef.current,
      start: "top top",
      end: "+=800vh",
      pin: true,
      pinSpacing: true,
      scrub: 1,
      onUpdate: (self) => {
        const scrollProgress = self.progress;

        const fadeOpacity = 1 - scrollProgress * (1 / 0.15);
        gsap.set([heroImgLogoRef.current, heroImageCopyRef.current], {
          opacity: scrollProgress <= 0.15 ? fadeOpacity : 0,
        });

        if (scrollProgress <= 1.0) {
          const normalizedProgress = scrollProgress;
          const heroImgContainerScale = 1.5 - 0.5 * normalizedProgress;
          const initialOverlayScale = 350;
          const overlayScale =
            initialOverlayScale * Math.pow(1 / initialOverlayScale, normalizedProgress);

          gsap.set(heroImgContainerRef.current, {
            scale: heroImgContainerScale,
          });

          gsap.set(svgOverlayRef.current, {
            scale: overlayScale,
          });
        }

        const fadeInStart = 0.25;
        const fadeInEnd = 1;
        if (scrollProgress >= fadeInStart && scrollProgress <= fadeInEnd) {
          const fadeOverlayOpacity =
            (scrollProgress - fadeInStart) / (fadeInEnd - fadeInStart);
          gsap.set(fadeOverlayRef.current, { opacity: fadeOverlayOpacity, display: "block" });
        } else {
          gsap.set(fadeOverlayRef.current, { opacity: 0, display: "none" });
        }

        if (scrollProgress >= 0.6) {
          const overlayCopyRevealProgress = Math.min((scrollProgress - 0.6) / 0.4, 1);
          const gradientSpread = 100;
          const gradientBottomPosition = 240 - overlayCopyRevealProgress * 280;
          const gradientTopPosition = gradientBottomPosition - gradientSpread;
          const overlayCopyScale = 1.25 - 0.25 * overlayCopyRevealProgress;

          const overlayCopy = overlayCopyRef.current;
          overlayCopy.style.background = `linear-gradient(to right, #111117 0%, #111117 ${gradientTopPosition}%, #60a5fa ${gradientBottomPosition}%, #c084fc 100%)`;
          overlayCopy.style.backgroundClip = "text";
          overlayCopy.style.webkitBackgroundClip = "text";
          overlayCopy.style.webkitTextFillColor = "transparent";

          gsap.set(overlayCopy, {
            scale: overlayCopyScale,
            opacity: overlayCopyRevealProgress,
          });
        } else {
          gsap.set(overlayCopyRef.current, { opacity: 0 });
        }
      },
      onComplete: () => {
        gsap.set(heroRef.current, { position: "relative" });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
      window.removeEventListener("resize", updateLogoMaskPosition);
    };
  }, []);

  return (
    <div className="overflow-x-hidden">
      <section
        ref={heroRef}
        className="relative w-screen h-[100svh] bg-[#111117] text-center overflow-hidden"
      >
        <div
          ref={heroImgContainerRef}
          className="absolute inset-0 origin-center scale-100"
        >
          <img src="/bg.png" alt="Background" className="w-full h-full" />
          <div
            ref={heroImgLogoRef}
            className="absolute top-[20%] left-1/2 -translate-x-1/2"
          >
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-[clamp(120px,20vw,250px)] h-auto object-contain"
            />
          </div>
          <img
            src="/bgtop.png"
            alt="Overlay"
            className="w-full h-full object-cover absolute inset-0"
          />
          <div
            ref={heroImageCopyRef}
            className="absolute bottom-[20%] left-1/2 -translate-x-1/2"
          >
            <p className="text-[0.65rem] sm:text-xs md:text-sm uppercase font-medium text-white animate-bounce">
              Scroll down to reveal
            </p>
          </div>
        </div>

        <div
          ref={fadeOverlayRef}
          className="absolute inset-0 bg-white will-change-[opacity] pointer-events-none"
        />

        <div
          ref={svgOverlayRef}
          className="absolute -top-20 left-0 w-full h-[200%] origin-[center_14%] z-[1] pointer-events-none"
        >
          <svg width="100%" height="100%">
            <defs>
              <mask id="logoRevealMask">
                <rect width="100%" height="100%" fill="white" />
                <path ref={logoMaskRef} id="logoMask" />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="#111117"
              mask="url(#logoRevealMask)"
            />
          </svg>
        </div>

        <div
          ref={logoContainerRef}
          className="fixed top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[clamp(120px,20vw,200px)] h-[clamp(90px,15vw,150px)] z-[2]"
        />

        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 z-[2] px-4 w-3/4">
          <h1
            ref={overlayCopyRef}
            className="text-4xl md:text-7xl font-bold leading-[0.9] text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-display"
          >
            Your Digital Twin. <br /> Evolving with You. <br /> Living Beyond
            You.
          </h1>
        </div>
      </section>

      <section className="bg-[#111117] text-white py-20 -mt-0 flex flex-col items-center relative">
        <div className="inline-block p-[1px] rounded-3xl bg-gradient-to-r from-blue-400 to-purple-400 absolute -top-10 z-10">
          <button
            className="px-6 sm:px-8 py-2 text-sm sm:text-2xl rounded-3xl bg-[#111117] text-white font-semibold w-fit z-10 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-400 hover:text-white hover:scale-95"
            onClick={() => navigate("/login")}
          >
            Create Your Vault
          </button>
        </div>

        <div className="w-[80vw] px-4">
          <Features />
          <Footer />
        </div>
      </section>
    </div>
  );
}
