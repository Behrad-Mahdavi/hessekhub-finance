import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { toJalaali, toGregorian, jalaaliMonthLength, PERSIAN_MONTHS, PERSIAN_WEEK_DAYS } from '../utils/jalaali';
import { toPersianNumber, toEnglishDigits, toPersianDigits } from '../utils';

interface PersianDatePickerProps {
    value: string; // Format: "1403/09/01"
    onChange: (date: string) => void;
    label?: string;
    placeholder?: string;
    minDate?: string;
    maxDate?: string;
}

const PersianDatePicker: React.FC<PersianDatePickerProps> = ({
    value,
    onChange,
    label,
    placeholder = 'انتخاب تاریخ',
    minDate,
    maxDate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse initial value or default to today
    const getInitialDate = () => {
        if (value) {
            const englishValue = toEnglishDigits(value);
            const parts = englishValue.split('/');
            if (parts.length === 3) {
                return { y: parseInt(parts[0]), m: parseInt(parts[1]), d: parseInt(parts[2]) };
            }
        }
        const today = toJalaali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
        return { y: today.jy, m: today.jm, d: today.jd };
    };

    const [viewDate, setViewDate] = useState(getInitialDate()); // The month we are viewing
    const [selectedDate, setSelectedDate] = useState(getInitialDate()); // The selected date

    useEffect(() => {
        if (value) {
            const englishValue = toEnglishDigits(value);
            const parts = englishValue.split('/');
            if (parts.length === 3) {
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]);
                const d = parseInt(parts[2]);
                setSelectedDate({ y, m, d });
                // Only update view if the popup is closed or if it's a completely new value from outside
                if (!isOpen) {
                    setViewDate({ y, m, d });
                }
            }
        }
    }, [value, isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePrevMonth = () => {
        let newM = viewDate.m - 1;
        let newY = viewDate.y;
        if (newM < 1) {
            newM = 12;
            newY -= 1;
        }
        setViewDate({ ...viewDate, y: newY, m: newM });
    };

    const handleNextMonth = () => {
        let newM = viewDate.m + 1;
        let newY = viewDate.y;
        if (newM > 12) {
            newM = 1;
            newY += 1;
        }
        setViewDate({ ...viewDate, y: newY, m: newM });
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewDate({ ...viewDate, y: parseInt(e.target.value) });
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewDate({ ...viewDate, m: parseInt(e.target.value) });
    };

    const handleDayClick = (day: number) => {
        const newDateStr = `${viewDate.y}/${viewDate.m.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
        onChange(toPersianDigits(newDateStr));
        setIsOpen(false);
    };

    // Generate days
    const daysInMonth = jalaaliMonthLength(viewDate.y, viewDate.m);

    // Find start day of week (0=Saturday, 6=Friday for Persian context? No.)
    // jalaali.ts doesn't give day of week directly.
    // We convert the 1st of the month to Gregorian, then check JS Date day.
    // JS Date: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat.
    // We want Persian week: Sat=0, Sun=1, ..., Fri=6.
    const firstDayGregorian = toGregorian(viewDate.y, viewDate.m, 1);
    const firstDayDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
    const jsDay = firstDayDate.getDay(); // 0=Sun, 6=Sat

    // Map JS Day to Persian Day Index (Sat=0, Sun=1, ..., Fri=6)
    // Sat(6) -> 0
    // Sun(0) -> 1
    // Mon(1) -> 2
    // ...
    // Fri(5) -> 6
    const startDayOfWeek = (jsDay + 1) % 7;

    const days = [];
    // Empty slots
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    // Generate Year Options (Current Year +/- 10)
    const currentYear = toJalaali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()).jy;
    const years = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        years.push(i);
    }

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>}

            <div
                className="flex items-center gap-2 w-full p-2 border border-slate-300 rounded-lg cursor-pointer bg-white hover:border-indigo-400 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <CalendarIcon className="w-5 h-5 text-slate-400" />
                <span className={`flex-1 text-sm ${value ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                    {value ? (() => {
                        const englishValue = toEnglishDigits(value);
                        const parts = englishValue.split('/');
                        if (parts.length !== 3) return value;
                        return toPersianNumber(parseInt(parts[2])) + ' ' + PERSIAN_MONTHS[parseInt(parts[1]) - 1] + ' ' + toPersianNumber(parseInt(parts[0]));
                    })() : placeholder}
                </span>
            </div>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-72 animate-fade-in-up">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        <div className="flex gap-2">
                            <select
                                value={viewDate.m}
                                onChange={handleMonthChange}
                                className="text-sm font-bold text-slate-700 bg-transparent cursor-pointer outline-none hover:text-indigo-600"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {PERSIAN_MONTHS.map((month, index) => (
                                    <option key={index} value={index + 1}>{month}</option>
                                ))}
                            </select>
                            <select
                                value={viewDate.y}
                                onChange={handleYearChange}
                                className="text-sm font-bold text-slate-700 bg-transparent cursor-pointer outline-none hover:text-indigo-600"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{toPersianNumber(year)}</option>
                                ))}
                            </select>
                        </div>

                        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 mb-2 text-center">
                        {PERSIAN_WEEK_DAYS.map(day => (
                            <div key={day} className="text-xs text-slate-400 font-bold">{day}</div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            if (day === null) return <div key={`empty-${index}`} />;

                            const isSelected = selectedDate.y === viewDate.y && selectedDate.m === viewDate.m && selectedDate.d === day;
                            const isToday = false; // Can implement if needed

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                    h-8 w-8 rounded-full text-sm font-bold flex items-center justify-center transition-all
                    ${isSelected
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                            : 'text-slate-700 hover:bg-slate-100'
                                        }
                  `}
                                >
                                    {toPersianNumber(day)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersianDatePicker;
