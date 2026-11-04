'use strict';
// Static-analysis evidence generator.
// Runs ESLint (with eslint-plugin-security for the API) and writes:
//   reports/eslint-report.json   machine readable results
//   reports/eslint-report.txt    human readable results
//   reports/static-analysis-summary.md   short summary for the README / CI summary
// Exit code is 1 when ESLint reports any *error* (warnings do not fail the build).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const eslintBin = require.resolve('eslint/bin/eslint.js', { paths: [root] });
const run = (args) => spawnSync(process.execPath, [eslintBin, '.', ...args], { cwd: root, encoding: 'utf8' });

const jsonRun = run(['-f', 'json', '-o', path.join(reportsDir, 'eslint-report.json')]);
run(['-f', 'stylish', '-o', path.join(reportsDir, 'eslint-report.txt')]);

if (!fs.existsSync(path.join(reportsDir, 'eslint-report.json'))) {
  console.error(jsonRun.stderr || 'ESLint did not produce a report.');
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(path.join(reportsDir, 'eslint-report.json'), 'utf8'));
let errors = 0;
let warnings = 0;
const byRule = {};
for (const file of results) {
  errors += file.errorCount;
  warnings += file.warningCount;
  for (const m of file.messages) {
    const rule = m.ruleId || 'parse-error';
    byRule[rule] = (byRule[rule] || 0) + 1;
  }
}

const topRules = Object.entries(byRule)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([rule, n]) => `| \`${rule}\` | ${n} |`)
  .join('\n');

const summary = [
  `# Static analysis summary (${path.basename(root)})`,
  '',
  `Tool: ESLint ${require(path.join(path.dirname(eslintBin), '..', 'package.json')).version}`,
  `Generated: ${new Date().toISOString()}`,
  '',
  `| Files analysed | Errors | Warnings |`,
  `|---|---|---|`,
  `| ${results.length} | ${errors} | ${warnings} |`,
  '',
  topRules ? '| Rule | Occurrences |\n|---|---|\n' + topRules : 'No findings.',
  '',
].join('\n');

fs.writeFileSync(path.join(reportsDir, 'static-analysis-summary.md'), summary);
console.log(summary);

if (errors > 0) {
  console.error(`Static analysis failed: ${errors} error(s).`);
  process.exit(1);
}
