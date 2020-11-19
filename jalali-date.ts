export class JalaliDate {
  static parse(value: string, parseFormat: string | string[]) {
    const [year, month, day] = value.split('/');
    return new JalaliDate(parseInt(year, 10), parseInt(month, 10), parseInt(day, 10));
  }
  constructor(public year: number, public month: number, public day: number) {}
  clone(): JalaliDate {
    return new JalaliDate(this.year, this.month, this.day);
  }
  isValid() {
    return (
      this.month > 0 &&
      this.month < 13 &&
      this.day > 0 &&
      this.day <= GregorianJalaliHelper.getDaysPerMonth(this.month, this.year)
    );
  }
  dayOfWeek() {
    return GregorianJalaliHelper.toGregorian(this).getDay();
  }
  format(displayFormat: string) {
    return stringReplaceBulk(
      displayFormat,
      ['YYYY', 'MMMM', 'MM', 'DD'],
      [this.year, LONG_MONTHS[this.month - 1], this.month, this.day],
    );
  }

  addYears = (years: number) => {
    this.year += years;
    return this;
  };

  addMonths = (months: number) => {
    const month = this.month + months;
    return this.setJalaliMonth(month);
  };

  setJalaliMonth(month: number) {
    this.year += Math.floor((month - 1) / 12);
    this.month = Math.floor((((month - 1) % 12) + 12) % 12) + 1;
    return this;
  }

  setJalaliDay(day: number) {
    let mDays = GregorianJalaliHelper.getDaysPerMonth(this.month, this.year);
    if (day <= 0) {
      while (day <= 0) {
        this.setJalaliMonth(this.month - 1);
        mDays = GregorianJalaliHelper.getDaysPerMonth(this.month, this.year);
        day += mDays;
      }
    } else if (day > mDays) {
      while (day > mDays) {
        day -= mDays;
        this.setJalaliMonth(this.month + 1);
        mDays = GregorianJalaliHelper.getDaysPerMonth(this.month, this.year);
      }
    }
    this.day = day;
    return this;
  }

  addDays = (days: number) => {
    const day = this.day + days;
    return this.setJalaliDay(day);
  };
}

class GregorianJalaliHelperClass {
  /**
   * Returns the equivalent jalali date value for a give input Gregorian date.
   * `gdate` is a JS Date to be converted to jalali.
   * utc to local
   */
  fromGregorian(gdate: Date): JalaliDate {
    const g2d = this.gregorianToDay(gdate.getFullYear(), gdate.getMonth() + 1, gdate.getDate());
    return this.dayToJalali(g2d);
  }
  /*
   Converts a date of the Jalali calendar to the Julian Day number.
   @param jy Jalali year (1 to 3100)
   @param jm Jalali month (1 to 12)
   @param jd Jalali day (1 to 29/31)
   @return Julian Day number
   */
  gregorianToDay(gy: number, gm: number, gd: number) {
    let day =
      div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
      div(153 * mod(gm + 9, 12) + 2, 5) +
      gd -
      34840408;
    day = day - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return day;
  }
  /*
   Converts the Julian Day number to a date in the Jalali calendar.
   @param jdn Julian Day number
   @return
   jy: Jalali year (1 to 3100)
   jm: Jalali month (1 to 12)
   jd: Jalali day (1 to 29/31)
   */
  dayToJalali(julianDayNumber: number) {
    const gy = this.dayToGregorion(julianDayNumber).getFullYear(); // Calculate Gregorian year (gy).
    let jalaliYear = gy - 621;
    const r = this.jalCal(jalaliYear);
    const gregorianDay = this.gregorianToDay(gy, 3, r.march);
    let jalaliDay;
    let jalaliMonth;
    let numberOfDays;
    // Find number of days that passed since 1 Farvardin.
    numberOfDays = julianDayNumber - gregorianDay;
    if (numberOfDays >= 0) {
      if (numberOfDays <= 185) {
        // The first 6 months.
        jalaliMonth = 1 + div(numberOfDays, 31);
        jalaliDay = mod(numberOfDays, 31) + 1;
        return new JalaliDate(jalaliYear, jalaliMonth, jalaliDay);
      }
      // The remaining months.
      numberOfDays -= 186;
    } else {
      // Previous Jalali year.
      jalaliYear -= 1;
      numberOfDays += 179;
      if (r.leap === 1) {
        numberOfDays += 1;
      }
    }
    jalaliMonth = 7 + div(numberOfDays, 30);
    jalaliDay = mod(numberOfDays, 30) + 1;
    return new JalaliDate(jalaliYear, jalaliMonth, jalaliDay);
  }
  /**
   * Returns the equivalent JS date value for a give input Jalali date.
   * `jalaliDate` is an Jalali date to be converted to Gregorian.
   */
  toGregorian(jalaliDate: JalaliDate): Date {
    const jYear = jalaliDate.year;
    const jMonth = jalaliDate.month;
    const jDate = jalaliDate.day;
    const jdn = this.jalaliToDay(jYear, jMonth, jDate);
    const date = this.dayToGregorion(jdn);
    date.setHours(6, 30, 3, 200);
    return date;
  }
  /*
   Converts a date of the Jalali calendar to the Julian Day number.
   @param jy Jalali year (1 to 3100)
   @param jm Jalali month (1 to 12)
   @param jd Jalali day (1 to 29/31)
   @return Julian Day number
   */
  jalaliToDay(jYear: number, jMonth: number, jDay: number) {
    const r = this.jalCal(jYear);
    return (
      this.gregorianToDay(r.gy, 3, r.march) +
      (jMonth - 1) * 31 -
      div(jMonth, 7) * (jMonth - 7) +
      jDay -
      1
    );
  }
  /*
   Calculates Gregorian and Julian calendar dates from the Julian Day number
   (jdn) for the period since jdn=-34839655 (i.e. the year -100100 of both
   calendars) to some millions years ahead of the present.
   @param jdn Julian Day number
   @return
   gy: Calendar year (years BC numbered 0, -1, -2, ...)
   gm: Calendar month (1 to 12)
   gd: Calendar day of the month M (1 to 28/29/30/31)
   */
  dayToGregorion(julianDayNumber: number) {
    let j;
    j = 4 * julianDayNumber + 139361631;
    j = j + div(div(4 * julianDayNumber + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gDay = div(mod(i, 153), 5) + 1;
    const gMonth = mod(div(i, 153), 12) + 1;
    const gYear = div(j, 1461) - 100100 + div(8 - gMonth, 6);
    return new Date(gYear, gMonth - 1, gDay);
  }
  /*
   This function determines if the Jalali (Persian) year is
   leap (366-day long) or is the common year (365 days), and
   finds the day in March (Gregorian calendar) of the first
   day of the Jalali year (jy).
   @param jy Jalali calendar year (-61 to 3177)
   @return
   leap: number of years since the last leap year (0 to 4)
   gy: Gregorian year of the beginning of Jalali year
   march: the March day of Farvardin the 1st (1st day of jy)
   @see: http://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm
   @see: http://www.fourmilab.ch/documents/calendar/
   */
  jalCal(jalaliYear: number) {
    // Jalali years starting the 33-year rule.
    const breaks = [
      -61,
      9,
      38,
      199,
      426,
      686,
      756,
      818,
      1111,
      1181,
      1210,
      1635,
      2060,
      2097,
      2192,
      2262,
      2324,
      2394,
      2456,
      3178,
    ];
    const breaksLength = breaks.length;
    const gYear = jalaliYear + 621;
    let leapJ = -14;
    let jp = breaks[0];
    let jm;
    let jump: number | undefined;
    let leap;
    let n;
    let i;
    if (jalaliYear < jp || jalaliYear >= breaks[breaksLength - 1]) {
      throw new Error(`Invalid Jalali year ${jalaliYear}`);
    }
    // Find the limiting years for the Jalali year jalaliYear.
    for (i = 1; i < breaksLength; i += 1) {
      jm = breaks[i];
      jump = jm - jp;
      if (jalaliYear < jm) {
        break;
      }
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jalaliYear - jp;
    // Find the number of leap years from AD 621 to the beginning
    // of the current Jalali year in the Persian calendar.
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump!, 33) === 4 && jump! - n === 4) {
      leapJ += 1;
    }
    // And the same in the Gregorian calendar (until the year gYear).
    const leapG = div(gYear, 4) - div((div(gYear, 100) + 1) * 3, 4) - 150;
    // Determine the Gregorian date of Farvardin the 1st.
    const march = 20 + leapJ - leapG;
    // Find how many years have passed since the last leap year.
    if (jump! - n < 6) {
      n = n - jump! + div(jump! + 4, 33) * 33;
    }
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) {
      leap = 4;
    }
    return {
      leap,
      gy: gYear,
      march,
    };
  }

  getDaysPerMonth(month: number, year: number): number {
    if (month < 6) {
      return 31;
    }
    if (month < 11) {
      return 30;
    }
    if (this.jalCal(year).leap === 0) {
      return 30;
    }
    return 29;
  }
}
function mod(a: number, b: number): number {
  return a - b * Math.floor(a / b);
}
function div(a: number, b: number) {
  return Math.trunc(a / b);
}
function stringReplaceBulk(
  str: string | undefined,
  findArray: string[],
  replaceArray: (string | number)[],
) {
  if (!str) return '';
  const regex: string[] = [];
  const map: any = {};
  findArray.forEach((fItem, index) => {
    regex.push(fItem.replace(/([-[\]{}()*+?.\\^$|#,])/g, '\\$1'));
    map[fItem] = replaceArray[index];
  });
  const regexStr = regex.join('|');
  str = str.replace(new RegExp(regexStr, 'g'), matched => map[matched] as string);
  return str;
}

export const GregorianJalaliHelper = new GregorianJalaliHelperClass();

export const LONG_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const SHORT_MONTHS = [
  'فرو',
  'اردی',
  'خرد',
  'تیر',
  'مرد',
  'شهر',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسف',
];

export const NARROW_MONTHS = [
  'فر',
  'ار',
  'خر',
  'تی',
  'مر',
  'شه',
  'مه',
  'آ',
  'آذ',
  'دی',
  'به',
  'اس',
];
