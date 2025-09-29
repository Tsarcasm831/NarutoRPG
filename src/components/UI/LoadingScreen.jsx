import React, { useEffect, useMemo, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const getPrefersReducedMotion = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

const LoadingScreen = ({ progress, steps = [] }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(getPrefersReducedMotion);

  const clampedProgress = useMemo(() => {
    const numeric = typeof progress === "string" ? parseFloat(progress) : progress;
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }, [progress]);

  const stepList = useMemo(() => (Array.isArray(steps) ? steps : []), [steps]);
  const activeStep = useMemo(() => {
    if (!stepList.length) return null;
    return stepList.find((step) => step?.status === "active") || stepList.find((step) => step?.status === "pending");
  }, [stepList]);

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
      "bg-yellow-500 h-full rounded-full text-center text-black font-semibold leading-6 text-sm"
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
        { className: "text-3xl font-bold text-yellow-400 mb-2" },
        "Loading Game Assets..."
      ),
      React.createElement(
        "div",
        {
          className:
            "w-11/12 max-w-2xl bg-gray-700 rounded-full h-6 border border-gray-600"
        },
        React.createElement(
          "div",
          { className: progressBarClasses, style: progressBarStyle },
          React.createElement(
            "span",
            { className: "text-xs", role: "status", "aria-live": "polite" },
            `${clampedProgress}%`
          )
        )
      ),
      React.createElement(
        "p",
        { className: "mt-3 text-xs text-gray-200" },
        activeStep ? `Current: ${activeStep.label}` : "Preparing systems..."
      ),
      activeStep && activeStep.note ? React.createElement(
        "p",
        { className: "text-[11px] text-yellow-200 mt-1" },
        activeStep.note
      ) : null,
      stepList.length > 0 ? React.createElement(
        "div",
        { className: "mt-4 w-11/12 max-w-3xl space-y-2 text-left" },
        stepList.map((step, idx) => {
          const status = step?.status || "pending";
          const icon = status === "done" ? "[OK]" : status === "error" ? "[!!]" : status === "active" ? "[...]" : "[  ]";
          const iconClass = status === "done" ? "text-green-400" : status === "error" ? "text-red-400" : status === "active" ? "text-yellow-300" : "text-gray-400";
          const headingClass = status === "done" ? "text-green-200" : status === "error" ? "text-red-200" : status === "active" ? "text-yellow-200" : "text-gray-200";
          return React.createElement(
            "div",
            { key: step?.id || step?.label || `step-${idx}`, className: "flex items-start gap-3" },
            React.createElement(
              "span",
              { className: "text-base font-semibold " + iconClass },
              icon
            ),
            React.createElement(
              "div",
              { className: "flex-1" },
              React.createElement(
                "p",
                { className: "text-xs font-semibold " + headingClass },
                step?.label || "Loading task"
              ),
              step?.description ? React.createElement(
                "p",
                { className: "text-[11px] text-gray-300" },
                step.description
              ) : null,
              step?.note ? React.createElement(
                "p",
                { className: "text-[11px] text-gray-400" },
                step.note
              ) : null
            )
          );
        })
      ) : null,
      React.createElement(
        "p",
        { className: "text-[10px] text-gray-400 mt-5 opacity-85" },
        "Tip: If performance is low, lower Render Scale in Settings."
      )
    )
  );
};

export default LoadingScreen;
export { LoadingScreen };
