import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from '../config/defaultConfig';
import { OFFICIAL_PARAMETER_MAPPING } from '../config/officialParameterMapping';
import { SUBMIT_WEBHOOK_URL } from '../config/submitEndpoint';
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

  it('muestra la URL de envío fija en solo lectura', () => {
    renderAdminPage();

    const submitUrl = screen.getByLabelText(/URL de la API de envío/i);
    expect(submitUrl).toHaveValue(SUBMIT_WEBHOOK_URL);
    expect(submitUrl).toHaveAttribute('readonly');
    expect(
      screen.getByText(
        /La URL de envío está definida por la aplicación y no puede modificarse/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/Timeout/i)).not.toBeInTheDocument();
  });

  it('muestra la ayuda de obligatoriedad solo visual', () => {
    renderAdminPage();

    expect(
      screen.getByText(
        /Esta configuración indica visualmente qué campos se solicitan como obligatorios/,
      ),
    ).toBeInTheDocument();
  });

  it('muestra la fila Empresa en la tabla', () => {
    renderAdminPage();

    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByLabelText(/Parámetro para Empresa/i)).toBeInTheDocument();
  });

  it('muestra casillas de obligatoriedad', () => {
    renderAdminPage();

    expect(
      screen.getByRole('columnheader', { name: 'Obligatorio' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Marcar Nombre como obligatorio'),
    ).toBeChecked();
    expect(
      screen.getByLabelText('Marcar Email como obligatorio'),
    ).not.toBeChecked();
    expect(
      screen.getByLabelText('Marcar Ciudad como obligatoria'),
    ).not.toBeChecked();
  });

  it('muestra el mapeo oficial de parámetros', () => {
    renderAdminPage();

    expect(screen.getByLabelText(/Parámetro para Nombre/i)).toHaveValue(
      OFFICIAL_PARAMETER_MAPPING.nombre,
    );
    expect(screen.getByLabelText(/Parámetro para País/i)).toHaveValue('Pais');
    expect(screen.getByLabelText(/Parámetro para Empresa/i)).toHaveValue(
      'Empresa',
    );
  });

  it('al guardar normaliza el parámetro de empresa al valor oficial', async () => {
    const user = userEvent.setup();

    renderAdminPage();

    const empresaInput = screen.getByLabelText(/Parámetro para Empresa/i);
    await user.clear(empresaInput);
    await user.type(empresaInput, 'companyName');
    await user.click(screen.getByLabelText('Marcar Empresa como obligatorio'));
    await user.click(screen.getByRole('button', { name: 'Guardar configuración' }));

    expect(
      screen.getByText('Configuración guardada correctamente'),
    ).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) ?? '{}');
    expect(stored.parameterMapping).toEqual(OFFICIAL_PARAMETER_MAPPING);
    expect(stored.requiredFields.empresa).toBe(true);
    expect(stored.requiredFields.nombre).toBe(true);
    expect(empresaInput).toHaveValue('Empresa');
  });

  it('marca País automáticamente al marcar Ciudad', async () => {
    const user = userEvent.setup();

    renderAdminPage();

    await user.click(screen.getByLabelText('Marcar Ciudad como obligatoria'));

    expect(screen.getByLabelText('Marcar País como obligatorio')).toBeChecked();
    expect(screen.getByLabelText('Marcar País como obligatorio')).toBeDisabled();
    expect(
      screen.getByText(
        'País es obligatorio porque Ciudad depende de un país seleccionado.',
      ),
    ).toBeInTheDocument();
  });

  it('restaura la obligatoriedad predeterminada', async () => {
    const user = userEvent.setup();
    window.confirm = () => true;

    renderAdminPage();

    await user.click(screen.getByLabelText('Marcar Email como obligatorio'));
    await user.click(
      screen.getByRole('button', { name: 'Restaurar valores predeterminados' }),
    );

    expect(
      screen.getByLabelText('Marcar Email como obligatorio'),
    ).not.toBeChecked();
    expect(screen.getByLabelText('Marcar Nombre como obligatorio')).toBeChecked();
    expect(DEFAULT_CONFIG.requiredFields.email).toBe(false);
  });
});
