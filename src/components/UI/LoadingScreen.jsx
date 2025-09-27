import React, { useEffect, useMemo, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const getPrefersReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

const LoadingScreen = ({ progress }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion);

  const clampedProgress = useMemo(() => {
    const numeric = typeof progress === "string" ? parseFloat(progress) : progress;
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }, [progress]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);

    const handleChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", handleChange);
      return () => mediaQueryList.removeEventListener("change", handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, []);

  const progressBarClasses = useMemo(() => {
    const classes = [
      "bg-yellow-500 h-full rounded-full text-center text-black font-bold leading-8"
    ];

    if (!prefersReducedMotion) {
      classes.push("transition-all duration-500 ease-out");
    }

    return classes.join(" ");
  }, [prefersReducedMotion]);

  const progressBarStyle = useMemo(() => {
    const style = { width: `${clampedProgress}%` };
    if (prefersReducedMotion || clampedProgress === 100) {
      style.transition = "none";
    }
    return style;
  }, [clampedProgress, prefersReducedMotion]);

  return React.createElement(
    "div",
    { className: "w-full h-full relative" },
    React.createElement("div", {
      className: "absolute inset-0 bg-cover bg-center",
      // Use relative path so this works when hosted under a subpath
      style: { backgroundImage: "url('./loading1.png')" }
    }),
    React.createElement("div", { className: "absolute inset-0 bg-black bg-opacity-60" }),
    React.createElement(
      "div",
      {
        className:
          "relative z-10 w-full h-full flex flex-col items-center justify-center text-white"
      },
      React.createElement(
        "h2",
        { className: "text-4xl font-bold text-yellow-400 mb-4" },
        "Loading Game Assets..."
      ),
      React.createElement(
        "div",
        {
          className:
            "w-1/2 max-w-2xl bg-gray-700 rounded-full h-8 border-2 border-gray-600"
        },
        React.createElement(
          "div",
          { className: progressBarClasses, style: progressBarStyle },
          React.createElement(
            "span",
            { role: "status", "aria-live": "polite" },
            `${clampedProgress}%`
          )
        )
      ),
      React.createElement(
        "p",
        { className: "mt-4 text-gray-200" },
        "Please wait, this may take a moment."
      ),
      React.createElement(
        "p",
        { className: "text-xs text-gray-300 mt-2 opacity-80" },
        "Tip: If performance is low, lower Render Scale in Settings."
      )
    )
  );
};

export default LoadingScreen;
export { LoadingScreen };
