import type { RefObject } from 'react';

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  error,
  inputRef,
}: SearchableSelectProps) {
  const listId = `${id}-options`;
  const errorId = `${id}-error`;

  return (
    <label htmlFor={id}>
      {label}
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {error && (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
