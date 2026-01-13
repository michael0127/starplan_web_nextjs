'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './SearchableSelect.module.css';

export interface SelectOption {
  id: string;
  label: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  label: string;
  placeholder?: string;
  options: SelectOption[];
  value: SelectOption | null;
  onChange: (option: SelectOption | null) => void;
  onSearch?: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
}

export default function SearchableSelect({
  label,
  placeholder = 'Search or select...',
  options,
  value,
  onChange,
  onSearch,
  loading = false,
  disabled = false,
  required = false,
  hint,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter options based on search query (client-side filtering)
  const filteredOptions = searchQuery && !onSearch
    ? options.filter(opt => 
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Debounced search handler
  useEffect(() => {
    if (!onSearch) return;
    
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex]);

  const handleSelect = (option: SelectOption) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const copyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value?.id) {
      navigator.clipboard.writeText(value.id);
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <label className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>
      
      <div 
        className={`${styles.inputWrapper} ${isOpen ? styles.focused : ''} ${disabled ? styles.disabled : ''}`}
        onClick={handleInputClick}
      >
        {value ? (
          <div className={styles.selectedValue}>
            <span className={styles.selectedLabel}>{value.label}</span>
            <div className={styles.actions}>
              <button 
                type="button"
                className={styles.copyBtn}
                onClick={copyId}
                title="Copy ID"
              >
                <CopyIcon />
              </button>
              {!disabled && (
                <button 
                  type="button"
                  className={styles.clearBtn}
                  onClick={handleClear}
                  title="Clear"
                >
                  <ClearIcon />
                </button>
              )}
            </div>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        )}
        
        {loading && <div className={styles.loader} />}
        
        <div className={styles.chevron}>
          <ChevronIcon />
        </div>
      </div>

      {hint && <p className={styles.hint}>{hint}</p>}

      {value && (
        <p className={styles.idDisplay}>
          ID: <code>{value.id}</code>
        </p>
      )}

      {isOpen && !disabled && (
        <ul className={styles.dropdown} ref={listRef}>
          {!value && (
            <li className={styles.searchHeader}>
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder="Type to search..."
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </li>
          )}
          
          {loading ? (
            <li className={styles.loadingItem}>Loading...</li>
          ) : filteredOptions.length === 0 ? (
            <li className={styles.noResults}>
              {searchQuery ? 'No results found' : 'No options available'}
            </li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.id}
                className={`${styles.option} ${index === highlightedIndex ? styles.highlighted : ''} ${value?.id === option.id ? styles.selected : ''}`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className={styles.optionLabel}>{option.label}</span>
                <span className={styles.optionId}>{option.id.slice(0, 8)}...</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

// Icons
function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 4V2.5C10 1.67 9.33 1 8.5 1H2.5C1.67 1 1 1.67 1 2.5V8.5C1 9.33 1.67 10 2.5 10H4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
