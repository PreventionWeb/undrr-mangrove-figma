'use strict';
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const hook = path.resolve(__dirname, '../githooks/commit-msg');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-figma-hooks-'));
try {
  const messageFile = path.join(directory, 'COMMIT_EDITMSG');
  const messages = [
    'chore: update tooling\n\nCo-authored-by: Claude <noreply@anthropic.com>\n',
    'fix(importer): preserve identities\n\nCo-authored-by: Codex <codex@openai.com>\n',
    'docs: update attribution policy\n\nAI-Contributed-by: Other assistant\nGenerated with Claude and Codex\nClaude-Session: example\n',
    'feat!: change adapter\n\nCo-authored-by: Human Contributor <human@example.com>\nCo-authored-by: Copilot <copilot@example.com>\n',
    '# Git comment\n\nchore: valid subject\n\n# ------------------------ >8 ------------------------\nignored text\n',
    'fixup! chore: update tooling\n',
  ];
  for (const message of messages) {
    fs.writeFileSync(messageFile, message);
    const result = spawnSync(hook, [messageFile], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.error?.message);
    assert.equal(fs.readFileSync(messageFile, 'utf8'), message, 'Attribution must be preserved unchanged.');
  }
  for (const message of ['', 'Update tooling\n\nCo-authored-by: Claude <noreply@anthropic.com>\n']) {
    fs.writeFileSync(messageFile, message);
    const result = spawnSync(hook, [messageFile], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Conventional Commit/);
  }
  console.log('Commit hook accepts human/AI attribution unchanged and rejects invalid subjects.');
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
