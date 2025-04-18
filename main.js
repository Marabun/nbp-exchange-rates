const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

function fillMonthOptions(year, maxMonthIdx) {
    const monthSelect = document.getElementById('month');
    monthSelect.innerHTML = '';
    months.forEach((m, i) => {
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
    let html = '<table><thead><tr><th>Дата</th><th>Курс</th></tr></thead><tbody>';
    rates.forEach(r => {
        html += `<tr><td>${r.effectiveDate}</td><td>${r.mid.toFixed(4)}</td></tr>`;
    });
    html += '</tbody></table>';
    return html;
}

document.addEventListener('DOMContentLoaded', () => {
    fillSelects();
    document.getElementById('rateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currency = document.getElementById('currency').value;
        const year = document.getElementById('year').value;
        const month = document.getElementById('month').value;
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = 'Загрузка...';
        try {
            const data = await fetchRates(currency, year, month);
            if (!data.rates || data.rates.length === 0) {
                resultDiv.innerHTML = '<div>Нет данных за выбранный месяц.</div>';
                return;
            }
            const maxRate = data.rates.reduce((max, r) => r.mid > max ? r.mid : max, data.rates[0].mid);
            resultDiv.innerHTML = `<div class="max-rate">Максимальный курс: <span>${maxRate.toFixed(4)}</span></div>` + renderTable(data.rates);
        } catch (err) {
            resultDiv.innerHTML = `<div style="color:red;">Ошибка: ${err.message}</div>`;
        }
    });
});
