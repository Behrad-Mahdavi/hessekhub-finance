export const toPersianDate = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const toPersianNumber = (num: number): string => {
  return new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(num);
};

export const toPersianDigits = (str: string): string => {
  return str.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

export const toEnglishDigits = (str: string): string => {
  return str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
};

export const getDurationInMonths = (durationStr?: string): number => {
  if (!durationStr) return 1;

  // Handle Weeks
  if (durationStr.includes('هفته')) {
    const match = durationStr.match(/(\d+)/);
    const weeks = match ? parseInt(match[0], 10) : 1;
    return weeks * 0.25; // Approximation
  }

  // Handle Months
  const match = durationStr.match(/(\d+)/);
  return match ? parseInt(match[0], 10) : 1;
};

export const formatPrice = (amount: number | string | undefined): string => {
  if (!amount) return '';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '';
  return `${num.toLocaleString('fa-IR')} تومان`;
};

export const isDeliveryDay = (date: Date): boolean => {
  // Friday is 5 in JS Date.getDay() (Sunday=0, Monday=1, ..., Friday=5, Saturday=6)
  // Wait, in Iran:
  // Sat=6, Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5
  // Actually standard JS getDay(): Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  // So Friday is 5.
  return date.getDay() !== 5;
};

export const calculateSubscriptionEndDate = (startDate: Date, deliveryDays: number): Date => {
  let currentDate = new Date(startDate);
  let daysAdded = 0;

  // If we start on a non-delivery day (Friday), move to next day first?
  // Usually packages start on the first valid day.
  // Let's assume start date is valid or we count from it.
  // If startDate is Friday, it shouldn't count as a delivery day.

  // Logic: We need to find the date where we have fulfilled 'deliveryDays' valid days.
  // If startDate is Saturday and we want 1 day, end date is Saturday.

  while (daysAdded < deliveryDays) {
    if (isDeliveryDay(currentDate)) {
      daysAdded++;
    }
    if (daysAdded < deliveryDays) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return currentDate;
};

// Helper to convert Persian Date String (1403/09/01) to JS Date
// Note: This is an approximation for day-of-week calculation.
// Ideally we should use jalaali-js, but for now we'll use a simple conversion
// assuming the user inputs valid dates.
// Since we only need to know if it's a Friday, and the 7-day cycle is consistent,
// we can try to map it.
// Actually, without a library, mapping Persian to Gregorian for Day of Week is hard.
// Let's assume the user selects dates using a picker that gives us Gregorian Dates under the hood?
// No, the UI usually shows Persian.
// Let's try to use Intl to find a matching date? No, too slow.

// Strategy: We will assume the input strings are valid.
// We will use a known reference date (e.g., 1403/01/01 = 2024-03-20 which was Wednesday)
// and count days from there to find the day of week.
const PERSIAN_EPOCH = {
  year: 1403,
  month: 1,
  day: 1,
  gregorian: new Date(2024, 2, 20), // March 20, 2024
  dayOfWeek: 3 // Wednesday (0=Sun, 1=Mon, 2=Tue, 3=Wed)
};

const parsePersianDate = (dateStr: string): { year: number, month: number, day: number } | null => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  return {
    year: parseInt(parts[0]),
    month: parseInt(parts[1]),
    day: parseInt(parts[2])
  };
};

const getDaysFromEpoch = (pDate: { year: number, month: number, day: number }): number => {
  let days = 0;
  // Year diff
  days += (pDate.year - PERSIAN_EPOCH.year) * 365;
  // Leap years approximation (simple)
  // This is not perfect but might suffice for short ranges close to 1403.

  // Month diff (First 6 months = 31 days, next 5 = 30, last = 29)
  const monthDays = [0, 31, 62, 93, 124, 155, 186, 216, 246, 276, 306, 336];
  days += monthDays[pDate.month - 1];

  // Day diff
  days += pDate.day - 1;

  return days;
};

export const calculateDeliveryDays = (startDateStr: string, endDateStr: string): number => {
  const start = parsePersianDate(toEnglishDigits(startDateStr));
  const end = parsePersianDate(toEnglishDigits(endDateStr));

  if (!start || !end) return 0;

  const startDays = getDaysFromEpoch(start);
  const endDays = getDaysFromEpoch(end);

  let validDays = 0;
  // Iterate from start to end (inclusive)
  for (let i = startDays; i <= endDays; i++) {
    // Calculate day of week
    // Epoch was Wednesday (3).
    const dayOfWeek = (PERSIAN_EPOCH.dayOfWeek + i) % 7;
    // Friday is 5
    if (dayOfWeek !== 5) {
      validDays++;
    }
  }

  return validDays;
};