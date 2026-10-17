import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

test('builds the agent bundle from a filesystem path containing spaces', () => {
  const root = mkdtempSync(join(fileURLToPath(new URL('..', import.meta.url)), '.bundle test '));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'agent-pack', 'skills', 'example'), { recursive: true });
    mkdirSync(join(root, 'agent-pack', 'config'));
    copyFileSync(new URL('./build-skills.mjs', import.meta.url), join(root, 'scripts', 'build-skills.mjs'));
    writeFileSync(join(root, 'agent-pack', 'skills', 'example', 'SKILL.md'), '---\nname: Example\ndescription: Fixture\n---\nExample body\n');
    for (const name of ['expert_council', 'scoring', 'fox_ecosystem', 'source_feeds']) {
      writeFileSync(join(root, 'agent-pack', 'config', `${name}.json`), JSON.stringify(name === 'expert_council' ? { members: [] } : {}));
    }
    execFileSync(process.execPath, [join(root, 'scripts', 'build-skills.mjs')], { cwd: root });
    const bundle = JSON.parse(readFileSync(join(root, 'lib', 'generated', 'agent-pack.json'), 'utf8'));
    assert.equal(bundle.skills.length, 1);
    assert.equal(bundle.skills[0].name, 'Example');
    assert.equal(bundle.skills[0].body, 'Example body');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
