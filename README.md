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
| `/admin` | Configuración de la aplicación |

No existe un enlace visible hacia `/admin` desde la página principal. Hay que escribir la URL manualmente.

En GitHub Pages las rutas usan hash:

| Página | URL |
|---|---|
| Formulario | `https://ridon77.github.io/EquipoA/#/` |
| Administración | `https://ridon77.github.io/EquipoA/#/admin` |

## Campos del formulario

| Campo | Obligatorio por defecto | Notas |
|---|---|---|
| Nombre | Sí | Configurable en `/admin` |
| Email | No | Si tiene valor, se valida el formato |
| Empresa | No | Configurable en `/admin` |
| País | No | Buscador en castellano |
| Ciudad | No | Dependiente del país |
| Mensaje | Sí | Configurable en `/admin` |

La obligatoriedad de cada campo se configura en `/admin` (columna **Obligatorio**) y se guarda en `localStorage`. No se envía a la API REST.

### Predeterminados

```text
nombre: sí, email: no, empresa: no, pais: no, ciudad: no, mensaje: sí
```

Si Ciudad se marca como obligatoria, País se marca automáticamente y no se puede desmarcar mientras Ciudad lo sea.

Las configuraciones antiguas sin `requiredFields` se migran aplicando estos valores predeterminados sin perder URLs, timeout ni mapeo de parámetros.

## País y ciudad en castellano

Los campos **País** y **Ciudad** son buscadores dependientes:

1. Escribe en País para filtrar (coincide en cualquier parte del nombre; por ejemplo, `aña` → España).
2. Ciudad permanece deshabilitada hasta elegir un país válido.
3. Ciudad solo muestra y filtra las ciudades del país seleccionado.

### Traducción

- **Países:** se traducen con `Intl.DisplayNames` (`es`) a partir del código ISO2 (por ejemplo, `DE` → Alemania).
- **Ciudades:** se traduce un diccionario conocido en `src/data/cityTranslationsEs.ts` (por ejemplo, Munich → Múnich).
- Si una ciudad no tiene traducción, se mantiene el nombre original.
- Ambas listas se ordenan alfabéticamente con reglas españolas.

El valor enviado por REST sigue siendo el **nombre visible** (`pais` y `ciudad`), no el ISO2. El mapeo se configura desde `/admin`.

La URL de la API se lee de `countriesApiUrl` (configurable en `/admin`). Los datos se cargan en una sola petición y se reutilizan al cambiar de país.

**Limitación:** no todas las ciudades tienen traducción al castellano. Para ampliar el diccionario, edita `src/data/cityTranslationsEs.ts` añadiendo pares `nombreOriginal: "Traducción"`.

## Código QR del formulario

En la página principal hay un botón con icono QR junto al título del formulario.

Al pulsarlo:

- Se abre una vista a pantalla completa con un código QR grande.
- El QR apunta a la URL pública del formulario con el marcador `source=qr` (por ejemplo `#/?source=qr`).
- Debajo aparece un enlace **Abrir formulario** y un botón **Volver al formulario**.
- Al cerrar, los datos introducidos se conservan sin recargar la página.

### Acceso mediante QR (`source=qr`)

Cada navegador y dispositivo tiene su propio `localStorage`. Si alguien escanea el QR en un móvil nuevo, no tendría la configuración de `/admin` del administrador.

Por eso, al abrir el formulario con `source=qr`:

1. La app detecta el marcador.
2. Sobrescribe `localStorage` con el preset `QR_FORM_CONFIG`.
3. Aplica de inmediato API de países, webhook de envío, mapeo y obligatoriedad.
4. Elimina `source=qr` de la URL (`replace`) para dejar una ruta limpia.
5. Un nuevo escaneo vuelve a aplicar el mismo preset.

Además, si en un acceso normal la URL de la API de envío está vacía (o ausente / solo espacios), la aplicación aplica automáticamente `QR_FORM_CONFIG` y la guarda en `localStorage`. Así se evitan errores de conexión en navegadores nuevos o móviles que aún no tienen webhook configurado.

Un acceso normal con `submitApiUrl` válida **conserva** la configuración personalizada (mapeo, obligatoriedad, etc.).

El acceso QR **siempre** sobrescribe, aunque ya exista una URL válida.

Preset actual (editable en `src/config/qrFormConfig.ts`):

| Campo | Parámetro REST | Obligatorio |
|---|---|---|
| Nombre | `Nombre` | Sí |
| Email | `Email` | Sí |
| Empresa | `Empresa` | No |
| País | `Pais` | No |
| Ciudad | `Ciudad` | No |
| Mensaje | `Mensaje` | Sí |

Webhook de envío del preset: `https://santisola.app.n8n.cloud/webhook/lead?`

**Advertencia:** esa URL de webhook es pública en el frontend (no es un secreto). Cualquiera que escanee el QR o inspeccione el código puede verla.

La URL del QR se construye con `window.location.origin` e `import.meta.env.BASE_URL`, por lo que funciona en:

- Desarrollo local (`http://localhost:5173/#/?source=qr`)
- Vista previa de Vite
- GitHub Pages con subruta (`https://dominio/ruta-base/#/?source=qr`)

El QR **no contiene datos del formulario**, credenciales ni rutas administrativas. Solo la URL pública y `source=qr`.

Dependencia utilizada: [`qrcode.react`](https://www.npmjs.com/package/qrcode.react) (generación local en SVG).

### Probar la función

**Local:**

```bash
npm run dev
```

Abre el formulario, pulsa el icono QR y escanea el código, o visita directamente `#/?source=qr`.

**Producción:**

Publica la aplicación y usa el QR generado desde la página pública. Tras escanear, `#/admin` debe mostrar los valores del preset.

## Página de administración (`/admin`)

Desde `/admin` se puede configurar:

- URL de la API de países y ciudades
- URL de la API de envío
- Timeout de la petición (milisegundos)
- Nombre de cada parámetro enviado a la API (nombre, email, empresa, país, ciudad, mensaje)
- Qué campos del formulario público son **obligatorios**

Los cambios se guardan con **Guardar configuración** y se pueden restaurar con **Restaurar valores predeterminados**.

### Aviso de seguridad

Esta página **no dispone de autenticación**. Conocer la URL `/admin` es suficiente para acceder a la configuración. No debe considerarse un mecanismo de seguridad.

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
- `/admin` sin autenticación
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
