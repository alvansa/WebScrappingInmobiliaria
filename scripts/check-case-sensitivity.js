#!/usr/bin/env node
/**
 * Detecta requires/imports cuyo casing no coincide exactamente con el nombre
 * real del archivo en git (case-sensitive), aunque en Mac/Windows "funcionen"
 * porque el filesystem por defecto ahí es case-insensitive.
 *
 * Por qué importa: el .asar que arma electron-builder SÍ es case-sensitive
 * en cualquier SO, así que un mismatch que nunca da error en `npm start`
 * revienta recién al abrir la app empaquetada (visto en un caso real: carpeta
 * "Electron" vs "electron", y "CompleteExcelInfo.js" vs "completeExcelInfo.js").
 *
 * Se corre automáticamente antes de cada `make*` (ver package.json) y en CI.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
process.chdir(repoRoot);

const files = execSync('git ls-files', { maxBuffer: 1024 * 1024 * 20 })
  .toString()
  .split('\n')
  .filter(Boolean);
const trackedSet = new Set(files);
const lowerMap = new Map();
for (const f of files) lowerMap.set(f.toLowerCase(), f);

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const importsMap = pkg.imports || {};

function resolveAlias(spec) {
  for (const [pattern, target] of Object.entries(importsMap)) {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1);
      if (spec.startsWith(prefix)) {
        const rest = spec.slice(prefix.length);
        const targetPrefix = target.slice(0, -1).replace(/^\.\//, '');
        return targetPrefix + rest;
      }
    } else if (pattern === spec) {
      return target.replace(/^\.\//, '');
    }
  }
  return null;
}

const jsFiles = files.filter(
  (f) => /\.(js|mjs|cjs)$/.test(f) && !f.startsWith('node_modules/') && !f.startsWith('out/')
);
const requireRe = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
const importRe = /from\s+['"]([^'"]+)['"]/g;

const mismatches = [];

for (const file of jsFiles) {
  const dir = path.dirname(file);
  const content = fs.readFileSync(file, 'utf8');
  const specs = new Set();
  let m;
  while ((m = requireRe.exec(content))) specs.add(m[1]);
  while ((m = importRe.exec(content))) specs.add(m[1]);

  for (const spec of specs) {
    let resolvedBase = null;
    if (spec.startsWith('./') || spec.startsWith('../')) {
      resolvedBase = path.normalize(path.join(dir, spec)).split(path.sep).join('/');
    } else if (spec.startsWith('#')) {
      resolvedBase = resolveAlias(spec);
    } else {
      continue; // módulo de node_modules, no aplica
    }
    if (!resolvedBase) continue;

    const candidates = [resolvedBase];
    if (!/\.[a-zA-Z0-9]+$/.test(resolvedBase)) {
      candidates.push(resolvedBase + '.js');
      candidates.push(resolvedBase + '/index.js');
    }

    const foundExact = candidates.some((c) => trackedSet.has(c));
    if (foundExact) continue;

    let foundCI = null;
    for (const c of candidates) {
      const actual = lowerMap.get(c.toLowerCase());
      if (actual) {
        foundCI = { attempted: c, actual };
        break;
      }
    }
    if (foundCI) {
      mismatches.push({ file, spec, ...foundCI });
    }
  }
}

if (mismatches.length === 0) {
  console.log('✔ Sin mismatches de mayúsculas/minúsculas en requires/imports.');
  process.exit(0);
}

console.error(`✘ Se encontraron ${mismatches.length} mismatch(es) de mayúsculas/minúsculas:\n`);
for (const mm of mismatches) {
  console.error(`${mm.file}\n  require('${mm.spec}')\n  -> intenta: ${mm.attempted}\n  -> real:    ${mm.actual}\n`);
}
process.exit(1);
