'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const TOOL = path.resolve(__dirname, '../../..');
const { getMangroveRoot } = require('../../../scripts/mangrove-source.cjs');
const SOURCE = getMangroveRoot();
const expected = require('./construction-compatibility.json');
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
function cli(source) {
  const env = { ...process.env };
  delete env.NODE_PATH;
  if (source === null) delete env.MANGROVE_SOURCE_ROOT;
  else env.MANGROVE_SOURCE_ROOT = source;
  return cp.spawnSync(process.execPath, ['scripts/build-figma-tokens.cjs', '--stdout'], {
    cwd: TOOL, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
}
const raw = fs.readFileSync(path.join(TOOL, 'examples/figma-plugin/mangrove-variables.json'));
assert.equal(sha(raw), expected.normalDTO.sha256);
const doc = JSON.parse(raw);
assert.equal(doc.components.families.length, 32);
assert.equal(doc.components.families.reduce((n, f) => n + f.variants.length, 0), 383);
assert.equal(doc.variables.length, 520);
assert.equal(doc.styles.text.length, 102);
assert.equal(doc.styles.effect.length, 8);
assert.equal(sha(require('../../../scripts/build-figma-plugin.cjs').renderPlugin()), expected.runtime.sha256);
const noSource = cli(null);
assert.equal(noSource.status, 1);
assert.match(noSource.stderr, /Set MANGROVE_SOURCE_ROOT/);
assert.equal(noSource.stdout, '');
const absent = cli(path.join(os.tmpdir(), 'mangrove-source-does-not-exist'));
assert.equal(absent.status, 1);
assert.match(absent.stderr, /Missing Mangrove source/);
assert.equal(absent.stdout, '');
// Tool-owned precision remains guarded; historical packet citation is explicitly mapped.
const vm = require('node:vm');
const { createRequire } = require('node:module');
const probeFile = path.join(TOOL, 'scripts/figma-form-action-probe.cjs');
for (const corrupt of [text => text.replace('n * 10000', 'n * 1000'), text => '\n' + text]) {
  const result = { exports: {} };
  const localRequire = createRequire(probeFile);
  vm.runInNewContext(fs.readFileSync(probeFile, 'utf8'), {
    module: result, exports: result.exports, __dirname: path.dirname(probeFile),
    require: name => name === 'fs' ? { ...fs, readFileSync: (file, ...args) => {
      const text = fs.readFileSync(file, ...args);
      return file === path.join(TOOL, 'scripts/figma-maintenance-foundations.cjs') ? corrupt(text) : text;
    } } : localRequire(name),
  }, { filename: probeFile });
  assert.throws(() => result.exports.buildFormActionCapability({ root: SOURCE, modes: doc.modes, variables: doc.variables, styles: doc.styles }), /precision|source mapping|Source contract/);
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-kit-migration-'));
try {
  // An explicit source-footprint fixture has no upstream Figma scripts, runtime or outputs.
  const sourceOnly = path.join(temp, 'source-only');
  fs.mkdirSync(path.join(sourceOnly, 'scripts'), { recursive: true });
  for (const directory of ['tokens', 'stories'])
    fs.symlinkSync(path.join(SOURCE, directory), path.join(sourceOnly, directory), 'dir');
  fs.symlinkSync(path.join(SOURCE, 'scripts/build-tokens.cjs'), path.join(sourceOnly, 'scripts/build-tokens.cjs'));
  assert(!fs.existsSync(path.join(sourceOnly, 'examples')));
  assert(!fs.existsSync(path.join(sourceOnly, 'scripts/figma-component-recipes.cjs')));
  const isolated = cli(sourceOnly);
  assert.equal(isolated.status, 0, isolated.stderr);
  assert.equal(sha(isolated.stdout), expected.normalDTO.sha256);
  assert.equal(isolated.stdout, raw.toString());
  const wrong = path.join(temp, 'wrong-engine');
  fs.mkdirSync(path.join(wrong, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(wrong, 'tokens'));
  fs.mkdirSync(path.join(wrong, 'stories/assets/scss'), { recursive: true });
  fs.writeFileSync(path.join(wrong, 'tokens/mangrove.yaml'), '# invalid engine fixture\n');
  fs.writeFileSync(path.join(wrong, 'stories/assets/scss/_control-tokens.scss'), '');
  fs.writeFileSync(path.join(wrong, 'scripts/build-tokens.cjs'), 'module.exports = {};\n');
  const wrongEngine = cli(wrong);
  assert.equal(wrongEngine.status, 1);
  assert.match(wrongEngine.stderr, /does not export loadSources/);
  assert.equal(wrongEngine.stdout, '');
  const dependencies = path.join(temp, 'foreign-tool');
  fs.mkdirSync(path.join(dependencies, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(TOOL, 'scripts/figma-tool-dependencies.cjs'), path.join(dependencies, 'scripts/figma-tool-dependencies.cjs'));
  fs.symlinkSync(path.join(TOOL, 'node_modules'), path.join(dependencies, 'node_modules'), 'dir');
  const foreign = require(path.join(dependencies, 'scripts/figma-tool-dependencies.cjs'));
  assert.throws(() => foreign.requireToolDependency('terser'), /external dependency-directory symlinks/);
  const local = require('../../../scripts/figma-tool-dependencies.cjs');
  assert.throws(() => local.requireToolDependency('not-a-tool-module'), /Unsupported toolkit dependency/);
  for (const name of ['@babel/parser', 'storybook/internal/csf', 'storybook/internal/csf-tools', 'terser'])
    assert(local.requireToolDependency(name));
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log('PASS normal32/383 DTO/runtime pins; missing/foreign source and engine refusals; source-only footprint exact; toolkit-local dependencies only');
