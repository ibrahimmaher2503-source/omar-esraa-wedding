import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

test('both response forms share exactly one guest-name field', async () => {
  const source = await readFile(new URL('../src/Responses.tsx', import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 } }).outputText;
  const temporary = new URL(`.responses-${randomUUID()}.mjs`, import.meta.url);
  try {
    await writeFile(temporary, compiled);
    const { GuestResponses, WishSent } = await import(temporary.href);
    const html = renderToStaticMarkup(React.createElement(GuestResponses));
    assert.equal((html.match(/<input\b[^>]*\bname="name"/g) || []).length, 1);
    assert.equal((html.match(/<form\b/g) || []).length, 2);
    assert.match(html, /id="guest-name"[^>]*form="attendance-form"[^>]*required/);
    assert.match(html, /href="#guest-name">Add your name above/);
    const confirmation = renderToStaticMarkup(React.createElement(WishSent, { name: 'Guest <script>' }));
    assert.doesNotMatch(confirmation, /<form\b|<textarea\b|Send Your Wishes/);
    assert.match(confirmation, /role="status"/);
    assert.match(confirmation, /Thank you, Guest &lt;script&gt;/);
    assert.match(confirmation, /Your message has been sent to Omar &amp; Esraa/);
  } finally { await unlink(temporary).catch(() => {}); }
});
