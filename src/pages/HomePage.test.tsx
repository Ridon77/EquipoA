import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../config/defaultConfig';
import { QR_FORM_CONFIG } from '../config/qrFormConfig';
import { loadConfig, saveConfig } from '../services/configService';
import { HomePage } from './HomePage';

const { mockRetryCountries } = vi.hoisted(() => ({
  mockRetryCountries: vi.fn(),
}));

vi.mock('../hooks/useCountries', () => ({
  useCountries: () => ({
    countries: [
      {
        iso2: 'ES',
        originalName: 'Spain',
        displayName: 'España',
        cities: [{ originalName: 'Madrid', displayName: 'Madrid' }],
      },
    ],
    loading: false,
    error: null,
    retry: mockRetryCountries,
  }),
}));

vi.mock('../services/submitService', () => ({
  submitForm: vi.fn(),
}));

import { submitForm } from '../services/submitService';

const TECHNICAL_ERROR_MESSAGE =
  'No ha sido posible conectarse con el servicio. Por favor, póngase en contacto con el administrador.';

function renderHomePage(initialEntry = '/') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <HomePage />
    </MemoryRouter>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Nombre/i), 'Joan');
  await user.type(screen.getByLabelText(/^Email/i), 'joan@example.com');
  await user.type(screen.getByLabelText(/^Solicitud/i), 'Necesito ayuda');
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(submitForm).mockReset();
  });

  it('muestra el campo Empresa con su literal', () => {
    renderHomePage();

    expect(screen.getByLabelText(/^Empresa/i)).toBeInTheDocument();
  });

  it('permite enviar con empresa vacía', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();

    renderHomePage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('La solicitud se ha procesado correctamente.'),
    ).toBeInTheDocument();
  });

  it('conserva valores tras error de validación', async () => {
    const user = userEvent.setup();

    renderHomePage();

    await user.type(screen.getByLabelText(/^Nombre/i), 'Joan');
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByLabelText(/^Nombre/i)).toHaveValue('Joan');
    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('Acme S.L.');
    expect(screen.getByText('Introduzca su solicitud.')).toBeInTheDocument();
    expect(submitForm).not.toHaveBeenCalled();
  });

  it('conserva valores tras error de proceso', async () => {
    vi.mocked(submitForm).mockResolvedValue({
      kind: 'processError',
      message: 'No ha sido posible procesar la solicitud.',
    });

    const user = userEvent.setup();

    renderHomePage();
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(
        screen.getByText('No ha sido posible procesar la solicitud.'),
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('Acme S.L.');
  });

  it('muestra el mensaje obligatorio en error técnico', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'technicalError' });

    const user = userEvent.setup();

    renderHomePage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText(TECHNICAL_ERROR_MESSAGE),
    ).toBeInTheDocument();
  });

  it('restaura el formulario al volver desde error técnico', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'technicalError' });

    const user = userEvent.setup();

    renderHomePage();
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await user.click(
      await screen.findByRole('button', { name: 'Volver al formulario' }),
    );

    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('Acme S.L.');
  });

  it('limpia empresa tras nueva solicitud', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();

    renderHomePage();
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await user.click(
      await screen.findByRole('button', { name: 'Nueva solicitud' }),
    );

    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('');
  });

  it('muestra confirmación tras éxito', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();

    renderHomePage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('La solicitud se ha procesado correctamente.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Nueva solicitud' }),
    ).toBeInTheDocument();
  });

  it('muestra el botón QR en el formulario', () => {
    renderHomePage();

    const qrButton = screen.getByRole('button', {
      name: 'Mostrar código QR del formulario',
    });

    expect(qrButton).toHaveAttribute('type', 'button');
  });

  it('abre y cierra la superposición QR conservando los datos', async () => {
    const user = userEvent.setup();

    renderHomePage();

    await user.type(screen.getByLabelText(/^Nombre/i), 'Joan');
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');

    const qrButton = screen.getByRole('button', {
      name: 'Mostrar código QR del formulario',
    });

    await user.click(qrButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir formulario' })).toHaveAttribute(
      'href',
      expect.stringMatching(/#\/\?source=qr$/),
    );

    await user.click(screen.getByRole('button', { name: 'Volver al formulario' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre/i)).toHaveValue('Joan');
    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('Acme S.L.');
    expect(document.body.style.overflow).toBe('');
  });

  it('no muestra el botón QR tras un envío correcto', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();

    renderHomePage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await screen.findByText('La solicitud se ha procesado correctamente.');

    expect(
      screen.queryByRole('button', {
        name: 'Mostrar código QR del formulario',
      }),
    ).not.toBeInTheDocument();
  });

  it('aplica QR_FORM_CONFIG al acceder con source=qr', async () => {
    saveConfig({
      ...DEFAULT_CONFIG,
      submitApiUrl: 'https://incorrecto.example/webhook',
      requiredFields: {
        ...DEFAULT_CONFIG.requiredFields,
        email: false,
      },
    });

    renderHomePage('/?source=qr');

    await waitFor(() => {
      expect(loadConfig()).toEqual(QR_FORM_CONFIG);
    });

    expect(
      screen.queryByText('Preparando el formulario...'),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/i)).toBeRequired();
    expect(JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) ?? '{}')).toEqual(
      QR_FORM_CONFIG,
    );
  });

  it('no aplica el preset QR en un acceso normal', () => {
    saveConfig({
      ...DEFAULT_CONFIG,
      submitApiUrl: 'https://admin-config.example/webhook',
    });

    renderHomePage('/');

    expect(loadConfig().submitApiUrl).toBe(
      'https://admin-config.example/webhook',
    );
  });
});
