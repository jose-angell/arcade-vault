// Tipos y validación del formulario de contacto. Se comparte entre la Server
// Action (servidor) y el formulario (cliente), por eso no lleva "use server".

export interface ContactInput {
  name: string;
  email: string;
  msg: string;
}

export type ContactState =
  | { status: "idle" }
  | { status: "ok"; name: string }
  | { status: "error"; reason: "invalid" | "send"; values: ContactInput };

export const CONTACT_LIMITS = { name: 60, email: 120, msg: 2000 };

// Algo@dominio.tld, sin espacios ni más de una arroba.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Recorta los campos. La validación y el envío usan los valores ya recortados.
export function trimContact(input: ContactInput): ContactInput {
  return {
    name: input.name.trim(),
    email: input.email.trim(),
    msg: input.msg.trim(),
  };
}

// Comprueba que no haya campos vacíos, que el correo tenga @ y dominio y que
// ningún campo supere su límite de longitud (tras recortar espacios).
export function validateContact(input: ContactInput): boolean {
  const { name, email, msg } = trimContact(input);

  if (!name || !email || !msg) return false;
  if (name.length > CONTACT_LIMITS.name) return false;
  if (email.length > CONTACT_LIMITS.email) return false;
  if (msg.length > CONTACT_LIMITS.msg) return false;

  return EMAIL_RE.test(email);
}
