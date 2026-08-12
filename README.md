# 🐷 NutriPorc

![Status](https://img.shields.io/badge/Status-En%20Desarrollo-orange)
![Hackathon](https://img.shields.io/badge/Event-Hackathon%20Nicaragua%202026-blueviolet)

> **NutriPorc** es una plataforma de nutrición de precisión para la producción porcina, desarrollada para el **Hackathon Nicaragua 2026**.  
> Su objetivo es reducir los costos de alimentación mediante algoritmos de optimización e inteligencia artificial que estima el peso del animal mediante visión computacional.  
> Diseñada con una arquitectura **offline-first**, garantiza que los productores puedan operar en granjas sin conexión a internet, sincronizando los datos automáticamente al recuperar la señal.

---

## 📑 Tabla de Contenidos

- [Características principales](#-características-principales)
- [Arquitectura & Stack](#-arquitectura--stack)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Instalación local](#%EF%B8%8F-instalación-local)
- [Despliegue (hosting)](#%EF%B8%8F-despliegue-hosting)
- [Instalación como App (PWA)](#-instalación-como-app-pwa)
- [Configuración técnica de PWA](#%EF%B8%8F-configuración-técnica-de-pwa)
- [Troubleshooting](#%EF%B8%8F-troubleshooting)
- [Evidencia de control de versiones](#-evidencia-de-control-de-versiones)
- [Equipo de desarrollo](#-equipo-de-desarrollo)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Licencia](#%EF%B8%8F-licencia)

---

<p align="center">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&labelColor=20232a" />
  <img src="https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&labelColor=1a1a1a" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&labelColor=20232a" />
  <img src="https://img.shields.io/badge/PWA%20%7C%20Offline--First-5A0FC8?logo=pwa&labelColor=1a1a1a" />
  <img src="https://img.shields.io/badge/Licencia-Privada-red?labelColor=1a1a1a" />
</p>

---

## ✨ Características principales

- 🧠 **Visión IA para pesaje**: Estimación del peso del cerdo a través de análisis de imágenes, reduciendo el estrés animal y el trabajo manual.
- 📉 **Optimización de raciones**: Algoritmos que calculan la mezcla de alimento más eficiente y económica según la etapa de crecimiento.
- 🌐 **Operación Offline-First**: Registro de datos, fotos y consumos en zonas rurales sin internet, con sincronización automática en la nube.
- 📊 **Gestión de inventario y costos**: Control exacto de insumos, proveedores y rentabilidad por lote.
- 👥 **Seguridad y Accesos**: Autenticación de doble factor (2FA) y sistema multi-tenant para gestionar múltiples granjas desde una misma cuenta.
- 📲 **PWA Instalable**: Funciona como aplicación nativa en dispositivos móviles y de escritorio.

---

## 🧩 Arquitectura & Stack

- **Frontend:** React + Vite
- **Estado y Sincronización:** Context API / Arquitectura Offline-First
- **Backend as a Service:** Firebase
- **Inteligencia Artificial:** Módulo de visión computacional para estimación de peso
- **UI & Gráficas:** CSS modular, TailwindCSS / Shadcn, Recharts
- **Control de versiones:** GitHub (rama `main`)

---

## 🧩 Estructura Modular y Scripts de Arranque

El proyecto sigue una arquitectura basada en características (*Feature Slices*) para mantener el código escalable, organizado y facilitar el trabajo colaborativo.

### 📂 Árbol de Directorios y Módulos

La lógica de negocio principal se aísla dentro de la carpeta `src/features/`. Cada módulo es independiente y contiene su propia UI y lógica.

```plaintext
NutriPorc/
├─ public/
├─ src/
│  ├─ assets/         # Recursos estáticos (imágenes, iconos)
│  ├─ components/     # Componentes UI reutilizables (botones, modales)
│  ├─ features/       # 📦 Módulos principales del negocio
│  │  ├─ auth/        # Autenticación 2FA y sistema multi-tenant
│  │  ├─ finanzas/    # Control de gastos y presupuestos
│  │  ├─ formulador/  # Lógica para cálculo de raciones
│  │  ├─ insumos/     # Gestión de inventario de alimentos
│  │  ├─ lotes/       # Agrupación y control de animales
│  │  ├─ maximizador/ # Algoritmo de optimización de costos
│  │  ├─ monitoreoIA/ # Visión computacional para estimar peso
│  │  └─ welcome/     # Pantalla de bienvenida e inducción
│  ├─ layout/         # Estructura visual base (Sidebar, Navbar)
│  ├─ pages/          # Vistas principales que agrupan features
│  ├─ utils/          # Funciones de ayuda generales
│  ├─ App.jsx         # Enrutamiento principal
│  └─ main.jsx        # Punto de entrada de la aplicación
├─ .env               # Variables de entorno
├─ firebase.config.js # Configuración de servicios Cloud
└─ package.json       # Dependencias y scripts
---

```

### 🚀 Scripts de Arranque

Los siguientes comandos están preconfigurados en el `package.json` para facilitar el flujo de desarrollo, pruebas y pase a producción:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con recarga rápida (HMR). |
| `npm run build` | Compila y optimiza la aplicación para producción en la carpeta `dist`. |
| `npm run preview` | Levanta un servidor local para probar la versión de producción antes de desplegarla. |
| `npm run lint` | Ejecuta ESLint para analizar el código fuente y arreglar problemas de formato. |

## 📡 Endpoints & Servicios de Datos (API)

Dado que NutriPorc utiliza una arquitectura Serverless con Firebase, la interacción de datos se realiza a través de SDKs y Cloud Functions. A continuación, se detalla la estructura de datos y los servicios principales:

### 1. Base de Datos (Firestore Collections)
La estructura modular maneja las siguientes colecciones principales:
* `usuarios`: Almacena perfiles, configuraciones de tenant y roles.
* `lotes`: Agrupación de animales, línea genética y fechas de ingreso.
* `pesajes`: Registro histórico del peso de los animales, vinculado a la IA.

### 2. API de Visión Computacional (IA)
Para el cálculo del peso mediante imágenes, el frontend se comunica con nuestro servicio de procesamiento (ejemplo de estructura de la petición):

**Endpoint:** `POST /api/vision/estimate-weight`
* **Headers:** `Authorization: Bearer <token_2fa>`
* **Body:** 
  ```json
  {
    "loteId": "Lote-001",
    "imageBlob": "data:image/jpeg;base64,...",
    "timestamp": "2026-05-29T10:30:00Z"
  }
---
```
{
  "status": "success",
  "estimatedWeight": 147.5,
  "unit": "lbs",
  "confidenceScore": 0.92
}
```

---
⚙️ Instalación local
Requisitos

Node.js 18+

NPM o PNPM
```
# 1. Clonar el repositorio
git clone [https://github.com/](https://github.com/)<tu-usuario>/NutriPorc.git
cd NutriPorc

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
```
.env.example

Edita tu archivo .env con las credenciales de Firebase y la API de Inteligencia Artificial que utilices. Debería verse similar a esto:
```
VITE_FIREBASE_API_KEY=tu_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=1:tu_app_id:web:tu_web_id

# Configuración de IA (si aplica)
VITE_IA_VISION_API_KEY=tu_api_key_de_vision
```
---
☁️ Despliegue (Hosting)
La app puede desplegarse en cualquier servicio con HTTPS (requisito PWA e integraciones de cámara).  

Vercel / Netlify

Framework detectado: Vite

Build command: npm run build

Output: dist

Nota: Asegurar SPA fallback redirigiendo todas las rutas a index.html.
---

📲 Instalación como App (PWA)
NutriPorc está diseñada para llevarse al campo de trabajo físico. Como PWA, se instala directamente desde el navegador, permitiendo el uso del hardware del dispositivo (cámara) y almacenamiento local.

📱 Android / iOS: Abrir el sitio → Menú / Compartir → “Añadir a pantalla de inicio”

💻 Escritorio: Clic en el icono de instalación 📥 en la barra de direcciones de Chrome/Edge.
---

⚙️ Configuración técnica de PWA y Offline-First
Para que la captura de datos en granjas sin internet funcione, NutriPorc requiere:

🌐 HTTPS Obligatorio para acceso a la cámara y Service Workers.

📄 manifest.webmanifest configurado para modo standalone.

🔧 Service Worker robusto: Cacheo agresivo de la UI y uso de IndexedDB para encolar operaciones (pesajes, registros de consumo) hasta que regrese la conexión.
---

🛠️ Troubleshooting
❌ La cámara no se activa para el pesaje con IA

✔️ Verifica que los permisos del navegador estén concedidos y que estés accediendo mediante HTTPS.

❌ Los datos no se sincronizan al volver el internet

✔️ Revisa la consola en DevTools -> Application -> IndexedDB para comprobar si la cola de peticiones guardadas está esperando ejecución.

❌ Error de inicio de sesión

✔️ Si el sistema 2FA o el multi-tenant falla, asegúrate de que el token de la sesión actual no haya expirado estando offline.

🧪 Evidencia de control de versiones
El proyecto sigue una gestión rigurosa en GitHub, adaptada a los tiempos del hackathon:

🌿 Ramas por funcionalidad: Integración continua de features complejas (como feat/login-multitenant).

📝 Commits descriptivos: Para asegurar la trazabilidad de los algoritmos de nutrición y visión.

⚡ Resolución y merge: Enfocado en mantener una rama main siempre estable y lista para despliegue.
---

👥 Equipo de desarrollo

Yamil

Heydi

Daniela

---

🗺️ Roadmap

📊 Dashboards Directivos Automatizados: Integración nativa de reportes analíticos dentro del panel de la aplicación.

🔗 Integración con Básculas IoT: Complementar la IA con hardware físico para calibración continua.

🚜 Módulo Genético: Seguimiento de linajes para determinar qué razas presentan mejor conversión alimenticia en condiciones específicas.

---

🖊️ Licencia
  
Este proyecto es propiedad exclusiva del equipo desarrollador de NutriPorc.

Queda prohibida su copia, distribución, uso o modificación sin la autorización expresa de sus creadores.

© 2026 NutriPorc — Todos los derechos reservados.

Democratizando la tecnología de precisión para la rentabilidad y eficiencia en la industria porcina.
