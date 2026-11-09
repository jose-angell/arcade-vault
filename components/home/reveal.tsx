"use client";

import { useEffect } from "react";

// Observa los elementos `.reveal` de la página y les añade `.in` al entrar en
// pantalla. No renderiza nada: se monta una vez dentro de la home.
export function RevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");

    // Sin IntersectionObserver (navegadores muy viejos) se muestra todo.
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
