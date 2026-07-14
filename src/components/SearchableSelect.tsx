import type { RefObject } from 'react';

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  optional?: boolean;
  error?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  className?: string;
}

export function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  optional = false,
  error,
  inputRef,
  className = '',
}: SearchableSelectProps) {
  const listId = `${id}-options`;
  const errorId = `${id}-error`;

  return (
    <div className={`form-field autocomplete ${className}`.trim()}>
      <label className="form-label" htmlFor={id}>
        {label}
        {optional && <span className="form-label__optional">Opcional</span>}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type="text"
        className="autocomplete__input form-control"
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
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
