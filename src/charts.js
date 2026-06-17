import Chart from 'chart.js/auto';

export const PALETTE = [
  '#003366', '#e63946', '#2a9d8f', '#e9c46a', '#f4a261',
  '#457b9d', '#6a4c93', '#1982c4', '#8ac926', '#ff595e', '#ffca3a',
];

export function fmtMWh(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(2) + ' TWh';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + ' GWh';
  return v.toLocaleString('nb-NO') + ' MWh';
}

export function fmtMonth(code) {
  return code.replace('M', '/');
}

export function uniqueSorted(arr) {
  return [...new Set(arr)].sort();
}

export function sumValues(arr) {
  return arr.reduce((s, r) => s + r.value, 0);
}

const yTicksCb = v =>
  v >= 1e9 ? (v / 1e9).toFixed(1) + ' TWh'
  : v >= 1e6 ? (v / 1e6).toFixed(1) + ' GWh'
  : v.toLocaleString('nb-NO');

const tooltipValueLabel = ctx =>
  ` ${ctx.dataset.label}: ${ctx.raw != null ? ctx.raw.toLocaleString('nb-NO') + ' MWh' : 'Ingen data'}`;

let lineChart, barChart, yearChart;

export function renderLineChart({ data, mode, selectedRegions, selectedGroups, REGIONS, GROUPS }) {
  const months = uniqueSorted(data.map(r => r.month));
  const labels = months.map(fmtMonth);

  const series = mode === 'region'
    ? REGIONS.filter(r => selectedRegions.includes(r.code))
    : GROUPS.filter(g => selectedGroups.includes(g.code));

  const datasets = series.map((item, i) => {
    const values = months.map(m => {
      const slice = data.filter(x =>
        x.month === m &&
        (mode === 'region' ? x.regionCode : x.groupCode) === item.code
      );
      return slice.length ? sumValues(slice) : null;
    });
    return {
      label: item.label,
      data: values,
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: PALETTE[i % PALETTE.length] + '22',
      tension: 0.35,
      pointRadius: 2,
      borderWidth: 2,
    };
  });

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(document.getElementById('lineChart'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 }, padding: 14 } },
        tooltip: { callbacks: { label: tooltipValueLabel } },
      },
      scales: { y: { beginAtZero: false, ticks: { callback: yTicksCb } } },
    },
  });
}

export function renderBarChart({ data, selectedRegions, selectedGroups, REGIONS, GROUPS }) {
  const months = uniqueSorted(data.map(r => r.month));
  const latest = months[months.length - 1];
  const latestData = data.filter(r => r.month === latest);

  document.getElementById('barTitle').textContent = 'Fordeling ' + fmtMonth(latest);

  const regs = REGIONS.filter(r => selectedRegions.includes(r.code));
  const grps = GROUPS.filter(g => selectedGroups.includes(g.code));

  const datasets = grps.map((g, i) => ({
    label: g.label,
    data: regs.map(r => {
      const row = latestData.find(d => d.regionCode === r.code && d.groupCode === g.code);
      return row ? row.value : null;
    }),
    backgroundColor: PALETTE[i % PALETTE.length] + 'cc',
  }));

  if (barChart) barChart.destroy();
  barChart = new Chart(document.getElementById('barChart'), {
    type: 'bar',
    data: { labels: regs.map(r => r.label), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 10 } },
        tooltip: { callbacks: { label: tooltipValueLabel } },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: yTicksCb } } },
    },
  });
}

export function renderYearChart({ data, selectedRegions, REGIONS }) {
  const years = uniqueSorted(data.map(r => r.month.slice(0, 4)));
  const regs  = REGIONS.filter(r => selectedRegions.includes(r.code));

  const datasets = regs.map((r, i) => ({
    label: r.label,
    data: years.map(y => {
      const slice = data.filter(d => d.month.startsWith(y) && d.regionCode === r.code);
      return slice.length ? sumValues(slice) : null;
    }),
    backgroundColor: PALETTE[i % PALETTE.length] + 'cc',
  }));

  if (yearChart) yearChart.destroy();
  yearChart = new Chart(document.getElementById('yearChart'), {
    type: 'bar',
    data: { labels: years, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, padding: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw != null ? fmtMWh(ctx.raw) : 'Ingen data'}` } },
      },
      scales: { y: { beginAtZero: true, ticks: { callback: yTicksCb } } },
    },
  });
}
