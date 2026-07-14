import { Outlet } from 'react-router-dom';

const logoUrl = `${import.meta.env.BASE_URL}equipo-a-logo.png`;

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand">
            <img className="brand__logo" src={logoUrl} alt="Equipo A" />
            <div className="brand__text">
              <p className="brand__name">Equipo A</p>
              <p className="brand__tagline">
                Automatizamos procesos. Tú avanzas.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        Equipo A · Automatización de procesos
      </footer>
    </div>
  );
}
