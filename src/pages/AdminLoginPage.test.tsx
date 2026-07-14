import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONFIG_STORAGE_KEY } from '../config/defaultConfig';
import { ProtectedAdminRoute } from '../components/ProtectedAdminRoute';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminPage } from './AdminPage';
import {
  createAdminSession,
  recordFailedLoginAttempt,
} from '../services/adminAuthService';

function renderLoginFlow(initialEntry = '/admin/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminPage />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminLoginPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.stubEnv('VITE_ADMIN_USERNAME', 'Admin');
    vi.stubEnv(
      'VITE_ADMIN_PASSWORD_HASH',
      '006a516c76cd0a40d62017cfe52907d8210c14f031fb1e7fd7580ea9e11243a9',
    );
    vi.stubEnv('VITE_ADMIN_SESSION_MINUTES', '30');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('exige usuario y contraseña', async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    await user.click(screen.getByRole('button', { name: 'Acceder' }));

    expect(screen.getByText('Introduzca el usuario.')).toBeInTheDocument();
    expect(screen.getByText('Introduzca la contraseña.')).toBeInTheDocument();
  });

  it('muestra un mensaje genérico con credenciales incorrectas', async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByLabelText('Usuario'), 'Admin');
    await user.type(screen.getByLabelText('Contraseña'), 'Incorrecta');
    await user.click(screen.getByRole('button', { name: 'Acceder' }));

    expect(
      screen.getByText('El usuario o la contraseña no son correctos.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');
  });

  it('redirige a /admin con credenciales válidas', async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByLabelText('Usuario'), 'Admin');
    await user.type(screen.getByLabelText('Contraseña'), 'EquipoA');
    await user.click(screen.getByRole('button', { name: 'Acceder' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Administración' }),
      ).toBeInTheDocument();
    });
  });

  it('desactiva el botón mientras valida', async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByLabelText('Usuario'), 'Admin');
    await user.type(screen.getByLabelText('Contraseña'), 'EquipoA');

    const submitButton = screen.getByRole('button', { name: 'Acceder' });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Administración' }),
      ).toBeInTheDocument();
    });
  });

  it('envía el formulario con Enter', async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByLabelText('Usuario'), 'Admin');
    await user.type(screen.getByLabelText('Contraseña'), 'EquipoA{Enter}');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Administración' }),
      ).toBeInTheDocument();
    });
  });

  it('bloquea el formulario tras cinco intentos fallidos', async () => {
    const user = userEvent.setup();
    renderLoginFlow();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await user.clear(screen.getByLabelText('Usuario'));
      await user.type(screen.getByLabelText('Usuario'), 'Admin');
      await user.clear(screen.getByLabelText('Contraseña'));
      await user.type(screen.getByLabelText('Contraseña'), 'Incorrecta');
      await user.click(screen.getByRole('button', { name: 'Acceder' }));
    }

    expect(
      screen.getByText(/Se han producido demasiados intentos/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acceder' })).toBeDisabled();
  });

  it('permite reintentar cuando finaliza el bloqueo', async () => {
    vi.useFakeTimers();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      recordFailedLoginAttempt(0);
    }

    renderLoginFlow();

    expect(screen.getByRole('button', { name: 'Acceder' })).toBeDisabled();

    vi.advanceTimersByTime(61_000);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Acceder' })).not.toBeDisabled();
    });
  });

  it('muestra aviso cuando falta configuración', async () => {
    vi.stubEnv('VITE_ADMIN_USERNAME', '');
    vi.stubEnv('VITE_ADMIN_PASSWORD_HASH', '');

    const user = userEvent.setup();
    renderLoginFlow();

    await user.type(screen.getByLabelText('Usuario'), 'Admin');
    await user.type(screen.getByLabelText('Contraseña'), 'EquipoA');
    await user.click(screen.getByRole('button', { name: 'Acceder' }));

    expect(
      screen.getByText(
        'El acceso administrativo no está configurado. Póngase en contacto con el administrador de la aplicación.',
      ),
    ).toBeInTheDocument();
  });
});

describe('Cierre de sesión administrativa', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    createAdminSession();
    localStorage.setItem(CONFIG_STORAGE_KEY, '{"countriesApiUrl":"persisted"}');
  });

  it('elimina la sesión, conserva localStorage y protege /admin', async () => {
    const user = userEvent.setup();
    const view = renderLoginFlow('/admin');

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(
      screen.getByRole('heading', { name: 'Acceso a administración' }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(CONFIG_STORAGE_KEY)).toBe(
      '{"countriesApiUrl":"persisted"}',
    );

    view.unmount();
    renderLoginFlow('/admin');

    expect(
      screen.getByRole('heading', { name: 'Acceso a administración' }),
    ).toBeInTheDocument();
  });
});
