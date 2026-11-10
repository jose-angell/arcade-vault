"use server";

import { Resend } from "resend";
import { trimContact, validateContact, type ContactInput, type ContactState } from "@/lib/contact";

const DEFAULT_FROM = "Arcade Vault <onboarding@resend.dev>";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

// Escapa los caracteres con significado en HTML antes de meterlos en el correo.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail({ name, email, msg }: ContactInput) {
  const text = `Nombre: ${name}\nCorreo: ${email}\n\n${msg}`;
  const html = `
    <h2>Nuevo mensaje desde Arcade Vault</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
    <p><strong>Correo:</strong> ${escapeHtml(email)}</p>
    <p><strong>Mensaje:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(msg)}</p>
  `;
  return { text, html };
}

export async function sendContact(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const values = trimContact({
    name: field(formData, "name"),
    email: field(formData, "email"),
    msg: field(formData, "msg"),
  });

  // Honeypot: un bot lo rellena, una persona no lo ve. Se finge éxito sin enviar.
  if (field(formData, "website") !== "") {
    return { status: "ok", name: values.name };
  }

  if (!validateContact(values)) {
    return { status: "error", reason: "invalid", values };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM;

  if (!apiKey || !to) {
    console.error("[contact] Falta RESEND_API_KEY o CONTACT_TO_EMAIL en el entorno.");
    return { status: "error", reason: "send", values };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: values.email,
      subject: `[Arcade Vault] Mensaje de ${values.name}`,
      ...buildEmail(values),
    });

    if (error) {
      console.error("[contact] Resend rechazó el envío:", error);
      return { status: "error", reason: "send", values };
    }
  } catch (err) {
    console.error("[contact] Error al enviar el correo:", err);
    return { status: "error", reason: "send", values };
  }

  return { status: "ok", name: values.name };
}
