# SPEC 03 — Página Acerca de y contacto por correo

> **Estado:** aprobado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-09
> **Objetivo:** Portar `resources/templates/home-about/about.jsx` a `/acerca` con aspecto idéntico y hacer que el formulario de contacto envíe un correo real al equipo mediante Resend.

## Alcance

**Entra:**

- Ruta `/acerca` con las secciones de la plantilla: hero "ACERCA DE ARCADE VAULT", misión, tres highlights con iconos pixel, divisor de píxeles animado y bloque "CONTÁCTANOS".
- Formulario NOMBRE / CORREO ELECTRÓNICO / MENSAJE con animación `shake` si falta un campo.
- Envío real con Resend desde una Server Action.
- Estado de éxito: terminal "VAULT-OS // TERMINAL" idéntico a la plantilla, con "ENVIAR OTRO MENSAJE".
- Estado de error: la misma terminal en rojo con líneas `[ERR]` y botón "REINTENTAR" que vuelve al formulario conservando lo escrito.
- Estado intermedio: botón deshabilitado con texto "▶  ENVIANDO…" mientras la acción está pendiente.
- Validación en servidor y antispam con honeypot y límites de longitud.
- Link "Acerca de" en la navbar (escritorio y panel móvil), después de "Salón", activo solo en `/acerca`.
- Animación `.reveal` reutilizando `components/home/reveal.tsx`.

**Fuera de alcance (para futuras specs):**

- Correo de confirmación al usuario que escribe.
- Dominio propio verificado en Resend (se usa `onboarding@resend.dev` por defecto).
- Plantillas con React Email.
- Rate limit por IP, CAPTCHA o guardado de mensajes en base de datos.
- Cambios en home, biblioteca, detalle, reproductor, acceso o salón.
- Tests automatizados.

## Modelo de datos

Nuevo `lib/contact.ts` (sin `"use server"`) con tipos y validación compartida:

```ts
interface ContactInput { name: string; email: string; msg: string }

type ContactState =
  | { status: "idle" }
  | { status: "ok"; name: string }
  | { status: "error"; reason: "invalid" | "send"; values: ContactInput };

export const CONTACT_LIMITS = { name: 60, email: 120, msg: 2000 };
export function validateContact(input: ContactInput): boolean; // trim, no vacíos, email con @ y dominio, límites
```

Variables de entorno (documentadas en `.env.example`, nunca en el repo con valores reales):

```bash
RESEND_API_KEY=re_xxx
CONTACT_TO_EMAIL=equipo@ejemplo.com
CONTACT_FROM_EMAIL="Arcade Vault <onboarding@resend.dev>"   # opcional, este es el valor por defecto
```

Convenciones:

- Honeypot: input `name="website"` oculto con `aria-hidden` y `tabIndex={-1}`. Si llega relleno, la acción devuelve `{ status: "ok" }` sin enviar.
- Correo: asunto `[Arcade Vault] Mensaje de <nombre>`, `replyTo` = correo del usuario, cuerpo `text` + `html` con nombre, correo y mensaje escapados (`&`, `<`, `>`, `"`, `'`).
- Los textos de la página son los de la plantilla, sin cambios.

## Plan de implementación

1. Instalar `resend` y crear `.env.example` con las tres variables. Verificar: `npm run build` compila.
2. Portar a `app/globals.css` las clases de la plantilla `about`, `about-*`, `highlight*`, `hl-*`, `div-*`, `contact-*`, `tip*`, `terminal-success`, `term-*` y los keyframes `shake` y `pxblink`, sin duplicar `.field` ni `blink`, que ya existen. Añadir variante `.terminal-success.error` (borde y texto magenta/rojo). Añadir `.div-pixels span` al bloque `prefers-reduced-motion`.
3. Crear `components/about/highlight-icon.tsx` (server) con los SVG HEART, BROWSER y PLANT de la plantilla.
4. Crear `app/acerca/page.tsx` con `metadata` "Acerca de", hero, highlights, divisor y la intro de contacto, reutilizando `components/home/reveal.tsx`. El formulario aún es un placeholder estático. Verificar: `/acerca` se ve como la plantilla.
5. Crear `lib/contact.ts` con tipos, `CONTACT_LIMITS` y `validateContact`.
6. Crear `app/acerca/actions.ts` (`"use server"`) con `sendContact(prev, formData)`: honeypot, validación, lectura de env, `resend.emails.send(...)` y devolución de `ContactState`. Si falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL`, devuelve `error/send` y lo registra con `console.error`.
7. Crear `components/about/contact-form.tsx` (cliente) con `useActionState(sendContact)`: inputs controlados, `shake` en cliente si falta un campo, estado pendiente, terminal de éxito y terminal de error. "ENVIAR OTRO MENSAJE" limpia el formulario; "REINTENTAR" vuelve al formulario con los valores. Sustituir el placeholder del paso 4.
8. Navbar (`components/nav.tsx`): añadir "Acerca de" tras "Salón" en escritorio y panel móvil, activo con `pathname === "/acerca"`.
9. Sustituir `style={{}}` inline por clases (salvo `transitionDelay`/`animationDelay` dinámicos). Verificar `npm run lint` y `npm run build`.

Antes de los pasos 4 y 6 se leen las guías de `node_modules/next/dist/docs/` sobre rutas, `metadata`, Server Actions/`useActionState` y Cache Components, como exige `AGENTS.md`.

## Criterios de aceptación

- [ ] `npm run build` y `npm run lint` terminan sin errores.
- [ ] `/acerca` muestra "ACERCA DE ARCADE VAULT", la misión, los tres highlights, el divisor y "CONTÁCTANOS" con los mismos textos, colores y disposición que la plantilla.
- [ ] Enviar con algún campo vacío sacude el formulario y no llama a la Server Action.
- [ ] Mientras se envía, el botón está deshabilitado y muestra "▶  ENVIANDO…".
- [ ] Con env configurado, enviar nombre "kai" llega un correo a `CONTACT_TO_EMAIL` con asunto "[Arcade Vault] Mensaje de kai" y "Responder" va al correo del formulario.
- [ ] Tras enviar, la terminal muestra "> MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, KAI._".
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario vacío.
- [ ] Sin `RESEND_API_KEY` o con una clave inválida, aparece la terminal de error con líneas `[ERR]`, y "REINTENTAR" vuelve al formulario con los valores intactos.
- [ ] Un mensaje de más de 2000 caracteres o un correo sin dominio devuelve la terminal de error sin enviar correo.
- [ ] Rellenar el honeypot (vía DevTools) muestra éxito y no envía correo.
- [ ] Un mensaje con `<script>` llega escapado en el correo HTML.
- [ ] La navbar muestra "Acerca de" tras "Salón", resaltado solo en `/acerca`, también en el panel móvil (≤ 840px).
- [ ] Con `prefers-reduced-motion: reduce` el contenido se ve sin animación y los píxeles del divisor no parpadean.
- [ ] `RESEND_API_KEY` no aparece en el bundle cliente ni en el repo.
- [ ] La consola no muestra errores de hidratación en `/acerca`.

## Decisiones

- **Sí:** ruta `/acerca`. Coherente con `/acceso`, `/salon` y `/biblioteca`.
- **No:** `/about` ni `/acerca-de`. Rompe la convención o es más larga sin aportar.
- **Sí:** Server Action con `useActionState`. Nativo de Next 16, sin endpoint público extra y la clave queda en servidor.
- **No:** Route Handler `POST /api/contacto`. Solo valdría si otro cliente consumiera el endpoint.
- **Sí:** destinatario y remitente en variables de entorno, con `onboarding@resend.dev` por defecto. Funciona sin dominio verificado y se cambia sin tocar código.
- **Sí:** `replyTo` con el correo del usuario. El equipo responde directamente.
- **Sí:** terminal de error en rojo con "REINTENTAR". Mantiene la estética y no se pierde el mensaje.
- **No:** línea de error bajo el botón. Rompe el lenguaje visual de la plantilla.
- **Sí:** honeypot y límites de longitud. Frenan bots básicos sin dependencias.
- **No:** rate limit por IP en memoria. Se pierde en cada instancia y deploy.
- **Sí:** correo en texto + HTML simple escapado. Solo depende de `resend`.
- **No:** React Email. Más dependencias para un correo interno.
- **No:** correo de confirmación al usuario. Con `onboarding@resend.dev` Resend solo entrega a tu propio correo.
- **Sí:** link "Acerca de" en la navbar tras "Salón". Igual que `nav.jsx` de la plantilla.
- **Sí:** reutilizar `components/home/reveal.tsx` y la clase `.field` existente. Evita duplicar código y CSS.
- **Sí:** página server component y solo el formulario es cliente. Minimiza JS.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Con `onboarding@resend.dev` Resend solo entrega al correo de la cuenta | `CONTACT_TO_EMAIL` debe ser ese correo hasta verificar un dominio. Se documenta en `.env.example`. |
| Falta de variables de entorno en producción | La acción devuelve `error/send` y registra el motivo. La página no rompe. |
| Inyección HTML en el correo | Escapar nombre, correo y mensaje antes de construir el `html`. |
| Abuso del formulario por bots | Honeypot y límites. Rate limit queda para otra spec si hace falta. |
| Clases de la plantilla que chocan con `globals.css` (`.field`, `blink`) | Portar solo las que faltan y comparar antes las comunes. |
| `cacheComponents` y Server Actions en Next 16 | Leer la guía antes del paso 6. La página no usa APIs dinámicas. |

## Qué **no** entra en esta spec

- Correo de confirmación al usuario.
- Dominio propio en Resend.
- React Email.
- Rate limit, CAPTCHA o guardar mensajes.
- Tests.

Cada uno, si llega, va en su propia spec.
