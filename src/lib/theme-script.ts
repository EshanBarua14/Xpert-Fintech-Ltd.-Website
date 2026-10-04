/* Runs before first paint: marks JS as available (for scroll reveals) and
   applies the saved theme, or the device's light/dark preference. Shared by
   the public site and the admin portal, so a choice made in one applies to both. */
export const THEME_SCRIPT =
  "(function(){var d=document.documentElement;d.classList.add('js');var t=null;try{t=localStorage.getItem('theme')}catch(e){}" +
  "if(t!=='light'&&t!=='dark'){t=window.matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.dataset.theme=t})()";
