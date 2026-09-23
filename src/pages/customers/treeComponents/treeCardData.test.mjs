import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Buffer } from 'node:buffer';
import { build } from 'esbuild';
import { parse } from 'graphql';

const bundle = await build({
  stdin: {
    contents: `export * from './treeCardData.js'; export { setPost } from 'test-post';`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url))
  },
  bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'mock-post', setup(builder) {
    builder.onResolve({ filter: /(?:hooks\/usePost\.js|^test-post)$/ }, () => ({ path: 'post', namespace: 'test' }));
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({
      contents: 'let handler; export const setPost = value => { handler = value; }; export const Post = (...args) => handler(...args);'
    }));
  } }]
});
const { loadTreeCardNode, treeCardCustomerFields, setPost } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const input = { treeId: '7', nodeId: '42', date: '2026-01-01' };
const node = { nodeId: '42', customer: { fullName: 'Test Customer', cards: [], widgets: [] } };
const response = node => ({ data: { trees: [{ nodes: [node] }] } });

test('popup shares pending and cached requests, using the tree card and selected date', async () => {
  const requests = [];
  setPost((url, body, success) => requests.push({ url, body, success }));
  const cache = new Map();
  const first = loadTreeCardNode(input, cache);
  assert.equal(loadTreeCardNode(input, cache), first);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/graphql');
  assert.deepEqual(requests[0].body.variables, { treeIds: ['7'], nodeIds: ['42'], cardIds: ['Tree-7'], date: input.date });
  assert.doesNotThrow(() => parse(requests[0].body.query));
  requests[0].success(response(node));
  assert.equal(await first, node);
  assert.equal(await loadTreeCardNode(input, cache), node);
  assert.equal(requests.length, 1);
});

test('new context caches do not reuse data from another tree, date or configuration', async () => {
  const requests = [];
  setPost((url, body, success) => { requests.push(body.variables); success(response(node)); });
  for (const context of [input, { ...input, date: '2026-02-01' }, { ...input, treeId: '8' }, input]) {
    await loadTreeCardNode(context, new Map());
  }
  assert.equal(requests.length, 4);
  assert.equal(requests[1].date, '2026-02-01');
  assert.deepEqual(requests[2].cardIds, ['Tree-8']);
});

test('network, GraphQL and missing-customer failures are retryable', async () => {
  for (const failure of [
    (success, error) => error('offline'),
    success => success({ errors: [{ message: 'denied' }] }),
    success => success(response({ nodeId: '42' }))
  ]) {
    const cache = new Map();
    setPost((url, body, success, error) => failure(success, error));
    await assert.rejects(loadTreeCardNode(input, cache), /Unable to load/);
    assert.equal(cache.size, 0);
    setPost((url, body, success) => success(response(node)));
    assert.equal(await loadTreeCardNode(input, cache), node);
  }
});

test('shared customer fields support both existing tree query date variables', () => {
  for (const date of ['$date', '$periodDate']) {
    const query = parse(`query($cardIds: [String]!, ${date}: Date) { customer { ${treeCardCustomerFields(date)} } }`);
    const fields = query.definitions[0].selectionSet.selections[0].selectionSet.selections;
    const cards = fields.find(field => field.name.value === 'cards');
    assert.equal(cards.arguments.find(arg => arg.name.value === 'date').value.name.value, date.slice(1));
    const widgetFields = fields.find(field => field.name.value === 'widgets').selectionSet.selections.map(field => field.name.value);
    for (const required of ['id', 'settings', 'css', 'panes', 'backgroundColor', 'headerColor']) assert.ok(widgetFields.includes(required));
  }
});
