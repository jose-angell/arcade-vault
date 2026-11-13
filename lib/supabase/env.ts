function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Defínela en .env (ver .env.template).`);
  }
  return value;
}
// Next.js solo sustituye NEXT_PUBLIC_* en el bundle del navegador cuando se
// accede con el nombre literal (process.env.NEXT_PUBLIC_X), no con process.env[name].
export const SUPABASE_URL: string = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);
export const SUPABASE_PUBLISHABLE_KEY: string = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
