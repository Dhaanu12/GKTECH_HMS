'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, X, Search, Filter, Users, Calendar } from 'lucide-react';

interface Option {
    value: any;
    label: string;
    code?: string;
    category?: string;
    availability?: {
        status: 'available' | 'next' | 'unavailable';
        text: string;
    };
    stats?: {
        label: string;
        value: number;
        color: 'blue' | 'amber' | 'emerald' | 'slate';
    }[];
    disabled?: boolean;
}

interface SearchableSelectProps {
    options: Option[];
    value: any;
    onChange: (value: any) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    multiple?: boolean;
    disabled?: boolean;
    categories?: string[];
    selectedCategory?: string;
    onCategoryChange?: (category: string) => void;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    label,
    error,
    multiple = false,
    disabled = false,
    categories = [],
    selectedCategory = 'All',
    onCategoryChange
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCategoryMenu, setShowCategoryMenu] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options
        .filter(option => {
            const matchesSearch = option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (option.code && option.code.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = selectedCategory === 'All' ||
                (option.category?.toLowerCase() === selectedCategory?.toLowerCase());

            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => a.label.localeCompare(b.label));

    const handleSelect = (optionValue: any) => {
        if (multiple) {
            const currentValues = Array.isArray(value) ? value : [];
            const isSelected = currentValues.includes(optionValue);
            let newValues;
            if (isSelected) {
                newValues = currentValues.filter((v: any) => v !== optionValue);
            } else {
                newValues = [...currentValues, optionValue];
            }
            onChange(newValues);
        } else {
            onChange(optionValue);
            setIsOpen(false);
        }
    };

    const removeValue = (e: React.MouseEvent, valToRemove: any) => {
        e.stopPropagation();
        if (multiple && Array.isArray(value)) {
            onChange(value.filter((v: any) => v !== valToRemove));
        } else {
            onChange('');
        }
    };

    const getDisplayValue = () => {
        if (!value || (Array.isArray(value) && value.length === 0)) return placeholder;

        if (multiple && Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1">
                    {value.map((val: any) => {
                        const option = options.find(o => o.value === val);
                        return option ? (
                            <span key={val} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                {option.label}
                                <X
                                    className="w-3 h-3 cursor-pointer hover:text-blue-900"
                                    onClick={(e) => removeValue(e, val)}
                                />
                            </span>
                        ) : null;
                    })}
                </div>
            );
        } else {
            const option = options.find(o => o.value === value);
            return option ? option.label : placeholder;
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

            <div
                className={`
                    w-full px-4 h-[52px] border rounded-xl cursor-pointer flex justify-between items-center bg-white/80 backdrop-blur-sm transition-all
                    ${error ? 'border-red-500' : 'border-slate-200 hover:border-blue-500 shadow-sm'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex-1 truncate text-sm font-bold text-slate-700">
                    {getDisplayValue()}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 z-50">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="p-2 sticky top-0 bg-white border-b border-slate-100 z-10 rounded-t-xl">
                            <div className="relative mb-0">
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-28 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                    placeholder="Search by name or specialization..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search className="w-4 h-4" />
                                </div>

                                {/* Filter Button */}
                                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCategoryMenu(!showCategoryMenu);
                                        }}
                                        className={`
                                        pl-3 pr-2 py-1.5 rounded-md transition-all flex items-center gap-2 border
                                        ${showCategoryMenu || selectedCategory !== 'All'
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}
                                    `}
                                        title="Filter by Department"
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                                            {selectedCategory === 'All' ? 'Department' : selectedCategory}
                                        </span>
                                        <Filter className={`w-3 h-3 ${showCategoryMenu || selectedCategory !== 'All' ? 'text-blue-100' : 'text-slate-400'}`} />
                                    </button>

                                    {selectedCategory !== 'All' && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCategoryChange?.('All');
                                                setShowCategoryMenu(false);
                                            }}
                                            className="p-1.5 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors border border-blue-600 shadow-sm"
                                            title="Clear filter"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>

                                {/* Category Selection Menu - Positioned OVER the content */}
                                {showCategoryMenu && categories.length > 0 && (
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
                                        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Filter Department
                                            </p>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto py-1">
                                            {categories.map((category) => (
                                                <button
                                                    key={category}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCategoryChange?.(category);
                                                        setShowCategoryMenu(false);
                                                    }}
                                                    className={`
                                                    w-full px-4 py-2 text-left text-sm flex items-center justify-between transition-colors
                                                    ${selectedCategory === category
                                                            ? 'bg-blue-50 text-blue-600 font-bold'
                                                            : 'text-slate-600 hover:bg-slate-50'}
                                                `}
                                                >
                                                    <span>{category}</span>
                                                    {selectedCategory === category && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="py-1 max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-8 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                        <X className="w-6 h-6" />
                                    </div>
                                    <span>No options found</span>
                                </div>
                            ) : (
                                filteredOptions.map((option) => {
                                    const isSelected = multiple
                                        ? Array.isArray(value) && value.includes(option.value)
                                        : value === option.value;

                                    return (
                                        <div
                                            key={option.value}
                                            className={`
                                            px-4 py-3.5 flex items-stretch justify-between gap-3 transition-all border-b border-slate-100/60 last:border-0
                                            ${option.disabled ? 'cursor-not-allowed bg-slate-50 opacity-60' : 'cursor-pointer'}
                                            ${isSelected ? 'bg-blue-50/70' : (!option.disabled && 'hover:bg-slate-50/80')}
                                        `}
                                            onClick={() => !option.disabled && handleSelect(option.value)}
                                        >
                                            {/* Left: Doctor info */}
                                            <div className={`flex flex-col justify-center min-w-0 flex-1 ${option.disabled ? 'opacity-50' : ''}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[14px] font-bold truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{option.label}</span>
                                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                                </div>
                                                {option.code && (
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mt-0.5">{option.code}</span>
                                                )}
                                                {option.availability && (
                                                    <div className={`flex items-center gap-1.5 mt-1 text-[11px] font-semibold ${option.availability.status === 'available'
                                                        ? 'text-emerald-600'
                                                        : option.availability.status === 'next'
                                                            ? 'text-amber-600'
                                                            : 'text-red-400'
                                                        }`}>
                                                        <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${option.availability.status === 'available'
                                                            ? 'bg-emerald-500'
                                                            : option.availability.status === 'next'
                                                                ? 'bg-amber-500'
                                                                : 'bg-red-400'
                                                            }`} />
                                                        <span>{option.availability.text}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Stats */}
                                            {option.stats && option.stats.length > 0 && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {option.stats.map((stat, idx) => {
                                                        const isActive = stat.value > 0;
                                                        const styles = {
                                                            blue: {
                                                                bg: isActive ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200/60',
                                                                icon: isActive ? 'text-blue-600' : 'text-slate-400',
                                                                num: isActive ? 'text-blue-800' : 'text-slate-600',
                                                                label: isActive ? 'text-blue-700/90' : 'text-slate-500',
                                                            },
                                                            amber: {
                                                                bg: isActive ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200/60',
                                                                icon: isActive ? 'text-amber-600' : 'text-slate-400',
                                                                num: isActive ? 'text-amber-800' : 'text-slate-600',
                                                                label: isActive ? 'text-amber-700/90' : 'text-slate-500',
                                                            },
                                                            emerald: {
                                                                bg: isActive ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200/60',
                                                                icon: isActive ? 'text-emerald-600' : 'text-slate-400',
                                                                num: isActive ? 'text-emerald-800' : 'text-slate-600',
                                                                label: isActive ? 'text-emerald-700/90' : 'text-slate-500',
                                                            },
                                                            slate: {
                                                                bg: 'bg-slate-50 border-slate-200/60',
                                                                icon: 'text-slate-400',
                                                                num: 'text-slate-600',
                                                                label: 'text-slate-500',
                                                            },
                                                        };
                                                        const s = styles[stat.color];
                                                        const isQueue = stat.label.toLowerCase().includes('queue');
                                                        return (
                                                            <div
                                                                key={idx}
                                                                className={`flex flex-col items-center justify-center rounded-xl border px-3 py-1.5 min-w-[54px] ${s.bg}`}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    {isQueue ? (
                                                                        <Users className={`w-3.5 h-3.5 ${s.icon}`} />
                                                                    ) : (
                                                                        <Calendar className={`w-3.5 h-3.5 ${s.icon}`} />
                                                                    )}
                                                                    <span className={`text-sm font-bold tabular-nums leading-none ${s.num}`}>{stat.value}</span>
                                                                </div>
                                                                <span className={`text-[9px] font-bold uppercase tracking-[0.05em] mt-0.5 ${s.label}`}>{stat.label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
