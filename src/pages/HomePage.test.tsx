import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../config/defaultConfig';
import { QR_FORM_CONFIG } from '../config/qrFormConfig';
import { SUBMIT_WEBHOOK_URL } from '../config/submitEndpoint';
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

const VALID_TEST_CONFIG = {
  ...DEFAULT_CONFIG,
  submitApiUrl: 'https://admin-config.example/webhook',
};

async function waitForForm() {
  expect(
    await screen.findByLabelText(/^Empresa/i),
  ).toBeInTheDocument();
}

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
    saveConfig(VALID_TEST_CONFIG);
    mockRetryCountries.mockClear();
    vi.mocked(submitForm).mockReset();
  });

  it('muestra el campo Empresa con su literal', async () => {
    renderHomePage();
    await waitForForm();
  });

  it('permite enviar con empresa vacía', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success', message: '', advisorName: '', advisorEmail: '' });

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByRole('heading', { name: 'Gracias por contactar con Equipo A' }),
    ).toBeInTheDocument();
  });

  it('conserva valores tras error de formato local', async () => {
    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();

    await user.type(screen.getByLabelText(/^Nombre/i), 'Joan');
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');
    await user.type(screen.getByLabelText(/^Email/i), 'correo-invalido');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByLabelText(/^Nombre/i)).toHaveValue('Joan');
    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('Acme S.L.');
    expect(
      screen.getByText('Introduzca una dirección de correo válida.'),
    ).toBeInTheDocument();
    expect(submitForm).not.toHaveBeenCalled();
  });

  it('permite enviar con campos visualmente obligatorios vacíos', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success', message: '', advisorName: '', advisorEmail: '' });

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();

    const nombre = screen.getByLabelText(/^Nombre/i);
    expect(nombre).not.toHaveAttribute('required');
    expect(nombre).toHaveAttribute('aria-required', 'true');
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(submitForm).toHaveBeenCalledTimes(1);
    expect(submitForm).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: '',
        email: '',
        empresa: '',
        pais: '',
        ciudad: '',
        mensaje: '',
      }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Gracias por contactar con Equipo A' }),
    ).toBeInTheDocument();
  });

  it('conserva valores tras error de proceso', async () => {
    vi.mocked(submitForm).mockResolvedValue({
      kind: 'processError',
      message: 'No ha sido posible procesar la solicitud.',
    });

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();
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

  it('muestra resumen 422 y conserva todos los datos', async () => {
    vi.mocked(submitForm).mockResolvedValue({
      kind: 'validationError',
      status: 422,
      message: 'Revise los datos indicados.',
      missingFields: ['Nombre', 'Mensaje'],
      invalidFields: ['Email'],
    });

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();

    await user.type(screen.getByLabelText(/^Nombre/i), 'Joan');
    await user.type(screen.getByLabelText(/^Email/i), 'joan@example.com');
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');
    await user.type(screen.getByLabelText(/^País/i), 'España');
    await user.click(await screen.findByRole('option', { name: 'España' }));
    await user.type(screen.getByLabelText(/^Ciudad/i), 'Madrid');
    await user.click(await screen.findByRole('option', { name: 'Madrid' }));
    await user.type(screen.getByLabelText(/^Solicitud/i), 'Necesito ayuda');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Necesitamos que revise algunos datos',
      }),
    ).toBeInTheDocument();

    const summary = document.getElementById('validation-summary');
    expect(summary).toHaveFocus();
    expect(
      screen.queryByText(TECHNICAL_ERROR_MESSAGE),
    ).not.toBeInTheDocument();

    expect(screen.getByLabelText(/^Nombre/i)).toHaveValue('Joan');
    expect(screen.getByLabelText(/^Email/i)).toHaveValue('joan@example.com');
    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('Acme S.L.');
    expect(screen.getByLabelText(/^País/i)).toHaveValue('España');
    expect(screen.getByLabelText(/^Ciudad/i)).toHaveValue('Madrid');
    expect(screen.getByLabelText(/^Solicitud/i)).toHaveValue('Necesito ayuda');

    expect(screen.getByLabelText(/^Nombre/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByLabelText(/^Email/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getAllByText('Este campo es obligatorio.')).toHaveLength(2);
    expect(
      screen.getByText('Introduzca una dirección de correo válida.'),
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();

    vi.mocked(submitForm).mockResolvedValue({ kind: 'success', message: '', advisorName: '', advisorEmail: '' });
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByRole('heading', { name: 'Gracias por contactar con Equipo A' }),
    ).toBeInTheDocument();
  });

  it('muestra el mensaje obligatorio en error técnico', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'technicalError' });

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();
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
    await waitForForm();
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await user.click(
      await screen.findByRole('button', { name: 'Volver al formulario' }),
    );

    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('Acme S.L.');
  });

  it('limpia empresa tras nueva solicitud', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success', message: '', advisorName: '', advisorEmail: '' });

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();
    await user.type(screen.getByLabelText(/^Empresa/i), 'Acme S.L.');
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await user.click(
      await screen.findByRole('button', { name: 'Enviar una nueva solicitud' }),
    );

    expect(screen.getByLabelText(/^Empresa/i)).toHaveValue('');
  });

  it('muestra confirmación tras éxito', async () => {
    vi.mocked(submitForm).mockResolvedValue({
      kind: 'success',
      message: 'Lead recibido correctamente',
      advisorName: 'Silvia Mata',
      advisorEmail: 'sm@prueba.com',
    });

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Gracias por contactar con Equipo A',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Lead recibido correctamente')).toBeInTheDocument();
    expect(screen.getByText(/Silvia Mata, miembro de nuestro equipo/)).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'sm@prueba.com' }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole('button', { name: 'Enviar una nueva solicitud' }),
    ).toBeInTheDocument();
  });

  it('muestra el botón QR en el formulario', async () => {
    renderHomePage();
    await waitForForm();

    const qrButton = screen.getByRole('button', {
      name: 'Mostrar código QR del formulario',
    });

    expect(qrButton).toHaveAttribute('type', 'button');
  });

  it('abre y cierra la superposición QR conservando los datos', async () => {
    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();

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
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success', message: '', advisorName: '', advisorEmail: '' });

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await screen.findByRole('heading', { name: 'Gracias por contactar con Equipo A' });

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

  it('normaliza submitApiUrl vacía a la URL fija sin aplicar el preset QR', async () => {
    localStorage.setItem(
      CONFIG_STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_CONFIG,
        submitApiUrl: '',
        requiredFields: {
          ...DEFAULT_CONFIG.requiredFields,
          email: false,
        },
      }),
    );

    renderHomePage('/');
    await waitForForm();

    expect(loadConfig().submitApiUrl).toBe(SUBMIT_WEBHOOK_URL);
    expect(loadConfig().requiredFields.email).toBe(false);
    expect(screen.getByLabelText(/^Email/i)).not.toBeRequired();
  });

  it('usa DEFAULT_CONFIG si no hay configuración guardada', async () => {
    localStorage.clear();

    renderHomePage('/');
    await waitForForm();

    expect(loadConfig()).toEqual(DEFAULT_CONFIG);
    expect(screen.getByLabelText(/^Email/i)).not.toBeRequired();
  });

  it('conserva obligatoriedad personalizada y normaliza el mapeo', async () => {
    const custom = {
      ...DEFAULT_CONFIG,
      submitApiUrl: 'https://custom.example/webhook',
      parameterMapping: {
        ...DEFAULT_CONFIG.parameterMapping,
        nombre: 'CustomName',
      },
      requiredFields: {
        ...DEFAULT_CONFIG.requiredFields,
        email: true,
        empresa: true,
      },
    };
    saveConfig(custom);

    renderHomePage('/');
    await waitForForm();

    expect(loadConfig()).toEqual({
      ...custom,
      submitApiUrl: SUBMIT_WEBHOOK_URL,
      parameterMapping: DEFAULT_CONFIG.parameterMapping,
    });
    expect(screen.getByLabelText(/^Email/i)).toBeRequired();
    expect(screen.getByLabelText(/^Empresa/i)).toBeRequired();
  });

  it('no aplica el preset QR en un acceso normal', async () => {
    saveConfig({
      ...DEFAULT_CONFIG,
      submitApiUrl: 'https://admin-config.example/webhook',
    });

    renderHomePage('/');
    await waitForForm();

    expect(loadConfig().submitApiUrl).toBe(SUBMIT_WEBHOOK_URL);
    expect(loadConfig().requiredFields).toEqual(DEFAULT_CONFIG.requiredFields);
  });

  it('un doble clic en Enviar produce una sola petición', async () => {
    let resolveSubmit!: (value: { kind: 'success', message: '', advisorName: '', advisorEmail: '' }) => void;
    vi.mocked(submitForm).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    const user = userEvent.setup();

    renderHomePage();
    await waitForForm();
    await fillValidForm(user);

    const submitButton = screen.getByRole('button', { name: 'Enviar' });
    await user.dblClick(submitButton);

    expect(submitForm).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(
        /Estamos procesando su solicitud. Este proceso puede tardar unos minutos/,
      ),
    ).toBeInTheDocument();

    resolveSubmit({ kind: 'success', message: '', advisorName: '', advisorEmail: '' });

    expect(
      await screen.findByRole('heading', { name: 'Gracias por contactar con Equipo A' }),
    ).toBeInTheDocument();
  });
});
