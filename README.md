# Documentos Don Mamino

Aplicación para que los colaboradores de tienda fotografíen facturas, notas de
crédito, guías de remisión y órdenes de compra desde el celular. La IA de
Anthropic extrae los datos automáticamente, se guardan en una base de datos, y
el administrador exporta todo a Excel para cargarlo a Dataworking.

## Guía de despliegue paso a paso (sin conocimientos previos)

Sigue estos pasos en orden. Toma unos 20-30 minutos la primera vez. No necesitas
instalar nada en tu computadora: todo se hace desde el navegador.

### Antes de empezar, crea estas 3 cuentas gratuitas

1. **GitHub** — [github.com](https://github.com/signup) (donde vivirá el código)
2. **Vercel** — [vercel.com/signup](https://vercel.com/signup) (donde vivirá la app). Puedes registrarte usando tu cuenta de GitHub, es más rápido.
3. **Neon** — [neon.tech](https://neon.tech) (la base de datos). También puedes usar tu cuenta de GitHub para entrar.

Además necesitas tu clave de la API de Anthropic (`ANTHROPIC_API_KEY`), que ya tienes.

---

### Paso 1 — Subir el código a GitHub

1. Entra a [github.com/new](https://github.com/new) y crea un repositorio **privado** llamado, por ejemplo, `documentos-don-mamino`. No marques ninguna casilla adicional (README, .gitignore, licencia) — déjalo vacío.
2. En la página que aparece después de crearlo, copia la URL que dice algo como `https://github.com/tu-usuario/documentos-don-mamino.git`.
3. Dile a Claude Code: **"sube el proyecto a este repositorio: (pega la URL)"**. Claude Code se encarga de subir todo el código por ti.

### Paso 2 — Crear la base de datos en Neon

1. Entra a [neon.tech](https://neon.tech) y crea un proyecto nuevo. Ponle de nombre `don-mamino`.
2. Cuando lo termine de crear, busca el botón **"Connection string"** (cadena de conexión) en el panel principal.
3. Cópiala completa. Se ve así: `postgresql://usuario:clave@host.neon.tech/basedatos?sslmode=require`
4. Guárdala, la vas a necesitar en el Paso 4 como `DATABASE_URL`.

### Paso 3 — Importar el proyecto en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new).
2. Elige **"Import Git Repository"** y selecciona el repositorio `documentos-don-mamino` que creaste en el Paso 1. Si no aparece, dale permiso a Vercel para acceder a tus repositorios de GitHub.
3. En "Framework Preset" debería detectar automáticamente **Next.js**. No cambies nada ahí.
4. **No hagas clic en "Deploy" todavía** — primero baja a la sección "Environment Variables" (variables de entorno) en esa misma pantalla, y sigue el Paso 4.

### Paso 4 — Configurar las variables de entorno

En la misma pantalla de importación de Vercel (o después, en **Settings → Environment Variables**), agrega una por una estas variables:

| Nombre | Valor |
|---|---|
| `DATABASE_URL` | La cadena de conexión de Neon que copiaste en el Paso 2 |
| `ANTHROPIC_API_KEY` | Tu clave de la API de Anthropic |
| `AUTH_SECRET` | Una cadena larga y aleatoria — pídele a Claude Code que te genere una si no tienes una a mano |
| `SETUP_SECRET` | Otra cadena larga y aleatoria distinta, solo la usarás una vez en el Paso 6 |
| `BLOB_READ_WRITE_TOKEN` | La dejas pendiente — se completa sola en el Paso 5 |

### Paso 5 — Activar el almacenamiento de fotos (Vercel Blob)

1. Haz clic en **"Deploy"** para hacer el primer despliegue (puede fallar por falta de `BLOB_READ_WRITE_TOKEN`, no te preocupes).
2. Dentro de tu proyecto en Vercel, ve a la pestaña **Storage → Create Database → Blob**.
3. Ponle un nombre (ej. `documentos-don-mamino-fotos`) y créalo. Vercel conecta automáticamente la variable `BLOB_READ_WRITE_TOKEN` a tu proyecto.
4. Ve a **Deployments**, abre los "..." del último despliegue y elige **Redeploy** para que tome la nueva variable.

Si todo salió bien, verás "Ready" en verde y un dominio como `documentos-don-mamino.vercel.app`.

### Paso 6 — Crear tu primer usuario administrador

1. Abre en el navegador (reemplaza con tu dominio real y el `SETUP_SECRET` que pusiste en el Paso 4):
   `https://tu-proyecto.vercel.app/api/setup?clave=TU_SETUP_SECRET`
2. Deberías ver un mensaje con un usuario (`admin`) y una contraseña temporal (`DonMamino2025`).
3. Entra a `https://tu-proyecto.vercel.app` con esas credenciales.
4. Ve a **Usuarios → Cambiar contraseña** para el usuario `admin` y ponle una contraseña propia. **Este paso es importante, no te lo saltes.**

### Paso 7 — Crear tiendas y usuarios colaboradores

Ya dentro del panel como administrador:

1. Ve a **Usuarios**, crea primero las tiendas que necesites en la sección "Tiendas".
2. Crea un usuario por cada colaborador que va a subir documentos, asignándole su tienda y el rol "Colaborador".
3. Comparte con cada colaborador la dirección de la app y su usuario/contraseña. Solo necesitan abrirla desde el navegador del celular (Chrome o Safari) — funciona como una página web normal, no hay que instalar nada. Si quieres, pueden "agregarla a la pantalla de inicio" desde el menú del navegador para que se vea como una app.

---

## Uso diario

- **Colaboradores**: entran, eligen el tipo de documento, tocan "Tomar/elegir fotos" y esperan a que cada foto se marque en verde.
- **Administrador**: revisa las tablas de Facturas, Notas de Crédito, Guías y Órdenes de Compra; homologa productos pendientes en "Por Homologar"; y descarga el Excel desde "Exportar" cuando lo necesite para Dataworking.

## Costos a tener en cuenta

- **Vercel**: el plan gratuito (Hobby) alcanza para este uso mientras el volumen sea moderado.
- **Neon**: el plan gratuito incluye una base de datos pequeña, suficiente para empezar.
- **Anthropic**: se cobra por cada foto que se lee con IA (facturas, notas de crédito y órdenes de compra). Las guías de remisión NO consumen esto, porque no se leen con IA.
- **Vercel Blob**: cobra por espacio de almacenamiento de las fotos; el plan gratuito incluye varios GB.

## Si algo falla

- Si una foto queda marcada con ⚠️ "no se pudo leer": la foto igual se guardó, solo entra a editarla manualmente en la tabla correspondiente.
- Si el despliegue en Vercel falla con un error de base de datos: revisa que copiaste bien el `DATABASE_URL` de Neon, incluyendo `?sslmode=require` al final.
- Para cualquier cambio futuro en la aplicación, vuelve a abrir este proyecto con Claude Code.
