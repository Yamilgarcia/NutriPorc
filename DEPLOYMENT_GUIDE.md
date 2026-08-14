# Guía de Despliegue en Vercel - NutriPorc

Esta guía detalla el proceso paso a paso para desplegar la aplicación frontend de **NutriPorc** (desarrollada con React y Vite) en la plataforma **Vercel**, configurando las variables de entorno de producción necesarias y asegurando el correcto funcionamiento de las rutas SPA (Single Page Application).

---

## 1. Variables de Entorno Requeridas

Vercel requiere que configures las siguientes variables de entorno para que la aplicación pueda comunicarse correctamente con Firebase y la API de Gemini:

| Clave de Variable | Descripción | Valor sugerido (de tu entorno local) |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Clave API de tu proyecto Firebase | `AIzaSyAwwKs6-FxxNQJw0D_ywQkVVURdOKrQ17Q` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación de Firebase | `bdnutriporc.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ID de tu proyecto en Firebase | `bdnutriporc` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Contenedor de almacenamiento Firebase | `bdnutriporc.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID de remitente para mensajería Firebase | `160632981888` |
| `VITE_FIREBASE_APP_ID` | ID único de tu aplicación en Firebase | `1:160632981888:web:1dc056f2010767c4d31965` |
| `VITE_GEMINI_API_KEY` | Clave API para el asistente inteligente Gemini | `AQ.Ab8RN6JmgMV34E6cIezC2sZxlTc7ee4BBWulef8VhnrKkhtcTQ` |

---

## 2. Configuración de Rutas (vercel.json)

Dado que **NutriPorc** utiliza `react-router-dom` para la navegación interna, es obligatorio redirigir todas las solicitudes al archivo `index.html`. De lo contrario, al recargar la página en una ruta específica (como `/lotes` o `/finanzas`), Vercel devolverá un error **404: Not Found**.

Ya hemos creado un archivo `vercel.json` en la raíz del proyecto con la siguiente estructura para solucionar esto automáticamente:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 3. Pasos para el Despliegue en Vercel (Consola Web)

El método más recomendado y sencillo es conectar tu repositorio de **GitHub** a Vercel para habilitar despliegues automáticos con cada cambio (`git push`).

### Paso 1: Crear o iniciar sesión en Vercel
1. Ingresa a [Vercel](https://vercel.com).
2. Regístrate o inicia sesión (se recomienda hacerlo con tu cuenta de GitHub).

### Paso 2: Importar el repositorio
1. Haz clic en el botón **"Add New"** y selecciona **"Project"**.
2. Si es tu primera vez, conecta tu cuenta de GitHub.
3. Busca tu repositorio `NutriPorc` en la lista y haz clic en **"Import"**.

### Paso 3: Configurar los ajustes del proyecto
En la pantalla de configuración, asegúrate de verificar los siguientes puntos:
* **Framework Preset:** Selecciona **Vite** (Vercel lo detecta automáticamente la mayoría de las veces).
* **Root Directory:** `./` (dejar por defecto).
* **Build and Development Settings:**
  * **Build Command:** `npm run build` o `vite build`
  * **Output Directory:** `dist`
  * **Install Command:** `npm install`

### Paso 4: Añadir las Variables de Entorno
1. Despliega la pestaña **"Environment Variables"** en la parte inferior.
2. Copia y pega cada una de las 7 variables detalladas en la sección 1 de esta guía.
3. Asegúrate de hacer clic en **"Add"** por cada variable para guardarlas.

### Paso 5: Desplegar
1. Haz clic en el botón **"Deploy"**.
2. Espera de 1 a 2 minutos a que finalice el proceso de compilación y optimización de recursos.
3. ¡Listo! Vercel te proporcionará un enlace público (ej. `https://nutriporc.vercel.app`) para acceder a tu plataforma.
