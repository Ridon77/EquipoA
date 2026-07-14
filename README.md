# Formulario REST configurable

Aplicación web MVP desarrollada con React, TypeScript y Vite. Permite enviar solicitudes mediante una API REST configurable por parámetros URL, con carga de países y ciudades desde una API externa.

Repositorio: [https://github.com/Ridon77/EquipoA](https://github.com/Ridon77/EquipoA)

## Requisitos

- Node.js 18 o superior (recomendado 20+)
- npm

## Instalación

```bash
git clone https://github.com/Ridon77/EquipoA.git
cd EquipoA
npm install
```

## Ejecución en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

## Compilación

Genera la versión de producción en la carpeta `dist/`:

```bash
npm run build
```

Para previsualizar la compilación localmente:

```bash
npm run preview
```

## Pruebas

Ejecutar todas las pruebas una vez:

```bash
npm test
```

Modo interactivo (desarrollo):

```bash
npm run test:watch
```

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con Vite |
| `npm run build` | Compila TypeScript y genera `dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm test` | Ejecuta las pruebas con Vitest |
| `npm run test:watch` | Pruebas en modo observación |

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Formulario principal de solicitud |
| `/admin/login` | Acceso a la administración |
| `/admin` | Configuración de la aplicación (requiere sesión) |

No existe un enlace visible hacia `/admin` ni `/admin/login` desde la página principal. Hay que escribir la URL manualmente.

En GitHub Pages las rutas usan hash:

| Página | URL |
|---|---|
| Formulario | `https://ridon77.github.io/EquipoA/#/` |
| Login admin | `https://ridon77.github.io/EquipoA/#/admin/login` |
| Administración | `https://ridon77.github.io/EquipoA/#/admin` |

## Campos del formulario

| Campo | Obligatorio | Literal |
|---|---|---|
| Nombre | Sí | Introduzca su nombre |
| Email | No | Introduzca su email |
| Empresa | No | Introduzca su empresa |
| País | No | Introduzca su país |
| Ciudad | No | Introduzca su ciudad |
| Mensaje | Sí | Introduzca su solicitud |

El campo **Empresa** es opcional, admite texto libre y se envía a la API con el parámetro configurado (predeterminado: `empresa`).

## Código QR del formulario

En la página principal hay un botón con icono QR junto al título del formulario.

Al pulsarlo:

- Se abre una vista a pantalla completa con un código QR grande.
- El QR apunta a la URL pública del formulario (`#/`), calculada automáticamente.
- Debajo aparece un enlace **Abrir formulario** y un botón **Volver al formulario**.
- Al cerrar, los datos introducidos se conservan sin recargar la página.

La URL se construye con `window.location.origin` e `import.meta.env.BASE_URL`, por lo que funciona en:

- Desarrollo local (`http://localhost:5173/#/`)
- Vista previa de Vite
- GitHub Pages con subruta (`https://dominio/ruta-base/#/`)

El QR **no contiene datos del formulario**, credenciales ni rutas administrativas. Solo la URL pública de acceso.

Dependencia utilizada: [`qrcode.react`](https://www.npmjs.com/package/qrcode.react) (generación local en SVG).

### Probar la función

**Local:**

```bash
npm run dev
```

Abre el formulario, pulsa el icono QR y escanea el código con un móvil en la misma red o copia el enlace visible.

**Producción:**

Publica la aplicación y abre la URL pública del formulario. El QR generado debe apuntar a la misma URL base con `#/`.

**Simular GitHub Pages en local:**

```bash
VITE_BASE_PATH=/EquipoA/ npm run build
npm run preview
```

El QR debe incluir la subruta configurada en `VITE_BASE_PATH`.

## Página de administración (`/admin`)

Antes de acceder a `/admin` hay que identificarse en `/admin/login`.

Desde `/admin` se puede configurar:

- URL de la API de países y ciudades
- URL de la API de envío
- Timeout de la petición (milisegundos)
- Nombre de cada parámetro enviado a la API (nombre, email, empresa, país, ciudad, mensaje)

Los cambios se guardan con **Guardar configuración** y se pueden restaurar con **Restaurar valores predeterminados**.

**Cerrar sesión** elimina únicamente la autenticación almacenada en `sessionStorage`. La configuración guardada en `localStorage` no se borra.

### Variables de entorno del login

Copia `.env.example` a `.env.local` y configura:

```env
VITE_ADMIN_USERNAME=Admin
VITE_ADMIN_PASSWORD_HASH=hash_sha256_en_minusculas
VITE_ADMIN_SESSION_MINUTES=30
```

| Variable | Descripción |
|---|---|
| `VITE_ADMIN_USERNAME` | Usuario administrador |
| `VITE_ADMIN_PASSWORD_HASH` | Hash SHA-256 (hex minúsculas) de la contraseña |
| `VITE_ADMIN_SESSION_MINUTES` | Duración de la sesión en minutos (predeterminado: 30) |

Generar un hash SHA-256 con Node.js:

```bash
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update('CAMBIA_ESTA_CONTRASEÑA').digest('hex'))"
```

En desarrollo, Vite carga automáticamente `.env.local`. En compilación (`npm run build`), las variables deben estar disponibles en el entorno de build.

Para GitHub Pages, configura en el repositorio:

- **Variable** `VITE_ADMIN_USERNAME`
- **Secreto** `VITE_ADMIN_PASSWORD_HASH`
- **Variable** `VITE_ADMIN_SESSION_MINUTES` (opcional)

El workflow de despliegue las inyecta durante `npm test` y `npm run build`.

### Sesión administrativa

- Se guarda en `sessionStorage` bajo la clave `equipo-a-admin-session`.
- Expira automáticamente tras el tiempo configurado.
- Si caduca, redirige a `/admin/login` con el aviso correspondiente.
- Tras **Cerrar sesión**, `/admin` vuelve a estar protegida.

### Aviso de seguridad del login frontend

El acceso administrativo se valida **completamente en el navegador**. No es autenticación de alta seguridad porque:

- No hay backend ni base de datos.
- El código JavaScript puede inspeccionarse.
- Las variables de Vite quedan embebidas en los archivos compilados enviados al navegador.
- Aunque el hash se configure como secreto en GitHub Actions, **puede quedar incluido en el bundle de producción** y no permanece oculto en el cliente.
- `sessionStorage` puede modificarse con las herramientas del navegador.
- El límite de intentos fallidos es solo una medida de interfaz.

**No utilices este mecanismo para proteger secretos, claves de API ni credenciales reales.** Para seguridad real, usa autenticación con backend o un proveedor externo (OAuth, SSO, etc.).

La configuración funcional de la aplicación sigue guardándose en `localStorage` y es independiente de la sesión administrativa.

## Persistencia con `localStorage`

La configuración de la aplicación se almacena en `localStorage` del navegador bajo la clave `app-config`.

Implicaciones:

- La configuración es **local al navegador** actual
- **No se comparte** entre dispositivos ni usuarios
- Se **pierde** si se eliminan los datos del navegador
- No se utiliza base de datos ni backend
- Las configuraciones antiguas sin el parámetro `empresa` se migran automáticamente al cargar

## Ejemplo de configuración

```json
{
  "countriesApiUrl": "https://countriesnow.space/api/v0.1/countries",
  "submitApiUrl": "https://api.ejemplo.com/solicitud",
  "submitTimeoutMs": 10000,
  "parameterMapping": {
    "nombre": "customerName",
    "email": "customerEmail",
    "empresa": "companyName",
    "pais": "customerCountry",
    "ciudad": "customerCity",
    "mensaje": "customerMessage"
  }
}
```

## Ejemplo de URL generada

Con la configuración anterior, un envío podría generar una petición GET como:

```text
https://api.ejemplo.com/solicitud?customerName=Joan&customerEmail=joan%40example.com&companyName=Tecnolog%C3%ADa+y+Gesti%C3%B3n%2C+S.L.&customerCountry=Espa%C3%B1a&customerCity=Madrid&customerMessage=Necesito+informaci%C3%B3n
```

Los campos opcionales vacíos también se incluyen en la URL.

## Advertencia sobre CORS

Las APIs configuradas (países y envío) deben **permitir peticiones CORS** desde el origen del navegador donde se ejecuta la aplicación. Si la API no lo permite, el navegador bloqueará la petición y se mostrará un error técnico.

No se almacenan secretos, tokens ni claves privadas en el frontend.

## Limitaciones conocidas

- Sin backend ni base de datos
- Configuración no sincronizada entre dispositivos
- Login administrativo solo en frontend (ver aviso de seguridad)
- Dependencia de APIs externas con CORS habilitado
- En GitHub Pages las rutas usan hash (`#/admin`)

## Estructura del proyecto

```text
src/
├── components/   Componentes reutilizables
├── pages/        Páginas principales
├── services/     Lógica de APIs y persistencia
├── config/       Configuración predeterminada
├── validation/   Validaciones de formulario y admin
├── types/        Tipos TypeScript
├── hooks/        Hooks personalizados
├── App.tsx
└── main.tsx
```

## Despliegue en GitHub Pages

La aplicación se publica automáticamente en GitHub Pages al hacer push a `main`.

### URL pública

```text
https://ridon77.github.io/EquipoA/
```

Rutas en producción:

| Página | URL |
|---|---|
| Formulario | `https://ridon77.github.io/EquipoA/#/` |
| Login admin | `https://ridon77.github.io/EquipoA/#/admin/login` |
| Administración | `https://ridon77.github.io/EquipoA/#/admin` |

> Se usa `HashRouter` para que las rutas funcionen al recargar la página en GitHub Pages.

### Activar GitHub Pages (solo la primera vez)

1. Abre [https://github.com/Ridon77/EquipoA/settings/pages](https://github.com/Ridon77/EquipoA/settings/pages)
2. En **Build and deployment → Source**, selecciona **GitHub Actions**
3. Sube los cambios a `main`:

```bash
git add .
git commit -m "ci: configurar despliegue en GitHub Pages"
git push origin main
```

4. Ve a la pestaña **Actions** del repositorio y espera a que termine el workflow **Deploy to GitHub Pages**
5. Abre la URL publicada (puede tardar 1–2 minutos)

### Desarrollo local

En local sigue funcionando igual:

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

Para simular la compilación de producción con la misma base que GitHub Pages:

```bash
VITE_BASE_PATH=/EquipoA/ npm run build
npm run preview
```

Abre [http://localhost:4173/EquipoA/](http://localhost:4173/EquipoA/).

## Licencia

Proyecto académico / MVP de equipo.
