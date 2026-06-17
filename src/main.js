import './style.css';
import { fetchTableData, REGIONS, GROUPS } from './api.js';
import { buildTimeSelects, buildCheckboxGroup, resetTimeToFull, updateKPIs, updateTable } from './ui.js';
import { renderLineChart, renderBarChart, renderYearChart } from './charts.js';

let rawData   = [];
let chartMode = 'region';

function getFromCode() {
  return `${document.getElementById('fromYear').value}M${document.getElementById('fromMonth').value}`;
}

function getToCode() {
  return `${document.getElementById('toYear').value}M${document.getElementById('toMonth').value}`;
}

function getSelectedRegions() {
  return [...document.querySelectorAll('#regionFilters input:checked')].map(cb => cb.value);
}

function getSelectedGroups() {
  return [...document.querySelectorAll('#groupFilters input:checked')].map(cb => cb.value);
}

function getFilteredData() {
  const from = getFromCode();
  const to   = getToCode();
  const regs = new Set(getSelectedRegions());
  const grps = new Set(getSelectedGroups());
  return rawData.filter(r =>
    r.month >= from &&
    r.month <= to &&
    regs.has(r.regionCode) &&
    grps.has(r.groupCode)
  );
}

function render() {
  const data            = getFilteredData();
  if (!data.length) return;
  const selectedRegions = getSelectedRegions();
  const selectedGroups  = getSelectedGroups();

  updateKPIs(data);
  renderLineChart({ data, mode: chartMode, selectedRegions, selectedGroups, REGIONS, GROUPS });
  renderBarChart({ data, selectedRegions, selectedGroups, REGIONS, GROUPS });
  renderYearChart({ data, selectedRegions, REGIONS });
  updateTable(data, selectedRegions, selectedGroups);
}

function setChartMode(mode) {
  chartMode = mode;
  document.getElementById('btn-region').classList.toggle('active', mode === 'region');
  document.getElementById('btn-group').classList.toggle('active', mode === 'group');
  render();
}

function toggleAll(containerId, checked) {
  document.querySelectorAll(`#${containerId} input`).forEach(cb => (cb.checked = checked));
  render();
}

async function init() {
  try {
    rawData = await fetchTableData();

    document.getElementById('loading').hidden = true;
    document.getElementById('app').hidden     = false;

    buildTimeSelects(rawData);
    buildCheckboxGroup('regionFilters', REGIONS, r => r.code !== 'NO', render);
    buildCheckboxGroup('groupFilters',  GROUPS,  g => ['1','2','3','4'].includes(g.code), render);

    document.getElementById('reset-time').addEventListener('click', () => {
      resetTimeToFull(rawData);
      render();
    });
    document.getElementById('select-all-regions').addEventListener('click', () => toggleAll('regionFilters', true));
    document.getElementById('select-all-groups').addEventListener('click',  () => toggleAll('groupFilters', true));
    document.getElementById('btn-region').addEventListener('click', () => setChartMode('region'));
    document.getElementById('btn-group').addEventListener('click',  () => setChartMode('group'));
    document.querySelectorAll('#fromYear, #fromMonth, #toYear, #toMonth').forEach(el =>
      el.addEventListener('change', render)
    );

    render();
  } catch (e) {
    document.getElementById('loading').hidden = true;
    const box = document.getElementById('err-box');
    box.hidden = false;
    box.innerHTML =
      `<strong>Feil ved lasting av data fra SSB</strong><br>${e.message}` +
      `<br><br><small>Kontroller nettverkstilgang og at SSB API er tilgjengelig.</small>`;
    console.error(e);
  }
}

init();
