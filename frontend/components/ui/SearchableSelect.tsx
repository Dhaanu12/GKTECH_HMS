'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';

interface Option {
    value: any;
    label: string;
    code?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value: any | any[];
    onChange: (value: any) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    multiple?: boolean;
    disabled?: boolean;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    label,
    error,
    multiple = false,
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.code && option.code.toLowerCase().includes(searchTerm.toLowerCase()))
    );

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
                    w-full px-4 py-2.5 border rounded-lg cursor-pointer flex justify-between items-center bg-white/80 backdrop-blur-sm transition-all
                    ${error ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'}
                    ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex-1 truncate text-sm text-gray-700">
                    {getDisplayValue()}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                        <input
                            type="text"
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    <div className="py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500 text-center">No options found</div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = multiple
                                    ? Array.isArray(value) && value.includes(option.value)
                                    : value === option.value;

                                return (
                                    <div
                                        key={option.value}
                                        className={`
                                            px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                                            ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}
                                        `}
                                        onClick={() => handleSelect(option.value)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{option.label}</span>
                                            {option.code && <span className="text-xs text-gray-500">{option.code}</span>}
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
