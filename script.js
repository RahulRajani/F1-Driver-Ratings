/* script.js - interactive dashboard logic */
let dataByYear = {};
let years = [];
let barChart = null;
let lineChart = null;

function fetchData() {
  return fetch('data.json').then(r => r.json());
}

function populateYearSelect() {
  const yearSelect = document.getElementById('yearSelect');
  yearSelect.innerHTML = '';
  years.forEach(y => {
    const opt = document.createElement('option'); opt.value = y; opt.text = y; yearSelect.appendChild(opt);
  });
  yearSelect.addEventListener('change', () => { updateDashboard(yearSelect.value); });
}

function populateDriverSelect(year) {
  // 1. Get the select element FIRST
  const driverSelect = document.getElementById('driverSelect');
  // 2. Clear its content
  driverSelect.innerHTML = '<option value="">(pick a driver)</option>';
  // 3. Use the SAFE array check to get the drivers
  const drivers = (Array.isArray(dataByYear[year]) ? dataByYear[year] : []).map(r => r.Driver || r.Name || r.driver).filter(Boolean).sort();
  // 4. Populate the list
  drivers.forEach(d => {
    const opt = document.createElement('option'); opt.value = d; opt.text = d; driverSelect.appendChild(opt);
  });
  // 5. Add the event listener
  driverSelect.addEventListener('change', () => { drawLineForDriver(driverSelect.value); });
}

function buildTable(year) {
  const container = document.getElementById('tableContainer');
  container.innerHTML = '';
  // Use the safe Array.isArray check
  const rows = Array.isArray(dataByYear[year]) ? dataByYear[year] : [];
  if (!rows.length) { container.innerHTML = '<p>No data for this year.</p>'; return; }
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headers = Object.keys(rows[0]);
  const trh = document.createElement('tr');
  headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; trh.appendChild(th); });
  thead.appendChild(trh); table.appendChild(thead);
  const tbody = document.createElement('tbody');
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.addEventListener('click', () => { const name = r.Driver || r.Name || r.driver; if (name) { document.getElementById('driverSelect').value = name; drawLineForDriver(name); } });
    headers.forEach(h => {
      const td = document.createElement('td');
      td.textContent = (r[h] !== null && r[h] !== undefined) ? r[h] : '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function buildBarChart(year) {
  const ctx = document.getElementById('barChart').getContext('2d');
  // Use the safe Array.isArray check
  const rows = Array.isArray(dataByYear[year]) ? dataByYear[year] : [];
  // Try to detect a numeric rating column (common names: Rating, Score, ELO)
  const numericKeys = Object.keys(rows[0] || {}).filter(k => {
    return rows.some(r => typeof r[k] === 'number');
  });
  const scoreKey = numericKeys.find(k => /rating|score|elo|points|value/i.test(k)) || numericKeys[0];
  const labels = rows.map(r => r.Driver || r.Name || r.driver || 'Unknown');
  const values = rows.map(r => Number(r[scoreKey] || 0));
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: scoreKey || 'Value', data: values }] },
    options: { responsive: true, maintainAspectRatio:false, scales: { y: { beginAtZero:true } } }
  });
}

function buildLineChart() {
  const ctx = document.getElementById('lineChart').getContext('2d');
  if (lineChart) lineChart.destroy();
  lineChart = new Chart(ctx, {
    type: 'line',
    data: { labels: years, datasets: [] },
    options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:false } } }
  });
}

// Draw trend line for a specific driver across years
function drawLineForDriver(driverName) {
  if (!driverName) return;
  const scoreKey = detectNumericKey();
  const dataset = {
    label: driverName,
    data: years.map(y => {
      // Use the safe Array.isArray check
      const row = (Array.isArray(dataByYear[y]) ? dataByYear[y] : []).find(r => (r.Driver||r.Name||r.driver) === driverName);
      return row ? Number(row[scoreKey] || 0) : null;
    }),
    spanGaps: true
  };
  buildLineChart();
  lineChart.data.datasets.push(dataset);
  lineChart.update();
}

function detectNumericKey() {
  // try to detect a rating-like key from first available year
  const first = dataByYear[years[0]] && dataByYear[years[0]][0];
  if (!first) return Object.keys(first||{})[0] || 'Value';
  const numericKeys = Object.keys(first).filter(k => {
    // Use the safe Array.isArray check
    return years.some(y => (Array.isArray(dataByYear[y]) ? dataByYear[y] : []).some(r => typeof r[k] === 'number'));
s  });
  return numericKeys.find(k => /rating|score|elo|points|value/i.test(k)) || (numericKeys[0] || Object.keys(first)[0]);
}

function updateDashboard(year) {
  populateDriverSelect(year);
  buildTable(year);
  buildBarChart(year);
  // clear line chart's datasets
  if (lineChart) { lineChart.data.datasets = []; lineChart.update(); }
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchData();
  dataByYear = data;
  years = Object.keys(dataByYear).sort();
  populateYearSelect();
  populateDriverSelect(years[0]);
  buildTable(years[0]);
  buildBarChart(years[0]);
  buildLineChart();
});
