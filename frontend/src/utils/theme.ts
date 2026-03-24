export type Theme = 'light' | 'dark' | "system";

export function getSystemTheme():Theme{
      if(typeof window === "undefined")return "light";
      return window.matchMedia("(prefers-color-scheme:dark)").matches? "dark"  : "light";
}

export function applyTheme(theme : Theme){
      const root = window.document.documentElement;

      root.classList.remove("light", 'dark');

      if(theme === "system"){
            const system = getSystemTheme();
            root.classList.add(system);
      }else{
            root.classList.add(theme);
      }

      localStorage.setItem("theme",theme);
}

export function getSavedTheme() : Theme{
      const saved = localStorage.getItem("theme") as Theme | null;
      return saved || "system";
}