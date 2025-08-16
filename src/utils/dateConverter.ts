import moment from 'moment-jalaali';

const weekdaysFa = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه',
];

export const toPersianDateWithWeekday = (date: Date) => {
  const m = moment(date);
  const jDate = m.format('jYYYY/jMM/jDD');
  const weekday = weekdaysFa[m.day()];
  return `${jDate} ${weekday}`;
};

export const nextNDays = (n: number) => {
  const days: { date: Date; formatted: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = moment().add(i, 'days').toDate();
    days.push({ date: d, formatted: toPersianDateWithWeekday(d) });
  }
  return days;
};
