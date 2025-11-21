export const toPersianDate = (date: Date = new Date()): string => {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

export const toPersianNumber = (num: number): string => {
  return new Intl.NumberFormat('fa-IR').format(num);
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