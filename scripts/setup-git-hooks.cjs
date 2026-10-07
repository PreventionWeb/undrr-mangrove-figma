#!/usr/bin/env node
'use strict';
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const top = spawnSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: root, encoding: 'utf8',
});
// Do not configure a parent repository when installed as a dependency.
if (top.status !== 0 || fs.realpathSync(top.stdout.trim()) !== fs.realpathSync(root)) {
  process.exit(0);
}
const install = spawnSync('git', ['config', '--local', 'core.hooksPath', 'githooks'], {
  cwd: root, stdio: 'inherit',
});
if (install.error) throw install.error;
if (install.status !== 0) process.exit(install.status || 1);
console.log('Git hooks installed; AI contribution attribution is allowed.');
