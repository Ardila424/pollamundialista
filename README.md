# Polla Mundialista 🏆

Quiniela mundialista automatizada para el **Mundial 2026**. Predice resultados y compite con tus amigos.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Google Cloud Run

## Setup

### 1. Clonar y configurar

```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

### 2. Crear tablas en Supabase

Ejecuta el contenido de `supabase/schema.sql` en el **SQL Editor** de tu proyecto Supabase.

### 3. Instalar dependencias

```bash
npm install                  # Root (concurrently)
cd server && npm install     # Backend
cd ../client && npm install  # Frontend
```

### 4. Desarrollo local

```bash
npm run dev   # Arranca server (3001) + client (5173) en paralelo
```

### 5. Deploy a Cloud Run

```bash
npm run deploy
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL de tu proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key de Supabase |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `PORT` | Puerto del servidor (auto en Cloud Run) |