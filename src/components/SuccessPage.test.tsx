import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SuccessPage } from './SuccessPage';

describe('SuccessPage', () => {
  it('muestra la respuesta real de n8n', () => {
    render(
      <SuccessPage
        message="Lead recibido correctamente"
        advisorName="Silvia Mata"
        advisorEmail="sm@prueba.com"
        onNewRequest={() => {}}
      />,
    );

    const title = screen.getByRole('heading', {
      level: 1,
      name: 'Gracias por contactar con Equipo A',
    });
    expect(title).toHaveFocus();
    expect(screen.getByText('Lead recibido correctamente')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Silvia Mata, miembro de nuestro equipo de consultoría, ya está revisando tu consulta.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Silvia Mata')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'sm@prueba.com' })[0],
    ).toHaveAttribute('href', 'mailto:sm@prueba.com');
    expect(
      screen.getByText(/Concertaremos una reunión de 30 minutos/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Gracias por confiar en Equipo A. Estamos deseando ayudarte a avanzar/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Escribir a Silvia Mata' }),
    ).toHaveAttribute('href', 'mailto:sm@prueba.com');
  });

  it('usa fallback sin nombre de asesor', () => {
    render(
      <SuccessPage
        message="Lead recibido correctamente"
        advisorEmail="sm@prueba.com"
        onNewRequest={() => {}}
      />,
    );

    expect(
      screen.getByText(
        'Una persona de nuestro equipo de consultoría ya está revisando tu consulta.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Escribir al asesor' }),
    ).toBeInTheDocument();
  });

  it('usa fallback sin correo válido', () => {
    render(
      <SuccessPage
        advisorName="Silvia Mata"
        advisorEmail="correo-invalido"
        onNewRequest={() => {}}
      />,
    );

    expect(screen.getByText('Silvia Mata')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /Si necesitas añadir información, responde al correo de confirmación/,
      ),
    ).toBeInTheDocument();
  });

  it('limpia al pulsar nueva solicitud', async () => {
    const onNewRequest = vi.fn();
    const user = userEvent.setup();

    render(
      <SuccessPage
        advisorName="Silvia Mata"
        advisorEmail="sm@prueba.com"
        onNewRequest={onNewRequest}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Enviar una nueva solicitud' }),
    );

    expect(onNewRequest).toHaveBeenCalledTimes(1);
  });
});
