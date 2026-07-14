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

## Página de administración (`/admin`)

Desde `/admin` se puede configurar:

- URL de la API de países y ciudades
- URL de la API de envío
- Timeout de la petición (milisegundos)
- Nombre de cada parámetro enviado a la API (nombre, email, país, ciudad, mensaje)

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

## Ejemplo de configuración

```json
{
  "countriesApiUrl": "https://countriesnow.space/api/v0.1/countries",
  "submitApiUrl": "https://api.ejemplo.com/solicitud",
  "submitTimeoutMs": 10000,
  "parameterMapping": {
    "nombre": "customerName",
    "email": "customerEmail",
    "pais": "customerCountry",
    "ciudad": "customerCity",
    "mensaje": "customerMessage"
  }
}
```

## Ejemplo de URL generada

Con la configuración anterior, un envío podría generar una petición GET como:

```text
https://api.ejemplo.com/solicitud?customerName=Joan&customerEmail=joan%40example.com&customerCountry=Espa%C3%B1a&customerCity=Madrid&customerMessage=Necesito+informaci%C3%B3n
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
- MVP sin estilos avanzados ni imágenes
- En despliegues estáticos con rutas del tipo `/admin`, puede ser necesario usar `HashRouter` o configurar redirecciones en el servidor

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

## Despliegue en GitHub Pages (opcional)

Si se desea publicar en GitHub Pages, conviene:

1. Configurar `base` en `vite.config.ts` con el nombre del repositorio
2. Usar `HashRouter` en lugar de `BrowserRouter` para evitar errores al recargar rutas como `/admin`
3. Crear un workflow de GitHub Actions que ejecute `npm run build` y publique `dist/`

Este paso no es obligatorio para el funcionamiento local del proyecto.

## Licencia

Proyecto académico / MVP de equipo.
