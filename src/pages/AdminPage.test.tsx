import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { CONFIG_STORAGE_KEY } from '../config/defaultConfig';
import { AdminPage } from './AdminPage';

function renderAdminPage() {
  return render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>,
  );
}

describe('AdminPage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('muestra la fila Empresa en la tabla', () => {
    renderAdminPage();

    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByLabelText(/Parámetro para Empresa/i)).toBeInTheDocument();
  });

  it('permite modificar el parámetro de empresa', async () => {
    const user = userEvent.setup();

    renderAdminPage();

    const empresaInput = screen.getByLabelText(/Parámetro para Empresa/i);
    await user.clear(empresaInput);
    await user.type(empresaInput, 'companyName');

    expect(empresaInput).toHaveValue('companyName');
  });

  it('guarda y recupera el parámetro de empresa en localStorage', async () => {
    const user = userEvent.setup();

    renderAdminPage();

    const empresaInput = screen.getByLabelText(/Parámetro para Empresa/i);
    await user.clear(empresaInput);
    await user.type(empresaInput, 'companyName');
    await user.click(screen.getByRole('button', { name: 'Guardar configuración' }));

    expect(
      screen.getByText('Configuración guardada correctamente'),
    ).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) ?? '{}');
    expect(stored.parameterMapping.empresa).toBe('companyName');
  });
});
