// Compiles agent-pack skills + config into a typed JSON bundle the app can import at build time.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const skillsDir = join(root, 'agent-pack', 'skills');
const parseFrontmatter = (src) => {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: m[2] };
};
const skills = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(skillsDir, d.name, 'SKILL.md')))
  .map((d) => {
    const { meta, body } = parseFrontmatter(readFileSync(join(skillsDir, d.name, 'SKILL.md'), 'utf8'));
    return { id: d.name, name: meta.name || d.name, description: meta.description || '', body: body.trim() };
  })
  .sort((a, b) => a.id.localeCompare(b.id));
const read = (p) => JSON.parse(readFileSync(join(root, 'agent-pack', p), 'utf8'));
const out = {
  generatedAt: new Date().toISOString(),
  skills,
  council: read('config/expert_council.json'),
  scoring: read('config/scoring.json'),
  ecosystem: read('config/fox_ecosystem.json'),
  feeds: read('config/source_feeds.json'),
};
mkdirSync(join(root, 'lib', 'generated'), { recursive: true });
writeFileSync(join(root, 'lib', 'generated', 'agent-pack.json'), JSON.stringify(out, null, 2));
console.log(`agent-pack bundle: ${skills.length} skills, ${out.council.members.length} council cells`);
