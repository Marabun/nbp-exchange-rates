const translations = {
  ru: {
    months: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    labels: { language: 'Язык:', currency: 'Валюта:', month: 'Месяц:', year: 'Год:', button: 'Показать' },
    heading: 'Курс USD/EUR к польскому злотому ({year})',
    maxRate: 'Максимальный курс: ',
    table: { date: 'Дата', rate: 'Курс', noData: 'Нет данных за выбранный месяц.', loading: 'Загрузка...', error: 'Ошибка: ' }
  },
  en: {
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    labels: { language: 'Language:', currency: 'Currency:', month: 'Month:', year: 'Year:', button: 'Show' },
    heading: 'USD/EUR exchange rate to Polish Zloty ({year})',
    maxRate: 'Maximum rate: ',
    table: { date: 'Date', rate: 'Rate', noData: 'No data for selected month.', loading: 'Loading...', error: 'Error: ' }
  },
  pl: {
    months: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
    labels: { language: 'Język:', currency: 'Waluta:', month: 'Miesiąc:', year: 'Rok:', button: 'Pokaż' },
    heading: 'Kurs USD/EUR na złoty polski ({year})',
    maxRate: 'Maksymalny kurs: ',
    table: { date: 'Data', rate: 'Kурс', noData: 'Brak danych dla wybranego miesiąca.', loading: 'Ładowanie...', error: 'Błąd: ' }
  }
};
let currentLang = 'en';

function applyLocalization() {
  const year = new Date().getFullYear();
  document.documentElement.lang = currentLang;
  const lbls = translations[currentLang].labels;
  document.getElementById('language-label').textContent = lbls.language;
  document.getElementById('currency-label').textContent = lbls.currency;
  document.getElementById('month-label').textContent = lbls.month;
  document.getElementById('year-label').textContent = lbls.year;
  document.getElementById('submit-button').textContent = lbls.button;
  document.getElementById('heading').textContent = translations[currentLang].heading.replace('{year}', year);
}

function fillMonthOptions(year, maxMonthIdx) {
  const monthSelect = document.getElementById('month');
  monthSelect.innerHTML = '';
  translations[currentLang].months.forEach((m, i) => {
    if (i <= maxMonthIdx) {
      const opt = document.createElement('option');
      opt.value = (i+1).toString().padStart(2, '0');
      opt.textContent = m;
      monthSelect.appendChild(opt);
    }
  });
}

function fillSelects() {
  const yearSelect = document.getElementById('year');
  const current = new Date();
  const currentYear = current.getFullYear();
  const currentMonthIdx = current.getMonth();
  const startYear = 2002;
  for (let y = startYear; y <= currentYear; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
  yearSelect.value = currentYear;
  fillMonthOptions(currentYear, currentMonthIdx);
  yearSelect.addEventListener('change', () => {
    const selectedYear = Number(yearSelect.value);
    const maxIdx = selectedYear === currentYear ? currentMonthIdx : 11;
    fillMonthOptions(selectedYear, maxIdx);
  });
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

async function fetchRates(currency, year, month) {
  const start = `${year}-${month}-01`;
  const now = new Date();
  const isCurrentMonth = Number(year) === now.getFullYear() && Number(month) === now.getMonth() + 1;
  const endDay = isCurrentMonth ? now.getDate() : getLastDayOfMonth(year, month);
  const endDayStr = endDay.toString().padStart(2, '0');
  const end = `${year}-${month}-${endDayStr}`;
  const url = `https://api.nbp.pl/api/exchangerates/rates/a/${currency}/${start}/${end}/?format=json`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Ошибка при получении данных NBP');
  return await resp.json();
}

function renderTable(rates) {
  let html = `<table><thead><tr><th>${translations[currentLang].table.date}</th><th>${translations[currentLang].table.rate}</th></tr></thead><tbody>`;
  rates.forEach(r => {
    html += `<tr><td>${r.effectiveDate}</td><td>${r.mid.toFixed(4)}</td></tr>`;
  });
  html += '</tbody></table>';
  return html;
}

document.addEventListener('DOMContentLoaded', () => {
  applyLocalization();
  fillSelects();
  // Set language selector to currentLang on load
  document.getElementById('language').value = currentLang;
  document.getElementById('language').addEventListener('change', e => {
    currentLang = e.target.value;
    applyLocalization();
    const selYear = document.getElementById('year').value;
    const now = new Date();
    const maxIdx = Number(selYear) === now.getFullYear() ? now.getMonth() : 11;
    fillMonthOptions(Number(selYear), maxIdx);
  });
  document.getElementById('rateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currency = document.getElementById('currency').value;
    const year = document.getElementById('year').value;
    const month = document.getElementById('month').value;
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = translations[currentLang].table.loading;
    try {
      const data = await fetchRates(currency, year, month);
      if (!data.rates || data.rates.length === 0) {
        resultDiv.innerHTML = `<div>${translations[currentLang].table.noData}</div>`;
        return;
      }
      const maxRate = data.rates.reduce((max, r) => r.mid > max ? r.mid : max, data.rates[0].mid);
      resultDiv.innerHTML = `<div class="max-rate">${translations[currentLang].maxRate}<span>${maxRate.toFixed(4)}</span></div>` + renderTable(data.rates);
    } catch (err) {
      resultDiv.innerHTML = `<div style="color:red;">${translations[currentLang].table.error}${err.message}</div>`;
    }
  });
});
