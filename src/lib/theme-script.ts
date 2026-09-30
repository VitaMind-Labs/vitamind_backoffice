export const THEME_STORAGE_KEY = "vm-theme";

/**
 * Runs in <head> before first paint so the stored theme never flashes.
 * Server-safe (no React imports): it is inlined as a string by the root layout.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}")||"system";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;
