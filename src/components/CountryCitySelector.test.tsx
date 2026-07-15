import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CountryCitySelector } from './CountryCitySelector';
import type { CountryOption } from '../types/countries';

const countries: CountryOption[] = [
  {
    iso2: 'DE',
    originalName: 'Germany',
    displayName: 'Alemania',
    cities: [
      { originalName: 'Berlin', displayName: 'Berlin' },
      { originalName: 'Munich', displayName: 'Múnich' },
    ],
  },
  {
    iso2: 'EC',
    originalName: 'Ecuador',
    displayName: 'Ecuador',
    cities: [{ originalName: 'Quito', displayName: 'Quito' }],
  },
  {
    iso2: 'ES',
    originalName: 'Spain',
    displayName: 'España',
    cities: [{ originalName: 'Madrid', displayName: 'Madrid' }],
  },
];

describe('CountryCitySelector', () => {
  it('filtra países por coincidencia parcial sin saltar al escribir', async () => {
    const onCountryChange = vi.fn();
    const onCityChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CountryCitySelector
        countries={countries}
        countryValue=""
        cityValue=""
        onCountryChange={onCountryChange}
        onCityChange={onCityChange}
      />,
    );

    const countryInput = screen.getByLabelText(/^País/i);
    const cityInput = screen.getByLabelText(/^Ciudad/i);

    expect(countryInput.tagName).toBe('INPUT');
    expect(cityInput).toBeDisabled();

    await user.type(countryInput, 'aña');

    expect(countryInput).toHaveValue('aña');
    expect(screen.getByRole('option', { name: 'España' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Ecuador' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Alemania' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'España' }));
    expect(onCountryChange).toHaveBeenCalledWith('España');
  });

  it('habilita ciudad al seleccionar país y filtra ciudades', async () => {
    const onCountryChange = vi.fn();
    const onCityChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <CountryCitySelector
        countries={countries}
        countryValue=""
        cityValue=""
        onCountryChange={onCountryChange}
        onCityChange={onCityChange}
      />,
    );

    rerender(
      <CountryCitySelector
        countries={countries}
        countryValue="Alemania"
        cityValue=""
        onCountryChange={onCountryChange}
        onCityChange={onCityChange}
      />,
    );

    const cityInput = screen.getByLabelText(/^Ciudad/i);
    expect(cityInput).not.toBeDisabled();

    await user.type(cityInput, 'ún');
    expect(screen.getByRole('option', { name: 'Múnich' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Berlin' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Múnich' }));
    expect(onCityChange).toHaveBeenCalledWith('Múnich');
  });
});
