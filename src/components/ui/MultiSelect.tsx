import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    label?: string;
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    label,
    options,
    value,
    onChange,
    placeholder = 'Select options',
    className = ''
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const removeValue = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    const selectedLabels = value.map(v => options.find(o => o.value === v)?.label).filter(Boolean);

    return (
        <div className={`w-full ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-[#0A1C37] mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full min-h-[40px] px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between hover:border-gray-400 focus-within:ring-2 focus-within:ring-[#1673FF] focus-within:border-transparent transition-all"
                >
                    <div className="flex flex-wrap gap-1.5">
                        {selectedLabels.length === 0 && (
                            <span className="text-gray-500 text-sm">{placeholder}</span>
                        )}
                        {selectedLabels.map((label, index) => (
                            <span
                                key={value[index]}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                            >
                                {label}
                                <X
                                    size={12}
                                    className="cursor-pointer hover:text-blue-900"
                                    onClick={(e) => removeValue(e, value[index])}
                                />
                            </span>
                        ))}
                    </div>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {options.length === 0 ? (
                            <div className="p-3 text-sm text-gray-500 text-center">No options available</div>
                        ) : (
                            options.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 text-sm text-gray-700"
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${value.includes(option.value)
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-gray-300 bg-white'
                                        }`}>
                                        {value.includes(option.value) && <Check size={12} />}
                                    </div>
                                    <span>{option.label}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
