const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

// ── Parse CSV ──────────────────────────────────────────────────────────────────
function loadData() {
  const csvPath = path.join(__dirname, '..', 'BD Fotografías de viaje 7c01b56b3826435daa35ce59933cd5ec.csv');
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  // Normalise column names (remove BOM, extra spaces)
  return records.map((row, idx) => {
    const clean = {};
    Object.keys(row).forEach(k => {
      const key = k.replace(/^\uFEFF/, '').trim();
      clean[key] = (row[k] || '').trim();
    });
    clean._index = idx;
    return clean;
  }).filter(r => r['IDFG'] && r['IDFG'] !== '');
}

let DATA = loadData();

// ── API: Full dataset ──────────────────────────────────────────────────────────
app.get('/api/data', (_req, res) => {
  res.json(DATA);
});

// ── API: Unique values per column ──────────────────────────────────────────────
app.get('/api/unique', (_req, res) => {
  const cols = ['ID LV', 'Creditos', 'Tipo', 'Color', 'Lugar', 'Tema principal', 'Comunidad Autonoma', 'Periodo'];
  const result = {};
  cols.forEach(col => {
    const set = new Set();
    DATA.forEach(r => { if (r[col] && r[col] !== '-') set.add(r[col]); });
    result[col] = [...set].sort();
  });
  res.json(result);
});

// ── API: Statistics ────────────────────────────────────────────────────────────
app.get('/api/stats', (_req, res) => {
  const stats = computeStats(DATA);
  res.json(stats);
});

function computeStats(data) {
  // Helper: frequency count
  const freq = (arr) => {
    const f = {};
    arr.forEach(v => { f[v] = (f[v] || 0) + 1; });
    return f;
  };

  // Helper: descriptive stats
  const descriptive = (values) => {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const sorted = [...values].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const stddev = Math.sqrt(variance);
    const min = sorted[0];
    const max = sorted[n - 1];
    return { n, mean: +mean.toFixed(4), median, variance: +variance.toFixed(4), stddev: +stddev.toFixed(4), min, max };
  };

  // 1. Frecuencias por columna
  const columns = ['Tipo', 'Color', 'Tema principal', 'Comunidad Autonoma', 'Periodo', 'Creditos'];
  const frequencies = {};
  columns.forEach(col => {
    const vals = data.map(r => r[col] || '-');
    frequencies[col] = freq(vals);
  });

  // 2. Tabla cruzada: Tema principal × Periodo
  const crossTemaPeriodo = buildCrossTab(data, 'Tema principal', 'Periodo');
  const chiTemaPeriodo = chiSquaredTest(crossTemaPeriodo);

  // 3. Tabla cruzada: Tema principal × Comunidad Autonoma
  const crossTemaCCAA = buildCrossTab(data, 'Tema principal', 'Comunidad Autonoma');
  const chiTemaCCAA = chiSquaredTest(crossTemaCCAA);

  // 4. Tabla cruzada: Color × Periodo
  const crossColorPeriodo = buildCrossTab(data, 'Color', 'Periodo');
  const chiColorPeriodo = chiSquaredTest(crossColorPeriodo);

  // 5. Tabla cruzada: Tipo × Comunidad Autonoma
  const crossTipoCCAA = buildCrossTab(data, 'Tipo', 'Comunidad Autonoma');
  const chiTipoCCAA = chiSquaredTest(crossTipoCCAA);

  // 6. Tabla cruzada: Color × Tema principal
  const crossColorTema = buildCrossTab(data, 'Color', 'Tema principal');
  const chiColorTema = chiSquaredTest(crossColorTema);

  // 7. Tabla cruzada: Comunidad Autonoma × Periodo
  const crossCCAAPeriodo = buildCrossTab(data, 'Comunidad Autonoma', 'Periodo');
  const chiCCAAPeriodo = chiSquaredTest(crossCCAAPeriodo);

  // 8. Top lugares
  const lugarVals = data.map(r => r['Lugar']).filter(v => v && v !== '-');
  const lugarFreq = freq(lugarVals);
  const topLugares = Object.entries(lugarFreq).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // 9. Patrimonio (multi-select analysis)
  const patrimonioItems = [];
  data.forEach(r => {
    const val = r['Patrimonio o lugares identificados'];
    if (val && val !== '-') {
      val.split(',').forEach(p => {
        const trimmed = p.trim();
        if (trimmed && trimmed !== '-') patrimonioItems.push(trimmed);
      });
    }
  });
  const patrimonioFreq = freq(patrimonioItems);
  const topPatrimonio = Object.entries(patrimonioFreq).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // 10. LV distribution
  const lvFreq = freq(data.map(r => r['ID LV']));

  // 11. Fotografías per Periodo descriptive
  const periodoGroups = {};
  data.forEach(r => {
    const p = r['Periodo'];
    if (p && p !== '-' && /^\d{4}/.test(p)) {
      if (!periodoGroups[p]) periodoGroups[p] = 0;
      periodoGroups[p]++;
    }
  });

  // 12. Creditos distribution
  const creditosVals = data.map(r => r['Creditos']).filter(v => v && v !== '-');
  const creditosFreq = freq(creditosVals);
  const topCreditos = Object.entries(creditosFreq).sort((a, b) => b[1] - a[1]).slice(0, 30);

  return {
    totalRecords: data.length,
    frequencies,
    crossTabs: {
      'Tema principal × Periodo': { table: crossTemaPeriodo, chi: chiTemaPeriodo },
      'Tema principal × Comunidad Autónoma': { table: crossTemaCCAA, chi: chiTemaCCAA },
      'Color × Periodo': { table: crossColorPeriodo, chi: chiColorPeriodo },
      'Tipo × Comunidad Autónoma': { table: crossTipoCCAA, chi: chiTipoCCAA },
      'Color × Tema principal': { table: crossColorTema, chi: chiColorTema },
      'Comunidad Autónoma × Periodo': { table: crossCCAAPeriodo, chi: chiCCAAPeriodo },
    },
    topLugares,
    topPatrimonio,
    topCreditos,
    lvDistribution: Object.entries(lvFreq).sort((a, b) => b[1] - a[1]),
    periodoGroups,
  };
}

function buildCrossTab(data, rowKey, colKey) {
  const validPeriodos = ['1939-1949', '1950-1959', '1960-1969', '1970-1979'];
  const rows = new Set();
  const cols = new Set();
  const counts = {};

  data.forEach(r => {
    let rv = r[rowKey] || '-';
    let cv = r[colKey] || '-';
    if (rv === '-' || cv === '-') return;
    // Filter only valid periods if the key is Periodo
    if (colKey === 'Periodo' && !validPeriodos.includes(cv) && !/^\d{4}/.test(cv)) return;
    if (rowKey === 'Periodo' && !validPeriodos.includes(rv) && !/^\d{4}/.test(rv)) return;
    rows.add(rv);
    cols.add(cv);
    const key = `${rv}|||${cv}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  const rowArr = [...rows].sort();
  const colArr = [...cols].sort();
  const matrix = rowArr.map(r => colArr.map(c => counts[`${r}|||${c}`] || 0));
  return { rows: rowArr, cols: colArr, matrix };
}

function chiSquaredTest(crossTab) {
  const { rows, cols, matrix } = crossTab;
  if (rows.length < 2 || cols.length < 2) return null;

  const nRows = rows.length;
  const nCols = cols.length;
  const rowTotals = matrix.map(row => row.reduce((a, b) => a + b, 0));
  const colTotals = [];
  for (let j = 0; j < nCols; j++) {
    let sum = 0;
    for (let i = 0; i < nRows; i++) sum += matrix[i][j];
    colTotals.push(sum);
  }
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0);

  if (grandTotal === 0) return null;

  let chiSq = 0;
  const expected = [];
  for (let i = 0; i < nRows; i++) {
    expected.push([]);
    for (let j = 0; j < nCols; j++) {
      const e = (rowTotals[i] * colTotals[j]) / grandTotal;
      expected[i].push(e);
      if (e > 0) {
        chiSq += ((matrix[i][j] - e) ** 2) / e;
      }
    }
  }

  const df = (nRows - 1) * (nCols - 1);

  // Cramér's V
  const minDim = Math.min(nRows, nCols) - 1;
  const cramersV = minDim > 0 ? Math.sqrt(chiSq / (grandTotal * minDim)) : 0;

  // p-value approximation using regularized incomplete gamma function
  const pValue = 1 - gammaCDF(chiSq / 2, df / 2);

  // Residuos estandarizados ajustados
  const stdResiduals = [];
  for (let i = 0; i < nRows; i++) {
    stdResiduals.push([]);
    for (let j = 0; j < nCols; j++) {
      const e = expected[i][j];
      if (e > 0) {
        const adjRes = (matrix[i][j] - e) / Math.sqrt(e * (1 - rowTotals[i] / grandTotal) * (1 - colTotals[j] / grandTotal));
        stdResiduals[i].push(+adjRes.toFixed(4));
      } else {
        stdResiduals[i].push(0);
      }
    }
  }

  return {
    chiSquared: +chiSq.toFixed(4),
    df,
    pValue: +pValue.toFixed(6),
    cramersV: +cramersV.toFixed(4),
    significant: pValue < 0.05,
    stdResiduals,
    expected: expected.map(row => row.map(v => +v.toFixed(2))),
  };
}

// ── Gamma CDF for p-value computation ──────────────────────────────────────────
function gammaCDF(x, a) {
  if (x <= 0) return 0;
  if (x > 200) return 1;
  return lowerIncompleteGamma(a, x) / gammaFunc(a);
}

function gammaFunc(z) {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gammaFunc(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function lowerIncompleteGamma(a, x) {
  // Series expansion
  let sum = 0;
  let term = 1 / a;
  for (let n = 0; n < 200; n++) {
    sum += term;
    term *= x / (a + n + 1);
    if (Math.abs(term) < 1e-12) break;
  }
  return Math.pow(x, a) * Math.exp(-x) * sum;
}

// ── Start server ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🎨 BD Fotografías de Viaje — Tesis Doctoral`);
  console.log(`  ➜ http://localhost:${PORT}\n`);
});
