# Vambe Sales Intelligence Dashboard

Panel interactivo de métricas e inteligencia de ventas que procesa transcripciones de reuniones con IA y las categoriza automáticamente.

## Requisitos

- Node.js 20+
- npm 10+
- API Key de Google Gemini — **100% gratis** en [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local y agregar tu GEMINI_API_KEY

# 3. Inicializar base de datos
npx prisma migrate dev

# 4. Importar clientes desde CSV
npm run seed

# 5. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

Al iniciar, la app detecta automáticamente los clientes sin analizar y lanza el proceso LLM en segundo plano mostrando el progreso en tiempo real.

## Arquitectura

### Screaming Architecture

El proyecto usa Screaming Architecture: la estructura de carpetas refleja el dominio del negocio, no los detalles técnicos.

```
src/
├── app/                    # Routing Next.js (capa delgada, sin lógica)
│   └── api/               # Route handlers → delegan a features
├── features/
│   ├── analysis/          # Dominio: análisis LLM
│   ├── clients/           # Dominio: clientes
│   ├── metrics/           # Dominio: métricas y gráficos
│   └── filters/           # Dominio: filtros y búsqueda
├── shared/                # Utilidades cross-feature
└── infrastructure/        # Adaptadores externos (DB, LLM)
```

Cada feature es completamente autónoma: tiene sus propios `components/`, `services/` y `types.ts`.

### Stack tecnológico

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Framework | Next.js 16 (App Router) | Full-stack, deploy en Vercel |
| Estilos | Tailwind CSS + shadcn/ui | Estilo coherente, componentes accesibles |
| Gráficos | Recharts | Declarativo, compatible con React |
| Base de datos | SQLite + Prisma 7 | Zero-config, perfecto para demo |
| LLM | Google Gemini 2.0 Flash | Gratis, function calling para JSON garantizado |

### Optimización de consultas LLM

**Problema**: Si cada render consultara al LLM, el costo sería prohibitivo.

**Solución**: Los resultados del LLM se guardan en la BD con un campo `analyzedAt`:

```
Client.analyzedAt = null  →  necesita análisis LLM
Client.analyzedAt = Date  →  leer desde BD (sin LLM)
```

**Flujo**:
1. `npm run seed` importa el CSV a SQLite (todos con `analyzedAt = null`)
2. Al iniciar la app, se detectan clientes pendientes → análisis automático en batch
3. Las siguientes visitas leen solo desde BD → 0 llamadas al LLM
4. Botón **Re-analizar Todo**: fuerza re-análisis de todos los clientes
5. Botón **↺** por fila: re-analiza solo ese cliente

El batch usa grupos de 5 clientes en paralelo con `Promise.allSettled` para respetar rate limits y tolerar fallos individuales.

### Dimensiones LLM extraídas

| Dimensión | Descripción |
|-----------|-------------|
| `industria` | Sector del cliente |
| `tamanioEmpresa` | Startup / pequeña / mediana / grande |
| `volumenMensajes` | Bajo / medio / alto |
| `canalDescubrimiento` | Cómo encontró Vambe |
| `painPoint` | Principal dolor del cliente |
| `integraciones` | Sistemas que necesita integrar |
| `objeciones` | Preocupaciones expresadas |
| `urgencia` | Alta / media / baja |
| `etapaDecision` | Explorando / evaluando / listo |
| `sentimiento` | Positivo / neutro / escéptico |
| `resumenLLM` | Insight ejecutivo (1-2 oraciones) |

Se usa **Claude tool_use** para garantizar output JSON estructurado sin parsing frágil.

## Decisiones clave

**¿Por qué SQLite y no Postgres?**
Para esta demo no requiere configuración de infraestructura. Para producción se migraría a Postgres cambiando solo el adapter en `infrastructure/database/prisma.ts`.

**¿Por qué Google Gemini 2.0 Flash?**
Es completamente gratuito vía Google AI Studio (15 RPM, 1M tokens/día). Para 60 transcripciones el costo es $0. Se usa `function calling` forzado (`mode: ANY`) para garantizar output JSON estructurado sin parsing frágil.

**¿Por qué SSE y no WebSockets?**
El análisis es unidireccional (server → client). SSE es más simple, no requiere upgrade de protocolo y funciona bien en Vercel.

**¿Por qué Screaming Architecture?**
Facilita que un nuevo developer entienda qué hace la app en segundos. Features independientes permiten escalar agregando `features/forecasting` sin tocar el resto.
