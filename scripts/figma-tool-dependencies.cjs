'use strict';
const fs = require('node:fs');
const path = require('node:path');
const TOOL_ROOT = fs.realpathSync(path.resolve(__dirname, '..'));
const ALLOWED = new Set([
  '@babel/parser',
  'storybook/internal/csf',
  'storybook/internal/csf-tools',
  'terser',
]);
function requireToolDependency(name) {
  if (!ALLOWED.has(name)) throw new Error(`Unsupported toolkit dependency: ${name}`);
  const expectedModules = path.join(TOOL_ROOT, 'node_modules');
  const modules = fs.realpathSync(expectedModules);
  if (modules !== expectedModules)
    throw new Error('Toolkit node_modules must be local; external dependency-directory symlinks are refused');
  const filename = require.resolve(name, { paths: [TOOL_ROOT] });
  const actual = fs.realpathSync(filename);
  if (!actual.startsWith(modules + path.sep))
    throw new Error(`Toolkit dependency ${name} must be installed in this repository; refusing ${actual}`);
  return require(actual);
}
module.exports = { requireToolDependency };
