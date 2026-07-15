import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

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
    retry: vi.fn(),
  }),
}));

vi.mock('../services/submitService', () => ({
  submitForm: vi.fn(),
}));

import { submitForm } from '../services/submitService';

const TECHNICAL_ERROR_MESSAGE =
  'No ha sido posible conectarse con el servicio. Por favor, póngase en contacto con el administrador.';

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Introduzca su nombre/i), 'Joan');
  await user.type(
    screen.getByLabelText(/Introduzca su solicitud/i),
    'Necesito ayuda',
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(submitForm).mockReset();
  });

  it('muestra el campo Empresa con su literal', () => {
    render(<HomePage />);

    expect(
      screen.getByLabelText(/Introduzca su empresa/i),
    ).toBeInTheDocument();
  });

  it('permite enviar con empresa vacía', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();

    render(<HomePage />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText('La solicitud se ha procesado correctamente.'),
    ).toBeInTheDocument();
  });

  it('conserva valores tras error de validación', async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    await user.type(screen.getByLabelText(/Introduzca su nombre/i), 'Joan');
    await user.type(
      screen.getByLabelText(/Introduzca su empresa/i),
      'Acme S.L.',
    );
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(screen.getByLabelText(/Introduzca su nombre/i)).toHaveValue('Joan');
    expect(screen.getByLabelText(/Introduzca su empresa/i)).toHaveValue(
      'Acme S.L.',
    );
    expect(screen.getByText('La solicitud es obligatoria.')).toBeInTheDocument();
    expect(submitForm).not.toHaveBeenCalled();
  });

  it('conserva valores tras error de proceso', async () => {
    vi.mocked(submitForm).mockResolvedValue({
      kind: 'processError',
      message: 'No ha sido posible procesar la solicitud.',
    });

    const user = userEvent.setup();

    render(<HomePage />);
    await user.type(
      screen.getByLabelText(/Introduzca su empresa/i),
      'Acme S.L.',
    );
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(
        screen.getByText('No ha sido posible procesar la solicitud.'),
      ).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Introduzca su empresa/i)).toHaveValue(
      'Acme S.L.',
    );
  });

  it('muestra el mensaje obligatorio en error técnico', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'technicalError' });

    const user = userEvent.setup();

    render(<HomePage />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText(TECHNICAL_ERROR_MESSAGE),
    ).toBeInTheDocument();
  });

  it('restaura el formulario al volver desde error técnico', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'technicalError' });

    const user = userEvent.setup();

    render(<HomePage />);
    await user.type(
      screen.getByLabelText(/Introduzca su empresa/i),
      'Acme S.L.',
    );
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await user.click(
      await screen.findByRole('button', { name: 'Volver al formulario' }),
    );

    expect(screen.getByLabelText(/Introduzca su empresa/i)).toHaveValue(
      'Acme S.L.',
    );
  });

  it('limpia empresa tras nueva solicitud', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();

    render(<HomePage />);
    await user.type(
      screen.getByLabelText(/Introduzca su empresa/i),
      'Acme S.L.',
    );
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await user.click(
      await screen.findByRole('button', { name: 'Nueva solicitud' }),
    );

    expect(screen.getByLabelText(/Introduzca su empresa/i)).toHaveValue('');
  });

  it('muestra confirmación tras éxito', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();

    render(<HomePage />);
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
    render(<HomePage />);

    const qrButton = screen.getByRole('button', {
      name: 'Mostrar código QR del formulario',
    });

    expect(qrButton).toHaveAttribute('type', 'button');
  });

  it('abre y cierra la superposición QR conservando los datos', async () => {
    const user = userEvent.setup();

    render(<HomePage />);

    await user.type(screen.getByLabelText(/Introduzca su nombre/i), 'Joan');
    await user.type(
      screen.getByLabelText(/Introduzca su empresa/i),
      'Acme S.L.',
    );

    const qrButton = screen.getByRole('button', {
      name: 'Mostrar código QR del formulario',
    });

    await user.click(qrButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir formulario' })).toHaveAttribute(
      'href',
      expect.stringMatching(/#\/$/),
    );

    await user.click(screen.getByRole('button', { name: 'Volver al formulario' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Introduzca su nombre/i)).toHaveValue('Joan');
    expect(screen.getByLabelText(/Introduzca su empresa/i)).toHaveValue(
      'Acme S.L.',
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('no muestra el botón QR tras un envío correcto', async () => {
    vi.mocked(submitForm).mockResolvedValue({ kind: 'success' });

    const user = userEvent.setup();

    render(<HomePage />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await screen.findByText('La solicitud se ha procesado correctamente.');

    expect(
      screen.queryByRole('button', {
        name: 'Mostrar código QR del formulario',
      }),
    ).not.toBeInTheDocument();
  });
});
