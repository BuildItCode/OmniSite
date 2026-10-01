/* Static checks for the direct-file entry point and shared navigation contract. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const pages = ['index.html', 'docs.html'].map(name => ({ name, html: read(name) }));

for (const { name, html } of pages) {
  assert.doesNotMatch(html, /<script\b[^>]*type=["']module["']/i, `${name} must load classic scripts for file:// support`);
  for (const [, src] of html.matchAll(/<script\b[^>]*src="([^"]+)"/g)) {
    assert.ok(!/^(?:https?:)?\/\//.test(src), `${name}: runtime scripts must be local`);
    const script = read(src.split('?')[0]);
    new vm.Script(script, { filename: src });
    assert.doesNotMatch(script, /\bimport\s*\(/, `${src} must not request modules at runtime`);
  }
  assert.match(html, /src="site\.js\?/, `${name} must use the shared navigation behavior`);
}
assert.match(pages[0].html, /src="assets\/harness3d\.bundle\.js\?/, 'Home must use the built 3D bundle');

const navigation = html => {
  const header = html.match(/<header class="header">([\s\S]*?)<\/header>/)[1];
  return [...header.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(([, href, label]) => ({
    href: href.startsWith('#') ? 'index.html' + href : href,
    label: label.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  }));
};
assert.deepEqual(navigation(pages[0].html), navigation(pages[1].html), 'Home and Docs must have matching navigation labels, order, and destinations');
const fontLink = html => html.match(/<link href="(https:\/\/fonts\.googleapis\.com[^\"]+)"/)[1];
assert.equal(fontLink(pages[0].html), fontLink(pages[1].html), 'Both pages must load the same font weights');
console.log('Direct-file script checks and shared navigation checks passed.');
