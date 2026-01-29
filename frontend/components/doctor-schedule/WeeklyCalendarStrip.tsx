import React, { useRef } from 'react';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface WeeklyCalendarStripProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

export default function WeeklyCalendarStrip({ selectedDate, onDateChange }: WeeklyCalendarStripProps) {
    // Generate dates starting from the Monday of the week containing selectedDate
    const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const dates = Array.from({ length: 14 }, (_, i) => addDays(startDate, i));

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Helper to get random dots for unselected days (mocking event data)
    const getEventDots = (dayIndex: number) => {
        // Deterministic mock pattern based on index
        if (dayIndex % 3 === 0) return ['bg-purple-400']; // One purple dot
        if (dayIndex % 4 === 0) return ['bg-green-400', 'bg-blue-400']; // Green and Blue
        if (dayIndex % 5 === 0) return ['bg-slate-200']; // Standard gray
        return []; // No dots
    };

    return (
        <div className="flex items-center gap-2 lg:gap-8 py-2 overflow-hidden max-w-full">
            {/* Month & Year Indicator */}
            <div className="hidden md:block min-w-[80px] text-left">
                <h3 className="text-lg font-extrabold text-[#1e293b] leading-tight">
                    {format(selectedDate, 'MMMM')}
                </h3>
                <p className="text-sm font-bold text-slate-400">
                    {format(selectedDate, 'yyyy')}
                </p>
            </div>

            <div className="flex bg-transparent items-center gap-2">
                <button
                    onClick={() => onDateChange(addDays(selectedDate, -1))}
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth flex-1 pb-4 pt-4 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {dates.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const dots = getEventDots(index + date.getDate()); // randomize slightly based on date

                    return (
                        <motion.button
                            key={index}
                            onClick={() => onDateChange(date)}
                            whileHover={{ y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex flex-col items-center justify-center gap-1.5 py-3 min-w-[85px] h-[100px] rounded-[1.2rem] transition-all duration-300 ${isSelected
                                ? 'bg-gradient-to-br from-[#3b99fc] to-[#7c6aff] text-white shadow-[0_10px_20px_-5px_rgba(124,106,255,0.4)] scale-105'
                                : 'bg-white text-slate-400 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg hover:text-slate-600'
                                }`}
                        >
                            <span className={`text-[11px] font-bold capitalize tracking-wide ${isSelected ? 'text-white/90' : 'text-slate-400/80'}`}>
                                {format(date, 'EEE')}
                            </span>
                            <span className={`text-2xl font-extrabold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                {format(date, 'd')}
                            </span>

                            {/* Dots Indicator */}
                            <div className="flex items-center gap-1 h-2 mt-1">
                                {isSelected ? (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-white/90" />
                                        <div className="w-1 h-1 rounded-full bg-white/60" />
                                        <div className="w-1 h-1 rounded-full bg-white/40" />
                                    </>
                                ) : (
                                    <>
                                        {dots.map((colorClass, i) => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
                                        ))}
                                        {dots.length === 0 && <div className="w-1 h-1 rounded-full bg-slate-100" />}
                                    </>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <div className="flex bg-transparent items-center gap-2">
                <button
                    onClick={() => onDateChange(addDays(selectedDate, 1))}
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
