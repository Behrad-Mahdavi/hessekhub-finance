/*
  Jalaali JavaScript Library - Core Logic
  Based on jalaali-js (https://github.com/jalaali/jalaali-js)
  Ported to TypeScript for Hess-e-Khub Finance
*/

interface JalaaliDate {
    jy: number;
    jm: number;
    jd: number;
}

interface GregorianDate {
    gy: number;
    gm: number;
    gd: number;
}

/**
 * Converts a Gregorian date to Jalaali.
 */
export function toJalaali(gy: number, gm: number, gd: number): JalaaliDate {
    if (Object.prototype.toString.call(gy) === '[object Date]') {
        const d = gy as unknown as Date;
        gd = d.getDate();
        gm = d.getMonth() + 1;
        gy = d.getFullYear();
    }
    return d2j(g2d(gy, gm, gd));
}

/**
 * Converts a Jalaali date to Gregorian.
 */
export function toGregorian(jy: number, jm: number, jd: number): GregorianDate {
    return d2g(j2d(jy, jm, jd));
}

/**
 * Checks whether a Jalaali date is valid or not.
 */
export function isValidJalaaliDate(jy: number, jm: number, jd: number): boolean {
    return jy >= -61 && jy <= 3177 &&
        jm >= 1 && jm <= 12 &&
        jd >= 1 && jd <= jalaaliMonthLength(jy, jm);
}

/**
 * Is this a leap year or not?
 */
export function isLeapJalaaliYear(jy: number): boolean {
    return jalCal(jy).leap === 0;
}

/**
 * Number of days in a given month in a Jalaali year.
 */
export function jalaaliMonthLength(jy: number, jm: number): number {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    if (isLeapJalaaliYear(jy)) return 30;
    return 29;
}

/*
  Internal helper functions
*/

function jalCal(jy: number) {
    // Jalaali years starting the 33-year rule.
    const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210
        , 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178
    ];
    const bl = breaks.length;
    const gy = jy + 621;
    let leapJ = -14;
    let jp = breaks[0];
    let jump = 0; // default value

    if (jy < jp || jy >= breaks[bl - 1])
        throw new Error('Invalid Jalaali year ' + jy);

    for (let i = 1; i < bl; i += 1) {
        const jm = breaks[i];
        jump = jm - jp;
        if (jy < jm)
            break;
        leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
        jp = jm;
    }
    let n = jy - jp;

    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4)
        leapJ += 1;

    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;

    return { leap: 0, gy: gy, march: 20 + leapJ - leapG };
}

function j2d(jy: number, jm: number, jd: number): number {
    const r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JalaaliDate {
    const gy = d2g(jdn).gy;
    let jy = gy - 621;
    const r = jalCal(jy);
    const jdn1f = g2d(gy, 3, r.march);
    let jd: number, jm: number, k: number;

    k = jdn - jdn1f;
    if (k >= 0) {
        if (k <= 185) {
            jm = 1 + div(k, 31);
            jd = mod(k, 31) + 1;
            return { jy: jy, jm: jm, jd: jd };
        } else {
            k -= 186;
        }
    } else {
        jy -= 1;
        k += 179;
        if (r.leap === 1)
            k += 1;
    }
    jm = 7 + div(k, 30);
    jd = mod(k, 30) + 1;
    return { jy: jy, jm: jm, jd: jd };
}

function g2d(gy: number, gm: number, gd: number): number {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
        + div(153 * mod(gm + 9, 12) + 2, 5)
        + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
}

function d2g(jdn: number): GregorianDate {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
}

function div(a: number, b: number): number {
    return ~~(a / b);
}

function mod(a: number, b: number): number {
    return a - ~~(a / b) * b;
}

export const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const PERSIAN_WEEK_DAYS = [
    'ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'
];
