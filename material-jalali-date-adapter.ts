import { DateAdapter, MatDateFormats } from '@angular/material/core';
import {
  JalaliDate,
  GregorianJalaliHelper,
  LONG_MONTHS,
  NARROW_MONTHS,
  SHORT_MONTHS,
} from './jalali-date';

export const PERSIAN_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'YYYY/MM/DD',
  },
  display: {
    dateInput: 'YYYY/MM/DD',
    monthYearLabel: 'YYYY MMMM',
    dateA11yLabel: 'YYYY/MM/DD',
    monthYearA11yLabel: 'YYYY MMMM',
  },
};

export class MaterialJalaliDateAdapter extends DateAdapter<JalaliDate> {
  private readonly dayNames: string[] = [...new Array(31)].map((_, i) => (i + 1).toString());

  constructor() {
    super();
    super.setLocale('fa-IR');
  }

  getYear(date: JalaliDate): number {
    return this.clone(date).year;
  }

  getMonth(date: JalaliDate): number {
    return this.clone(date).month - 1;
  }

  getDate(date: JalaliDate): number {
    return this.clone(date).day;
  }

  getDayOfWeek(date: JalaliDate): number {
    return this.clone(date).dayOfWeek();
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    switch (style) {
      case 'long':
        return LONG_MONTHS;
      case 'short':
        return SHORT_MONTHS;
      default:
        // case 'narrow':
        return NARROW_MONTHS;
    }
  }

  getDateNames(): string[] {
    return this.dayNames;
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    switch (style) {
      case 'long':
        return ['یکشنبه', 'دوشنبه', 'سه\u200Cشنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
      case 'short':
        return ['یک', 'دو', 'سه', 'چهار', 'پنج', 'جمعه', 'شنبه'];
      default:
        // case 'narrow':
        return ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
    }
  }

  getYearName(date: JalaliDate): string {
    return this.clone(date).year.toString();
  }

  getFirstDayOfWeek(): number {
    return 6;
  }

  getNumDaysInMonth(date: JalaliDate): number {
    return GregorianJalaliHelper.getDaysPerMonth(date.month, date.year);
  }

  clone(date: JalaliDate): JalaliDate {
    return date.clone();
    // return date.clone().locale('fa-IR');
  }

  createDate(year: number, month: number, date: number): JalaliDate {
    // console.log('#ee year', year, month, date);
    if (month < 0 || month > 12) {
      throw new Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }
    if (date < 1) {
      throw new Error(`Invalid date "${date}". Date has to be greater than 0.`);
    }
    const result = new JalaliDate(year, month + 1, date);

    // if (this.getMonth(result) !== month) {
    //   throw new Error(`Invalid date ${date} for month with index ${month}.`);
    // }
    if (!result.isValid()) {
      throw new Error(`Invalid date "${date}" for month with index "${month}".`);
    }
    return result;
  }

  today(): JalaliDate {
    return GregorianJalaliHelper.fromGregorian(new Date());
  }

  parse(value: any, parseFormat: string | string[]): JalaliDate | null {
    if (typeof value === 'string') {
      return JalaliDate.parse(value, parseFormat);
    }
    return null;
  }

  format(date: JalaliDate, displayFormat: string): string {
    date = this.clone(date);
    if (!this.isValid(date)) {
      throw new Error('JalaliMomentDateAdapter: Cannot format invalid date.');
    }
    return date.format(displayFormat);
  }

  addCalendarYears(date: JalaliDate, years: number): JalaliDate {
    return this.clone(date).addYears(years);
  }

  addCalendarMonths(date: JalaliDate, months: number): JalaliDate {
    return this.clone(date).addMonths(months);
  }

  addCalendarDays(date: JalaliDate, days: number): JalaliDate {
    return this.clone(date).addDays(days);
  }

  toIso8601(date: JalaliDate): string {
    return this.clone(date).format('YYYY-MM-DD');
  }

  isDateInstance(obj: any): boolean {
    return obj instanceof JalaliDate;
  }

  isValid(date: JalaliDate): boolean {
    return this.clone(date).isValid();
  }

  invalid(): JalaliDate {
    return new JalaliDate(-1, -1, -1);
  }

  deserialize(value: any): JalaliDate | null {
    let date;
    if (value instanceof Date) {
      date = GregorianJalaliHelper.fromGregorian(value);
    }
    if (typeof value === 'string') {
      if (!value) {
        return null;
      }
    }
    if (date && this.isValid(date)) {
      return date;
    }
    return super.deserialize(value);
  }
}
