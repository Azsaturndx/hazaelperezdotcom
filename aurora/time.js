/* Pure calendar helpers, also exercised with Node's built-in test runner. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const formatters = new Map();
  function partsAt(instant, timeZone) {
    if (!formatters.has(timeZone)) formatters.set(timeZone, new Intl.DateTimeFormat('en-GB', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }));
    return Object.fromEntries(formatters.get(timeZone).formatToParts(instant)
      .filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
  }
  function civilStamp(p) {
    return Date.UTC(p.year, p.month - 1, p.day, p.hour || 0, p.minute || 0, p.second || 0);
  }
  function birthParts(config) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(config.birthDate) || !/^\d{2}:\d{2}$/.test(config.birthTime)) throw new Error('Invalid birth configuration');
    const [year, month, day] = config.birthDate.split('-').map(Number);
    const [hour, minute] = config.birthTime.split(':').map(Number);
    const p = { year, month, day, hour, minute, second: 0 };
    const check = new Date(civilStamp(p));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day || hour > 23 || minute > 59) throw new Error('Invalid birth configuration');
    return p;
  }
  function instantFor(p, timeZone) {
    const desired = civilStamp(p);
    let guess = desired;
    for (let i = 0; i < 4; i++) {
      const delta = desired - civilStamp(partsAt(guess, timeZone));
      if (delta === 0) return guess;
      guess += delta;
    }
    throw new Error('Birth time does not exist in selected time zone');
  }
  function addMonths(p, months) {
    const index = p.year * 12 + p.month - 1 + months;
    const year = Math.floor(index / 12), month = index % 12 + 1;
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return { ...p, year, month, day: Math.min(p.day, last) };
  }
  function calendarAge(birth, current) {
    let months = (current.year - birth.year) * 12 + current.month - birth.month;
    if (civilStamp(current) < civilStamp(addMonths(birth, months))) months--;
    const anchor = addMonths(birth, months);
    const days = Math.floor((civilStamp(current) - civilStamp(anchor)) / DAY);
    return { years: Math.floor(months / 12), months: months % 12, days };
  }
  function stateAt(now, config) {
    const birth = birthParts(config);
    const instant = instantFor(birth, config.timeZone);
    const timestamp = Number(now);
    if (!Number.isFinite(timestamp)) throw new Error('Invalid current time');
    const current = partsAt(timestamp, config.timeZone);
    const born = timestamp >= instant;
    const total = Math.max(0, Math.ceil((instant - timestamp) / 1000));
    const age = born ? calendarAge(birth, current) : { years: 0, months: 0, days: 0 };
    return {
      born, birthInstant: instant,
      arrivalDay: current.year === birth.year && current.month === birth.month && current.day === birth.day,
      countdown: { days: Math.floor(total / 86400), hours: Math.floor(total / 3600) % 24, minutes: Math.floor(total / 60) % 60, seconds: total % 60 },
      age, unlockedLetters: born ? Math.min(age.years, config.letterCount) : 0
    };
  }
  function ageText(age) {
    return `${age.years} ${age.years === 1 ? 'año' : 'años'}, ${age.months} ${age.months === 1 ? 'mes' : 'meses'} y ${age.days} ${age.days === 1 ? 'día' : 'días'}`;
  }
  const api = Object.freeze({ partsAt, birthParts, instantFor, addMonths, calendarAge, stateAt, ageText });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AuroraTime = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
