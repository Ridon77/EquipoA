import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormQrOverlay } from './FormQrOverlay';

const FORM_URL = 'https://example.com/EquipoA/#/';

describe('FormQrOverlay', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('no se renderiza cuando está cerrado', () => {
    render(<FormQrOverlay isOpen={false} formUrl={FORM_URL} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el diálogo accesible con QR y enlace', () => {
    render(<FormQrOverlay isOpen formUrl={FORM_URL} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'Abrir el formulario' })).toHaveAttribute(
      'id',
      dialog.getAttribute('aria-labelledby'),
    );
    expect(
      screen.getByText(
        'Escanee este código QR para acceder al formulario desde otro dispositivo.',
      ),
    ).toHaveAttribute('id', dialog.getAttribute('aria-describedby'));
    expect(document.querySelector('.qr-overlay__svg')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir formulario' })).toHaveAttribute(
      'href',
      FORM_URL,
    );
    expect(
      screen.getByRole('button', { name: 'Volver al formulario' }),
    ).toBeInTheDocument();
  });

  it('cierra con el botón inferior', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<FormQrOverlay isOpen formUrl={FORM_URL} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Volver al formulario' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra con Escape', () => {
    const onClose = vi.fn();

    render(<FormQrOverlay isOpen formUrl={FORM_URL} onClose={onClose} />);

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('bloquea el scroll del body mientras está abierto', () => {
    const { unmount } = render(
      <FormQrOverlay isOpen formUrl={FORM_URL} onClose={vi.fn()} />,
    );

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });
});
