# 🏆 Polla Mundialista 2026

¡La polla más dura del universo! Una aplicación web interactiva para gestionar pronósticos de partidos, calcular puntuaciones automáticamente y competir en una tabla de clasificación (ranking) con amigos.

## 🚀 Tecnologías Usadas (Tech Stack)

### Frontend
- **React 19** + **Vite**
- **TypeScript**: Para un tipado estricto y código seguro.
- **TailwindCSS v4**: Para utilidades de diseño y un maquetado ágil.
- **Vanilla CSS**: Variables CSS globales, animaciones y estilos de "Glassmorphism" personalizados (`index.css`).

### Backend
- **Node.js** + **Express.js**
- **Supabase (PostgreSQL)**: Almacenamiento de base de datos, consultas con `supabase-js`.
- **JWT (JSON Web Tokens)**: Para autenticación segura sin usar el sistema de Auth nativo de Supabase (autenticación propia basada en PIN numérico).
- **ES Modules (ESM)**: Uso estricto de ESM tanto en desarrollo como en producción.

### Despliegue (Deployment)
- **Vercel**: Alojamiento tanto del frontend (Static Assets) como del backend mediante **Vercel Serverless Functions** (`/api`).

## ✨ Funcionalidades Principales

1. **Dashboard de Partidos**: 
   - Visualización de todos los partidos del mundial.
   - Banderas de todos los países.
   - Estados en tiempo real: `Pendiente`, `En Vivo` (con animación de pulso) y `Finalizado`.
2. **Sistema de Apuestas**:
   - Bloqueo automático de apuestas 30 minutos antes del inicio de cada partido.
   - Modificación y cancelación de apuestas si el partido aún no está bloqueado.
   - Puntuación automática: 3 puntos por acertar el ganador o el empate.
3. **Ranking (Leaderboard)**:
   - Ordenamiento por puntos y cantidad de aciertos.
   - Indicador de estado de pago (💰 Pagó / ⏳ Pendiente de pago).
   - Títulos dinámicos y divertidos (ej. "El Nostradamus", "El Salado", "El Tibio").
4. **Login con PIN**:
   - Sistema sin contraseñas largas. El usuario digita su PIN numérico en una cuadrícula interactiva.

## 🛠 Instalación y Ejecución Local

### Requisitos previos
- Node.js (v18+)
- Cuenta de Supabase con el esquema creado.

### Variables de Entorno (`.env`)
En la raíz del proyecto, debes tener un archivo `.env` con las siguientes variables:
```env
SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_KEY=tu_supabase_service_role_key
JWT_SECRET=tu_secreto_para_jwt
EXTERNAL_WORLD_CUP_API_URL=https://worldcup26.ir # Opcional (fallback configurado)
```

### Comandos

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Correr servidor de desarrollo** (Frontend en puerto 5173 + Backend en puerto 3001):
   ```bash
   npm run dev
   ```

3. **Construcción para producción**:
   ```bash
   npm run build
   ```

## 📂 Estructura del Proyecto

- `/src`: Código fuente del frontend (Páginas, Componentes, Contextos, Servicios).
- `/backend`: Código fuente del backend (Express.js, Rutas, Servicios, Base de Datos).
- `/api`: Carpeta de entrada para Vercel Serverless Functions.

---
*Hecho con ❤️ para el Mundial 2026.*
