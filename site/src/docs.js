// Parsers that pull numbers and lists out of the repo's own text files at build time,
// so the page quotes README.md, REPORT.md and ci.yml instead of retyping them.
// agent.check.mjs asserts what they return.

// "**Verdict.** Functional; not pre-registered. ..." in README.md: the words before the first full stop.
export function parseVerdict(readme) {
  return readme.match(/\*\*Verdict\.\*\* ([^.]+)\./)[1].replace(/\s+/g, ' ');
}

// Bullet list under "## Threats to validity" in REPORT.md, one item per line.
export function parseThreats(report) {
  const block = report.split('## Threats to validity')[1].split('\n## ')[0];
  return block.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim()
    // Machine names are internal; the threat itself is quoted unchanged.
    .replace(/the Muse VM/g, 'a CPU VM').replace(/the assigned BlackBoxV2 node/g, 'the assigned test machine'));
}

// "## Results (measured 2026-11-05, <machine>, Python 3.12)"
export function parseRecorded(readme) {
  const [, date, python] = readme.match(/measured (\d{4}-\d{2}-\d{2}), [^,]+, Python ([\d.]+)/);
  return { date, python };
}

// Numbered list under "## v1.1 backlog" in REPORT.md, up to the next section.
export function parseBacklog(report) {
  const block = report.split('## v1.1 backlog')[1].split('\n## ')[0];
  return block.split(/\n(?=\d+\. )/).slice(1).map((item) => {
    const [, n, text] = item.match(/^(\d+)\. ([\s\S]*)/);
    const flat = text.replace(/\s+/g, ' ').trim();
    const [title, ...rest] = flat.split(': ');
    return { n: Number(n), title, detail: rest.join(': ') };
  });
}

// Step names, run lines and the Python matrix from .github/workflows/ci.yml.
export function parseCi(yml) {
  const versions = JSON.parse(yml.match(/python-version: (\[.*\])/)[1]);
  const steps = [];
  for (const m of yml.matchAll(/- name: (.+)\n\s+run: (\|\n((?:\s{10}.+\n?)+)|.+)/g)) {
    const run = m[3] ? m[3].split('\n').map((s) => s.trim()).filter(Boolean) : [m[2].trim()];
    steps.push({ name: m[1].trim(), run });
  }
  return { versions, steps };
}

export const countTests = (sources) => sources.reduce((a, s) => a + (s.match(/^\s+def test_/gm) || []).length, 0);
