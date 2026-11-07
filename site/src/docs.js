// Parsers that pull numbers and lists out of the repo's own text files at build time,
// so the page quotes README.md, ROADMAP.md and ci.yml instead of retyping them.
// agent.check.mjs asserts what they return.

// "## Grade" block of level-3-deep/README.md: "- Minus 600: seeded, synthetic errors ..."
export function parseGrade(readme) {
  const block = readme.split('## Grade')[1].split('\n## ')[0];
  const [, grade, outOf] = block.match(/Grade: ([\d,]+) of ([\d,]+)/);
  const num = (s) => Number(s.replace(/,/g, ''));
  const deductions = block.split('\n- ').slice(1).map((item) => {
    const [, pts, text] = item.match(/^Minus ([\d,]+): ([\s\S]*)/);
    const clean = text.split('\n\n')[0].replace(/\s+/g, ' ').trim()
      // Machine names are internal; the deduction itself is quoted unchanged.
      .replace(/the Muse VM/g, 'a CPU VM').replace(/the assigned BlackBoxV2 node/g, 'the assigned test machine');
    return { points: num(pts), text: clean };
  });
  return { grade: num(grade), outOf: num(outOf), deductions, total: num(block.match(/Total deductions: ([\d,]+)/)[1]) };
}

// "## Results (measured 2026-11-05, <machine>, Python 3.12)"
export function parseRecorded(readme) {
  const [, date, python] = readme.match(/measured (\d{4}-\d{2}-\d{2}), [^,]+, Python ([\d.]+)/);
  return { date, python };
}

// Numbered list under "## v1.1 backlog" in ROADMAP.md.
export function parseBacklog(roadmap) {
  const block = roadmap.split('## v1.1 backlog')[1];
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
