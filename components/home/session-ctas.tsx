"use client";

import Link from "next/link";
import { useSession } from "@/components/session-provider";

// CTA que depende de la sesión: sin sesión invita a registrarse, con sesión
// lleva a la biblioteca. La variante `hero` es el segundo botón del hero y la
// variante `pricing` es el botón de la tarjeta de precios.
export function SessionCta({ variant }: { variant: "hero" | "pricing" }) {
  const { user } = useSession();

  if (variant === "hero") {
    return user ? (
      <Link href="/biblioteca" className="btn xl magenta">
        ▶ SEGUIR JUGANDO
      </Link>
    ) : (
      <Link href="/acceso" className="btn xl magenta">
        ✦ CREAR CUENTA
      </Link>
    );
  }

  return user ? (
    <Link href="/biblioteca" className="btn xl pulse w-full">
      SEGUIR JUGANDO →
    </Link>
  ) : (
    <Link href="/acceso" className="btn xl pulse w-full">
      EMPEZAR GRATIS →
    </Link>
  );
}
