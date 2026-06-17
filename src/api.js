const SSB_API_URL =
  'https://data.ssb.no/api/pxwebapi/v2/tables/14092/data' +
  '?lang=no&valueCodes[Forbrukargruppe]=*&valueCodes[Prisomraade]=*&valueCodes[Tid]=*';

export const REGIONS = [
  { code: 'NO',  label: 'Norge (total)' },
  { code: 'NO1', label: 'Sorost-Norge' },
  { code: 'NO2', label: 'Sorvest-Norge' },
  { code: 'NO3', label: 'Midt-Norge' },
  { code: 'NO4', label: 'Nord-Norge' },
  { code: 'NO5', label: 'Vest-Norge' },
];

export const GROUPS = [
  { code: '0',   label: 'I alt',                    sub: false },
  { code: '1',   label: 'Primerneringer',            sub: false },
  { code: '2',   label: 'Sekundaerneringer',         sub: false },
  { code: '2.1', label: 'Bergverk og utvinning',     sub: true  },
  { code: '2.2', label: 'Kraftintensiv industri',    sub: true  },
  { code: '2.3', label: 'Industri utenom kraftint.', sub: true  },
  { code: '2.4', label: 'Kraftforsyning m.m.',       sub: true  },
  { code: '3',   label: 'Tertiaerneringer',          sub: false },
  { code: '4',   label: 'Husholdninger',             sub: false },
  { code: '4.1', label: 'Boliger',                   sub: true  },
  { code: '4.2', label: 'Hytter og fritidshus',      sub: true  },
];

export async function fetchTableData() {
  const res = await fetch(SSB_API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status} fra SSB API`);
  return parseJsonStat2(await res.json());
}

function parseJsonStat2(js) {
  const { id: ids, size: sizes, dimension: dims, value: values } = js;

  const dimArrays = ids.map(id => {
    const { index, label } = dims[id].category;
    return Object.keys(index)
      .sort((a, b) => index[a] - index[b])
      .map(code => ({ code, label: label[code] }));
  });

  const strides = new Array(ids.length);
  strides[ids.length - 1] = 1;
  for (let i = ids.length - 2; i >= 0; i--) {
    strides[i] = strides[i + 1] * sizes[i + 1];
  }

  const rows = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null) continue;
    let rem = i;
    const combo = {};
    for (let d = 0; d < ids.length; d++) {
      const idx = Math.floor(rem / strides[d]);
      rem %= strides[d];
      combo[ids[d]] = dimArrays[d][idx];
    }
    rows.push({
      groupCode:   combo['Forbrukargruppe'].code,
      groupLabel:  combo['Forbrukargruppe'].label,
      regionCode:  combo['Prisomraade'].code,
      regionLabel: combo['Prisomraade'].label,
      month:       combo['Tid'].code,
      value:       values[i],
    });
  }
  return rows;
}
