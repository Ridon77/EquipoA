import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ValidationSummary } from './ValidationSummary';

describe('ValidationSummary', () => {
  it('muestra título, introducción y texto final empático', () => {
    render(
      <ValidationSummary
        missingFields={['Nombre']}
        invalidFields={['Email']}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Necesitamos que revise algunos datos',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Para poder atender su solicitud correctamente, necesitamos que complete la información pendiente/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Esta información es necesaria para poder tramitar su solicitud adecuadamente/,
      ),
    ).toBeInTheDocument();
  });

  it('usa singular y plural según el número de campos', () => {
    const { rerender } = render(
      <ValidationSummary missingFields={['Nombre']} invalidFields={['Email']} />,
    );

    expect(
      screen.getByText('Complete el siguiente campo obligatorio:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Revise el formato del siguiente campo:'),
    ).toBeInTheDocument();

    rerender(
      <ValidationSummary
        missingFields={['Nombre', 'Mensaje']}
        invalidFields={['Email', 'Empresa']}
      />,
    );

    expect(
      screen.getByText('Complete los siguientes campos obligatorios:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Revise el formato de los siguientes campos:'),
    ).toBeInTheDocument();
  });

  it('no muestra secciones vacías', () => {
    render(
      <ValidationSummary missingFields={['Nombre']} invalidFields={[]} />,
    );

    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(
      screen.queryByText(/Revise el formato/),
    ).not.toBeInTheDocument();
  });

  it('muestra mensaje genérico sin colecciones válidas', () => {
    render(<ValidationSummary missingFields={[]} invalidFields={[]} />);

    expect(
      screen.getByText(
        /No ha sido posible validar la solicitud. Revise la información introducida/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Si el problema continúa, póngase en contacto con el administrador/,
      ),
    ).toBeInTheDocument();
  });

  it('usa listas semánticas y recibe el foco', () => {
    render(
      <ValidationSummary
        missingFields={['Nombre', 'Mensaje']}
        invalidFields={['Email']}
      />,
    );

    const summary = document.getElementById('validation-summary');
    expect(summary).toHaveAttribute('role', 'alert');
    expect(summary).toHaveAttribute('tabindex', '-1');
    expect(summary).toHaveFocus();
    expect(screen.getAllByRole('list')).toHaveLength(2);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
