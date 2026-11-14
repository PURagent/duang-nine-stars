export function bangkokDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = type => parts.find(value => value.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(Number(year) || 2000, Number(month) || 1, 0)).getUTCDate();
}

export function birthDateISO(year, month, day) {
  if (!year || !month || !day) return '';
  const y = Number(year), m = Number(month), d = Number(day);
  if (![y, m, d].every(Number.isInteger) || y < 1900 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
