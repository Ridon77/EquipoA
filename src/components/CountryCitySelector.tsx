import { useMemo } from 'react';
import type { RefObject } from 'react';
import { FilterableCombobox } from './FilterableCombobox';
import type { CountryOption } from '../types/countries';
import { findCountryOption } from '../services/countriesService';

export interface CountryCitySelectorProps {
  countries: CountryOption[];
  countryValue: string;
  cityValue: string;
  onCountryChange: (countryDisplayName: string) => void;
  onCityChange: (cityDisplayName: string) => void;
  countryError?: string;
  cityError?: string;
  countryRequired?: boolean;
  cityRequired?: boolean;
  disabled?: boolean;
  countryRef?: RefObject<HTMLInputElement | null>;
  cityRef?: RefObject<HTMLInputElement | null>;
}

export function CountryCitySelector({
  countries,
  countryValue,
  cityValue,
  onCountryChange,
  onCityChange,
  countryError,
  cityError,
  countryRequired = false,
  cityRequired = false,
  disabled = false,
  countryRef,
  cityRef,
}: CountryCitySelectorProps) {
  const selectedCountry = useMemo(
    () => findCountryOption(countries, countryValue),
    [countries, countryValue],
  );

  const countryOptions = useMemo(
    () =>
      countries.map((country) => ({
        value: country.displayName,
        label: country.displayName,
      })),
    [countries],
  );

  const cityOptions = useMemo(
    () =>
      (selectedCountry?.cities ?? []).map((city) => ({
        value: city.displayName,
        label: city.displayName,
      })),
    [selectedCountry],
  );

  const hasCountry = Boolean(selectedCountry);

  return (
    <>
      <FilterableCombobox
        id="pais"
        label="País"
        value={countryValue}
        options={countryOptions}
        onChange={onCountryChange}
        placeholder="Escribe para buscar un país"
        disabled={disabled}
        required={countryRequired}
        error={countryError}
        inputRef={countryRef}
      />

      <FilterableCombobox
        id="ciudad"
        label="Ciudad"
        value={hasCountry ? cityValue : ''}
        options={cityOptions}
        onChange={onCityChange}
        placeholder={
          hasCountry
            ? 'Escribe para buscar una ciudad'
            : 'Selecciona primero un país'
        }
        disabled={disabled || !hasCountry}
        required={cityRequired}
        error={cityError}
        inputRef={cityRef}
        className="form-field--full"
        emptyMessage={
          hasCountry
            ? 'No hay coincidencias'
            : 'Selecciona primero un país'
        }
      />
    </>
  );
}
