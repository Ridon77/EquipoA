import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import { matchesPartialText } from '../utils/filterOptions';

export interface FilterableOption {
  value: string;
  label: string;
}

interface FilterableComboboxProps {
  id: string;
  label: string;
  value: string;
  options: FilterableOption[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
  emptyMessage?: string;
}

export function FilterableCombobox({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  inputRef,
  className = '',
  emptyMessage = 'No hay coincidencias',
}: FilterableComboboxProps) {
  const listboxId = useId();
  const errorId = `${id}-error`;
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const isEditingRef = useRef(false);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (!isEditingRef.current) {
      setQuery(value);
    }
  }, [value]);

  useEffect(() => {
    if (!inputRef) {
      return;
    }

    inputRef.current = internalInputRef.current;
  }, [inputRef]);

  const filteredOptions = useMemo(
    () => options.filter((option) => matchesPartialText(option.label, query)),
    [options, query],
  );

  const commitValue = (nextValue: string) => {
    isEditingRef.current = false;
    setQuery(nextValue);
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(nextValue);
  };

  const selectOption = (option: FilterableOption) => {
    commitValue(option.value);
  };

  const handleInputChange = (nextQuery: string) => {
    isEditingRef.current = true;
    setQuery(nextQuery);
    setIsOpen(true);
    setActiveIndex(nextQuery.trim() === '' ? -1 : 0);

    if (nextQuery.trim() === '') {
      onChange('');
      return;
    }

    // Mientras escribe, no confirma un valor antiguo; limpia el form
    // pero conserva el texto local en el input.
    if (value) {
      onChange('');
    }
  };

  const handleBlur = () => {
    window.setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        isEditingRef.current = false;
        setIsOpen(false);
        setActiveIndex(-1);

        const exactMatch = options.find(
          (option) =>
            normalizeEquals(option.label, query) ||
            normalizeEquals(option.value, query),
        );

        if (exactMatch) {
          commitValue(exactMatch.value);
          return;
        }

        if (filteredOptions.length === 1 && query.trim() !== '') {
          commitValue(filteredOptions[0].value);
          return;
        }

        setQuery(value);
      }
    }, 0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        filteredOptions.length === 0
          ? -1
          : Math.min(current + 1, filteredOptions.length - 1),
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen && activeIndex >= 0) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option) {
        selectOption(option);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      setQuery(value);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`form-field autocomplete ${className}`.trim()}
    >
      <label className="form-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="form-label__required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : (
          <span className="form-label__optional">Opcional</span>
        )}
      </label>
      <input
        ref={internalInputRef}
        id={id}
        name={id}
        type="text"
        role="combobox"
        className="autocomplete__input form-control"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
        aria-required={required || undefined}
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => handleInputChange(event.target.value)}
        onFocus={() => {
          setIsOpen(true);
          setActiveIndex(query.trim() === '' ? -1 : 0);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {isOpen && !disabled && (
        <ul
          id={listboxId}
          className="autocomplete__menu"
          role="listbox"
          aria-label={label}
        >
          {filteredOptions.length === 0 ? (
            <li className="autocomplete__empty" role="presentation">
              {emptyMessage}
            </li>
          ) : (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={
                  index === activeIndex
                    ? 'autocomplete__option autocomplete__option--active'
                    : 'autocomplete__option'
                }
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectOption(option);
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function normalizeEquals(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('es') === b.trim().toLocaleLowerCase('es');
}
