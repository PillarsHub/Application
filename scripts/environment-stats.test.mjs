import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../src/pages/account/environments/environmentStats.worker.js', import.meta.url), 'utf8');

async function loadStats(now, rows) {
  let requestedDate;
  let result;
  const self = { postMessage: message => { result = message; } };
  runInNewContext(source, {
    self, URL,
    fetch: async (url, options) => {
      assert.equal(options.headers.Authorization, 'test-token');
      requestedDate = new Date(url.searchParams.get('date'));
      return {
        ok: true,
        json: async () => rows.filter(row => new Date(row.date) >= requestedDate),
      };
    },
  });
  await self.onmessage({ data: { baseUrl: 'https://example.test', token: 'test-token', now: now.getTime() } });
  assert.equal(result.error, undefined);
  return { requestedDate, stats: result.stats };
}

function row(date, callCount, averageResponseTime = 100) {
  return { date: date.toISOString(), environmentId: 1, callCount, averageResponseTime };
}

test('early in the month, fetch the first chart day at midnight and exclude prior-month requests from period totals', async () => {
  const now = new Date(2026, 10, 3, 12);
  const firstDay = new Date(2026, 9, 15);
  const { requestedDate, stats } = await loadStats(now, [
    row(new Date(2026, 9, 14, 23, 59), 999),
    row(firstDay, 7, 999),
    row(new Date(2026, 9, 31, 18), 11, 999),
    row(new Date(2026, 10, 1, 18), 10, 100),
    row(new Date(2026, 10, 3, 11), 20, 200),
  ]);
  assert.equal(requestedDate.toISOString(), firstDay.toISOString());
  assert.equal(stats.dailyCounts.length, 20);
  assert.equal(stats.dailyCounts[0].count, 7);
  assert.equal(stats.dailyCounts[16].count, 11);
  assert.equal(stats.dailyCounts[17].count, 10);
  assert.equal(stats.dailyCounts[19].count, 20);
  assert.equal(stats.totalRequests, 30);
  assert.equal(stats.environments[0].callCount, 30);
  assert.equal(stats.environments[0].averageResponseTime, 150);
});

test('late in the month, fetch the full month even when the chart starts later', async () => {
  const now = new Date(2026, 10, 25, 12);
  const { requestedDate, stats } = await loadStats(now, [
    row(new Date(2026, 9, 31, 23, 59), 999),
    row(new Date(2026, 10, 1), 10),
    row(new Date(2026, 10, 6), 20),
    row(new Date(2026, 10, 25, 11), 30),
  ]);
  assert.equal(requestedDate.toISOString(), new Date(2026, 10, 1).toISOString());
  assert.equal(stats.totalRequests, 60);
  assert.equal(stats.dailyCounts[0].count, 20);
  assert.equal(stats.dailyCounts[19].count, 30);
  assert.equal(stats.dailyCounts.reduce((total, day) => total + day.count, 0), 50);
});

test('on the first of the month, keep yesterday in both charts across a year boundary', async () => {
  const now = new Date(2027, 0, 1, 12);
  const { requestedDate, stats } = await loadStats(now, [
    row(new Date(2026, 11, 31, 18), 7, 100),
    row(new Date(2027, 0, 1, 11), 10, 200),
  ]);
  assert.equal(requestedDate.toISOString(), new Date(2026, 11, 13).toISOString());
  assert.equal(stats.totalRequests, 10);
  assert.equal(stats.dailyCounts[18].count, 7);
  assert.equal(stats.dailyCounts[19].count, 10);
  assert.equal(stats.responseTimes.length, 2);
});
