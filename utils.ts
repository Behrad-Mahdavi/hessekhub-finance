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