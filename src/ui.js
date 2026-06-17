import { REGIONS, GROUPS } from './api.js';
import { fmtMWh, fmtMonth, uniqueSorted, sumValues } from './charts.js';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Des'];

export function buildTimeSelects(rawData) {
  const months = uniqueSorted(rawData.map(r => r.month));
  const years  = uniqueSorted(months.map(m => m.slice(0, 4)));

  const fromY = document.getElementById('fromYear');
  const toY   = document.getElementById('toYear');
  const fromM = document.getElementById('fromMonth');
  const toM   = document.getElementById('toMonth');

  years.forEach(y => { fromY.add(new Option(y, y)); toY.add(new Option(y, y)); });
  MONTH_NAMES.forEach((lbl, i) => {
    const mo = String(i + 1).padStart(2, '0');
    fromM.add(new Option(lbl, mo));
    toM.add(new Option(lbl, mo));
  });

  fromY.value = years[0];
  fromM.value = '01';
  toY.value   = years[years.length - 1];
  toM.value   = months[months.length - 1].slice(5, 7);
}

export function buildCheckboxGroup(containerId, items, isChecked, onChange) {
  const container = document.getElementById(containerId);
  items.forEach(item => {
    const wrap  = document.createElement('div');
    if (item.sub) wrap.className = 'sub-item';
    const label = document.createElement('label');
    const cb    = document.createElement('input');
    cb.type    = 'checkbox';
    cb.value   = item.code;
    cb.checked = isChecked(item);
    cb.addEventListener('change', onChange);
    label.append(cb, item.label);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
}

export function resetTimeToFull(rawData) {
  const months = uniqueSorted(rawData.map(r => r.month));
  const years  = uniqueSorted(months.map(m => m.slice(0, 4)));
  document.getElementById('fromYear').value  = years[0];
  document.getElementById('fromMonth').value = '01';
  document.getElementById('toYear').value    = years[years.length - 1];
  document.getElementById('toMonth').value   = months[months.length - 1].slice(5, 7);
}

export function updateKPIs(data) {
  const months     = uniqueSorted(data.map(r => r.month));
  const latest     = months[months.length - 1];
  const total      = sumValues(data);
  const latestSum  = sumValues(data.filter(r => r.month === latest));
  const avg        = months.length ? total / months.length : 0;

  document.getElementById('kpiRow').innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">Totalt forbruk (valgt periode)</div>
      <div class="kpi-value">${fmtMWh(total)}</div>
      <div class="kpi-sub">${months.length} maneder</div>
    </div>
    <div class="kpi-card" style="border-color:#2a9d8f">
      <div class="kpi-label">Siste maned (${fmtMonth(latest)})</div>
      <div class="kpi-value" style="color:#2a9d8f">${fmtMWh(latestSum)}</div>
      <div class="kpi-sub">Alle valgte grupper og regioner</div>
    </div>
    <div class="kpi-card" style="border-color:#e9c46a">
      <div class="kpi-label">Gjennomsnitt pr. maned</div>
      <div class="kpi-value" style="color:#b8860b">${fmtMWh(avg)}</div>
      <div class="kpi-sub">I valgt periode</div>
    </div>
  `;
}

export function updateTable(data, selectedRegionCodes, selectedGroupCodes) {
  const months = uniqueSorted(data.map(r => r.month)).reverse().slice(0, 6);
  const regs   = REGIONS.filter(r => selectedRegionCodes.includes(r.code));
  const grps   = GROUPS.filter(g => selectedGroupCodes.includes(g.code));

  let rows = [];
  for (const m of months)
    for (const r of regs)
      for (const g of grps) {
        const row = data.find(d => d.month === m && d.regionCode === r.code && d.groupCode === g.code);
        if (row) rows.push(row);
      }

  const truncated = rows.length > 300;
  if (truncated) rows = rows.slice(0, 300);

  document.getElementById('tableNote').textContent =
    truncated ? '(viser 300 nyeste rader - innsnevre filtrene for full visning)' : '';

  document.getElementById('tableWrap').innerHTML =
    '<table><thead><tr>' +
    '<th>Maned</th><th>Prisomrade</th><th>Forbrukergruppe</th><th class="num">Forbruk (MWh)</th>' +
    '</tr></thead><tbody>' +
    rows.map(r =>
      `<tr>
        <td>${fmtMonth(r.month)}</td>
        <td>${r.regionLabel}</td>
        <td>${r.groupLabel}</td>
        <td class="num">${r.value.toLocaleString('nb-NO')}</td>
      </tr>`
    ).join('') +
    '</tbody></table>';
}
