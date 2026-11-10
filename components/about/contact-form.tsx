"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendContact } from "@/app/acerca/actions";
import type { ContactInput, ContactState } from "@/lib/contact";

const IDLE: ContactState = { status: "idle" };
const EMPTY: ContactInput = { name: "", email: "", msg: "" };

function TerminalBar() {
  return (
    <div className="term-bar">
      <span className="dot r"></span>
      <span className="dot y"></span>
      <span className="dot g"></span>
      <span className="term-title">VAULT-OS // TERMINAL</span>
    </div>
  );
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContact, IDLE);
  const [form, setForm] = useState<ContactInput>(EMPTY);
  const [shake, setShake] = useState(false);
  // Resultado que el usuario ya cerró (REINTENTAR / ENVIAR OTRO MENSAJE).
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    };
  }, []);

  const showResult = state.status !== "idle" && dismissed !== state;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!form.name.trim() || !form.email.trim() || !form.msg.trim()) {
      // Evita que se invoque la Server Action.
      e.preventDefault();
      setShake(true);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShake(false), 400);
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setDismissed(state);
  };

  const retry = () => {
    if (state.status === "error") setForm(state.values);
    setDismissed(state);
  };

  return (
    <form
      className={"contact-form" + (shake ? " shake" : "")}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
    >
      {!showResult ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="px_kai"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jugador@vault.gg"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-msg">MENSAJE</label>
            <textarea
              id="contact-msg"
              name="msg"
              rows={5}
              value={form.msg}
              onChange={(e) => setForm({ ...form, msg: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            ></textarea>
          </div>

          {/* Honeypot: invisible para personas, los bots lo rellenan. */}
          <input
            name="website"
            type="text"
            defaultValue=""
            aria-hidden="true"
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />

          <button className="btn xl press" type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "▶  ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : state.status === "ok" ? (
        <div className="terminal-success">
          <TerminalBar />
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={reset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="terminal-success error" role="alert">
          <TerminalBar />
          <div className="term-body">
            <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
            {state.status === "error" && state.reason === "invalid" ? (
              <>
                <div className="line dim">[ERR] Datos no válidos.</div>
                <div className="line dim">[ERR] Revisa el correo y la longitud de los campos.</div>
              </>
            ) : (
              <>
                <div className="line dim">[ERR] No se pudo conectar con el servidor de correo.</div>
                <div className="line dim">[ERR] El paquete no fue transmitido.</div>
              </>
            )}
            <div className="line success">
              &gt; ERROR. TU MENSAJE NO SE HA ENVIADO.<span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={retry}>
                REINTENTAR
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
