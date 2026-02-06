import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface MultiInputTagsProps {
    value: string; // Comma separated values
    onChange: (value: string) => void;
    placeholder?: string;
    validate?: (val: string) => boolean;
    maxLength?: number;
}

const MultiInputTags: React.FC<MultiInputTagsProps> = ({
    value,
    onChange,
    placeholder = "Type and press Enter",
    validate,
    maxLength
}) => {
    // Current input value being typed
    const [inputValue, setInputValue] = useState('');

    // Convert comma-separated string to array of tags
    const tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : [];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    const addTag = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        // Validation logic
        if (validate && !validate(trimmed)) {
            // Optional: Shake effect or visual feedback? For now just ignore valid input
            return;
        }

        // Add to tags (avoid duplicates?)
        if (!tags.includes(trimmed)) {
            const newTags = [...tags, trimmed];
            onChange(newTags.join(', '));
        }
        setInputValue('');
    };

    const removeTag = (indexToRemove: number) => {
        const newTags = tags.filter((_, index) => index !== indexToRemove);
        onChange(newTags.join(', '));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Strict digit-only input check if needed, but we can do that via props validation or simple regex here since it's specific for phones
        // The user specifically asked for "digit field".
        // Let's allow only digits here based on the requirement context, or keep it generic.
        // Given the requirement "digit field of max 15 digits", let's enforce it here or via a passed regex check.
        // For Reusability, let's just let the typed value be whatever, but block if maxLength is hit

        if (maxLength && val.length > maxLength) return;

        // Specific requirement: "digit field". Restrict to numbers only.
        if (!/^\d*$/.test(val)) return;

        setInputValue(val);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 w-full px-4 py-2 bg-white border border-red-200 rounded-xl focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all min-h-[46px]">
            {tags.map((tag, index) => (
                <span key={index} className="flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-lg text-sm font-medium border border-red-100">
                    {tag}
                    <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="hover:bg-red-100 rounded-full p-0.5 transition-colors"
                    >
                        <X size={12} />
                    </button>
                </span>
            ))}
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={addTag} // Also add on click away
                className="flex-1 outline-none bg-transparent min-w-[100px] text-sm text-slate-700 placeholder:text-slate-400"
                placeholder={tags.length === 0 ? placeholder : ""}
            />
        </div>
    );
};

export default MultiInputTags;
