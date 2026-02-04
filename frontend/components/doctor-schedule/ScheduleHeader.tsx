import React from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid, List, BarChart3, Plus } from 'lucide-react';
import { ViewMode } from '../../app/doctor-schedule/page';

interface ScheduleHeaderProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
    viewMode: ViewMode;
    onViewChange: (mode: ViewMode) => void;
    onAddClick?: () => void;
}

export default function ScheduleHeader({ selectedDate, onDateChange, viewMode, onViewChange, onAddClick }: ScheduleHeaderProps) {

    const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
    const handleNextDay = () => onDateChange(addDays(selectedDate, 1));

    const isFuturistic = viewMode === 'futuristic';

    return (
        <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${isFuturistic
            ? 'bg-slate-900/80 border-cyan-500/30 shadow-[0_4px_20px_-5px_rgba(6,182,212,0.3)]'
            : 'bg-white/90 border-gray-200 shadow-sm'
            }`}>
            <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Title & Branding */}
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isFuturistic ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-600 text-white'}`}>
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className={`text-xl font-bold tracking-tight ${isFuturistic ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500' : 'text-gray-900'}`}>
                            Doctor Schedule
                        </h1>
                        <p className={`text-sm ${isFuturistic ? 'text-slate-400' : 'text-gray-500'}`}>
                            Manage appointments & availability
                        </p>
                    </div>
                </div>

                {/* Date Navigation */}
                <div className={`flex items-center gap-4 px-4 py-2 rounded-full border relative group ${isFuturistic ? 'bg-slate-800/50 border-cyan-500/20' : 'bg-gray-100 border-gray-200'
                    }`}>
                    <button onClick={handlePrevDay} className={`p-1 rounded-full hover:bg-black/10 transition ${isFuturistic ? 'hover:text-cyan-400' : ''}`}>
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center min-w-[160px] relative cursor-pointer">
                        <input
                            type="date"
                            className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                            value={format(selectedDate, 'yyyy-MM-dd')}
                            onChange={(e) => {
                                if (e.target.value) onDateChange(new Date(e.target.value));
                            }}
                        />
                        <span className={`block font-semibold group-hover:underline decoration-dashed underline-offset-4 ${isFuturistic ? 'text-cyan-50' : 'text-gray-900'}`}>
                            {format(selectedDate, 'EEEE')}
                        </span>
                        <span className={`text-sm block ${isFuturistic ? 'text-slate-400' : 'text-gray-500'}`}>
                            {format(selectedDate, 'MMMM do, yyyy')}
                        </span>
                        <span className={`text-[10px] absolute -bottom-3 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity ${isFuturistic ? 'text-cyan-500' : 'text-blue-500'}`}>
                            Click to change
                        </span>
                    </div>

                    <button onClick={handleNextDay} className={`p-1 rounded-full hover:bg-black/10 transition ${isFuturistic ? 'hover:text-cyan-400' : ''}`}>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* View Switcher */}
                <div className={`flex items-center p-1 rounded-lg border ${isFuturistic ? 'bg-slate-800 border-cyan-500/20' : 'bg-gray-100 border-gray-200'
                    }`}>
                    <button
                        onClick={() => onViewChange('futuristic')}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'futuristic'
                            ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        title="Futuristic Mode"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:inline">Cyber</span>
                    </button>
                    <button
                        onClick={() => onViewChange('clean')}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'clean'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : isFuturistic ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        title="Clean Mode"
                    >
                        <List className="w-4 h-4" />
                        <span className="hidden sm:inline">Clean</span>
                    </button>
                    <button
                        onClick={() => onViewChange('dashboard')}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'dashboard'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : isFuturistic ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        title="Dashboard Mode"
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span className="hidden sm:inline">Data</span>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    {onAddClick && (
                        <button
                            onClick={onAddClick}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${isFuturistic
                                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg hover:shadow-cyan-500/30'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                }`}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Schedule</span>
                        </button>
                    )}
                </div>

            </div>
        </header>
    );
}
