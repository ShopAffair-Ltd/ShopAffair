import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selected,
  onChange,
  className = ''
}) => {
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

  const selectedOption = options.find(o => o.value === selected);

  return (
    <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
      {label && (
        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-4 py-3 text-xs bg-white border border-purple-100 rounded-xl hover:border-purple-300 transition-colors cursor-pointer"
        >
          <span>{selectedOption ? selectedOption.label : 'Select option'}</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 z-20 w-full mt-1 bg-white border border-purple-100 rounded-xl shadow-lg shadow-purple-600/5 overflow-hidden">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-purple-50 hover:text-purple-700 ${
                  option.value === selected ? 'bg-purple-50/60 font-black text-purple-700' : 'text-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
