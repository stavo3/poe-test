'use strict';
// "Build" step for the Node.js API. The backend is interpreted JavaScript, so the
// build verifies that every source file parses (node --check). A syntax error
// anywhere in src/ makes `npm run build` (and therefore the CI pipeline) fail.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SRC = path.join(__dirname, '..', 'src');

function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collect(full);
    return entry.name.endsWith('.js') ? [full] : [];
  });
}

const files = collect(SRC);
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed += 1;
    console.error(`FAILED: ${path.relative(process.cwd(), file)}\n${result.stderr}`);
  }
}

if (failed) {
  console.error(`Build failed: ${failed} file(s) contain syntax errors.`);
  process.exit(1);
}
console.log(`Build OK: ${files.length} source files verified.`);
