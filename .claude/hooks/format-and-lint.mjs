import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const projectDir = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const raw = input?.tool_input?.file_path;
if (!raw) process.exit(0);

const file = path.resolve(projectDir, raw);
const rel = path.relative(projectDir, file);

if (rel.startsWith("..") || path.isAbsolute(rel) || !existsSync(file)) process.exit(0);
if (/(^|[\\/])(node_modules|\.next|\.git)([\\/]|$)/.test(rel)) process.exit(0);

const bin = (name) => path.join(projectDir, "node_modules", ".bin", name);
const run = (cmd, args) =>
  spawnSync([cmd, ...args].map((a) => `"${a}"`).join(" "), {
    cwd: projectDir,
    shell: true,
    encoding: "utf8",
  });

const errors = [];

const prettier = run(bin("prettier"), ["--write", "--ignore-unknown", file]);
if (prettier.status !== 0) {
  errors.push(`Prettier falló en ${rel}:\n${prettier.stderr || prettier.stdout}`);
}

if (/\.(jsx?|tsx?|mjs|cjs)$/.test(file)) {
  const eslint = run(bin("eslint"), ["--fix", "--max-warnings", "0", file]);
  if (eslint.status !== 0) {
    errors.push(`ESLint encontró errores en ${rel}:\n${eslint.stdout}${eslint.stderr}`);
  }
}

if (errors.length) {
  process.stderr.write(errors.join("\n") + "\n");
  process.exit(2);
}
