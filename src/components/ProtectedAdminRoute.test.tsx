import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedAdminRoute } from './ProtectedAdminRoute';
import { AdminPage } from '../pages/AdminPage';
import { AdminLoginPage } from '../pages/AdminLoginPage';
import { createAdminSession } from '../services/adminAuthService';

function renderProtectedAdmin(initialEntry: string) {
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

describe('ProtectedAdminRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('redirige /admin al login sin sesión', () => {
    renderProtectedAdmin('/admin');

    expect(
      screen.getByRole('heading', { name: 'Acceso a administración' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Administración' }),
    ).not.toBeInTheDocument();
  });

  it('muestra /admin con sesión válida', () => {
    createAdminSession();
    renderProtectedAdmin('/admin');

    expect(
      screen.getByRole('heading', { name: 'Administración' }),
    ).toBeInTheDocument();
  });

  it('muestra /admin/login sin sesión', () => {
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'Acceso a administración' }),
    ).toBeInTheDocument();
  });

  it('redirige /admin/login a /admin con sesión válida', () => {
    createAdminSession();

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
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

    expect(
      screen.getByRole('heading', { name: 'Administración' }),
    ).toBeInTheDocument();
  });

  it('redirige al login cuando la sesión ha expirado', () => {
    sessionStorage.setItem(
      'equipo-a-admin-session',
      JSON.stringify({
        authenticated: true,
        expiresAt: Date.now() - 1_000,
      }),
    );

    renderProtectedAdmin('/admin');

    expect(
      screen.getByRole('heading', { name: 'Acceso a administración' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('La sesión ha caducado. Vuelva a identificarse.'),
    ).toBeInTheDocument();
  });
});
