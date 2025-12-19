# Configuración de Supabase

El proyecto ha sido conectado a Supabase. Para que funcione correctamente en Vercel, necesitas configurar las siguientes variables de entorno:

## Variables de Entorno Requeridas

En el panel de Vercel, ve a tu proyecto "asist" → Settings → Environment Variables y agrega:

1. **VITE_SUPABASE_URL**
   - Valor: `https://gwenrrzkuglibzckjzsy.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - Valor: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZW5ycnprdWdsaWJ6Y2tqenN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDc0MTUsImV4cCI6MjA4MTcyMzQxNX0.FXpn5vaCw3qMXDvfoW72cRWbdPIQM7_1fqhkyDy_3eo`

## Proyecto de Supabase

- **Proyecto ID**: `gwenrrzkuglibzckjzsy`
- **Región**: `sa-east-1` (São Paulo)
- **URL**: `https://gwenrrzkuglibzckjzsy.supabase.co`

## Base de Datos

La base de datos ya está configurada con:
- Tablas: `users`, `courses`, `student_courses`, `attendance`, `news`, `settings`
- Datos iniciales: usuarios, cursos y relaciones ya insertados

## Notas

- Las variables de entorno que empiezan con `VITE_` son expuestas automáticamente en el cliente
- No es necesario modificar `vite.config.ts` para estas variables
- Asegúrate de configurar las variables en Vercel para todos los ambientes (Production, Preview, Development)

