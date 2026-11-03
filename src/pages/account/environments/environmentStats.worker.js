/* eslint-env worker */

const DAILY_CHART_DAYS = 20;

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function summarize(rows, now, beginningOfMonth) {
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
  const days = new Map();
  for (let offset = DAILY_CHART_DAYS - 1; offset >= 0; offset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - offset);
    days.set(dayKey(date), { date: formatter.format(date), count: 0 });
  }

  const environments = new Map();
  const responseTimes = new Map();
  let totalRequests = 0;

  // Aggregate once instead of repeatedly scanning and formatting the raw data.
  for (const row of rows) {
    const date = new Date(row.date);
    if (date >= beginningOfMonth) {
      let environment = environments.get(row.environmentId);
      if (!environment) {
        environment = { environmentId: row.environmentId, sumResponseTime: 0, count: 0, callCount: 0 };
        environments.set(row.environmentId, environment);
      }
      environment.sumResponseTime += row.averageResponseTime;
      environment.count++;
      environment.callCount += row.callCount;
      totalRequests += row.callCount;
    }

    if (date >= oneDayAgo) {
      let responseTime = responseTimes.get(row.date);
      if (!responseTime) {
        responseTime = { timestamp: date.getTime(), sum: 0, count: 0 };
        responseTimes.set(row.date, responseTime);
      }
      responseTime.sum += row.averageResponseTime;
      responseTime.count++;
    }

    const day = days.get(dayKey(date));
    if (day) day.count += row.callCount;
  }

  return {
    environments: Array.from(environments.values(), item => ({
      environmentId: item.environmentId,
      averageResponseTime: Math.round(item.sumResponseTime / item.count),
      callCount: item.callCount,
    })),
    totalRequests,
    responseTimeStart: oneDayAgo.getTime(),
    responseTimes: Array.from(responseTimes.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(item => [item.timestamp, Math.round(item.sum / item.count)]),
    dailyCounts: Array.from(days.values()),
  };
}

self.onmessage = async ({ data: { baseUrl, token, now } }) => {
  try {
    const today = new Date(now);
    const beginningOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const chartStart = new Date(now);
    chartStart.setDate(chartStart.getDate() - (DAILY_CHART_DAYS - 1));
    chartStart.setHours(0, 0, 0, 0);
    // Cover every displayed day and the whole current month for period totals.
    const startDate = beginningOfMonth < chartStart ? beginningOfMonth : chartStart;
    const url = new URL('/api/v1/Logs/stats', baseUrl);
    url.searchParams.set('date', startDate.toISOString());
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', Authorization: token },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();
    self.postMessage({ stats: summarize(rows ?? [], now, beginningOfMonth) });
  } catch {
    self.postMessage({ error: true });
  }
};
