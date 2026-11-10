import type { Metadata } from "next";
import { HighlightIcon, type HighlightIconKind } from "@/components/about/highlight-icon";
import { RevealObserver } from "@/components/home/reveal";

export const metadata: Metadata = {
  title: "Acerca de",
  description:
    "Conoce la misión de Arcade Vault y escríbenos: sugerencias, juegos nuevos o simplemente un saludo.",
};

const HIGHLIGHTS: { kind: HighlightIconKind; text: string; color: "magenta" | "cyan" | "green" }[] = [
  { kind: "HEART", text: "HECHO CON ❤️ PARA JUGADORES", color: "magenta" },
  { kind: "BROWSER", text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR", color: "cyan" },
  { kind: "PLANT", text: "PROYECTO EN CONSTANTE CRECIMIENTO", color: "green" },
];

export default function AboutPage() {
  return (
    <div className="about fade-in">
      <RevealObserver />

      {/* ABOUT */}
      <section className="about-hero">
        <div className="kicker pixel neon-yellow">▸ ACERCA DE</div>
        <h1 className="about-title">ACERCA DE ARCADE VAULT</h1>
        <p className="about-mission">
          ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar
          los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar
          y sin costo.
        </p>

        <div className="highlight-row">
          {HIGHLIGHTS.map((h, i) => (
            <div
              key={h.kind}
              className={`highlight ${h.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <HighlightIcon kind={h.kind} />
              <div className="hl-text pixel">{h.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* divider banner */}
      <div className="about-divider reveal" aria-hidden="true">
        <div className="div-bar"></div>
        <div className="div-pixels">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }}></span>
          ))}
        </div>
        <div className="div-bar"></div>
      </div>

      {/* CONTACT */}
      <section className="about-contact reveal">
        <div className="contact-grid">
          <div className="contact-intro">
            <div className="kicker pixel neon-cyan">▸ CONTACTO</div>
            <h2 className="contact-title">CONTÁCTANOS</h2>
            <p className="contact-sub">
              ¿Tienes alguna sugerencia, quieres proponer un juego, o simplemente quieres saludar?
              Escríbenos.
            </p>
            <div className="contact-tips">
              <div className="tip"><span className="tip-led"></span>RESPUESTA EN 24-48H</div>
              <div className="tip"><span className="tip-led y"></span>SUGERENCIAS BIENVENIDAS</div>
              <div className="tip"><span className="tip-led m"></span>SIN SPAM, JAMÁS</div>
            </div>
          </div>

          {/* Placeholder estático: el paso 7 lo sustituye por <ContactForm /> */}
          <form className="contact-form">
            <div className="field">
              <label>NOMBRE</label>
              <input placeholder="px_kai" />
            </div>
            <div className="field">
              <label>CORREO ELECTRÓNICO</label>
              <input type="email" placeholder="jugador@vault.gg" />
            </div>
            <div className="field">
              <label>MENSAJE</label>
              <textarea rows={5} placeholder="Cuéntanos qué tienes en mente…"></textarea>
            </div>
            <button className="btn xl press" type="button" style={{ width: "100%" }}>
              ▶  ENVIAR MENSAJE
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
