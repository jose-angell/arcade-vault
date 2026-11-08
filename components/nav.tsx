"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/components/session-provider";

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useSession();
  const [open, setOpen] = useState(false);

  // Biblioteca incluye el detalle y el reproductor (/juegos/*).
  const isLibrary = pathname === "/" || pathname.startsWith("/juegos");
  const isHall = pathname.startsWith("/salon");
  const isAuth = pathname.startsWith("/acceso");

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <nav className="av-nav" aria-label="Principal">
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link
            href="/"
            className={isLibrary ? "active" : ""}
            aria-current={isLibrary ? "page" : undefined}
          >
            Biblioteca
          </Link>
          <Link
            href="/salon"
            className={isHall ? "active" : ""}
            aria-current={isHall ? "page" : undefined}
          >
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer" />
        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button type="button" className="btn ghost auth-btn" onClick={signOut}>
            {user.name} ▾
          </button>
        ) : (
          <Link href="/acceso" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}
        <button
          type="button"
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={"av-mobile-panel" + (open ? " open" : "")}
        aria-label="Menú"
        inert={!open}
      >
        <div className="pixel neon-cyan mb-4 text-[11px]">MENÚ</div>
        <Link
          href="/"
          className={isLibrary ? "active" : ""}
          aria-current={isLibrary ? "page" : undefined}
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          href="/salon"
          className={isHall ? "active" : ""}
          aria-current={isHall ? "page" : undefined}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/acceso"
          className={isAuth ? "active" : ""}
          aria-current={isAuth ? "page" : undefined}
          onClick={close}
        >
          {user ? "Cuenta" : "Iniciar Sesión"}
        </Link>
        <div className="flex-1" />
        <div className="pixel text-[9px] tracking-[0.16em] text-ink-faint">
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
