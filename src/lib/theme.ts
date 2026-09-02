"use client";

export type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "theme";

/**
 * The chosen theme lives on `<html data-theme>`, written by an inline script in
 * the document head before first paint (see the root layout) so the page never
 * flashes the wrong theme. This store just reads that attribute back, which
 * keeps the DOM the single source of truth.
 */
export function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export function getThemeSnapshot(): ThemeChoice {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : "system";
}

/** The server has no way to know the viewer's choice, so it renders "system". */
export function getThemeServerSnapshot(): ThemeChoice {
  return "system";
}

export function setTheme(choice: ThemeChoice) {
  try {
    if (choice === "system") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // Blocked storage: the choice still applies for this page view.
  }

  if (choice === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", choice);
}

/** Runs in the document head, before paint. Keep it tiny and dependency-free. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;
