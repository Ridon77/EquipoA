import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('muestra la marca Equipo A', () => {
    render(
      <MemoryRouter>
        <AppShell />
      </MemoryRouter>,
    );

    expect(screen.getByAltText('Equipo A')).toBeInTheDocument();
    expect(screen.getByText('Equipo A', { selector: '.brand__name' })).toBeInTheDocument();
    expect(screen.getByText('Automatizamos procesos. Tú avanzas.')).toBeInTheDocument();
  });
});
