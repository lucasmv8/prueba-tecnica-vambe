# Vambe Sales Intelligence

Panel de análisis de ventas que procesa transcripciones de reuniones con clientes, las categoriza automáticamente usando Claude (Anthropic) y muestra métricas accionables para el equipo comercial.

El foco del dashboard es entregar **métricas accionables, no de vanidad**: cada indicador está pensado para ayudar al vendedor a tomar una decisión concreta (a quién llamar, qué industria priorizar, qué problema resolver primero), no para reportar números que se ven bien pero no orientan la acción.

**Demo:** https://prueba-vambe.vercel.app

---

## Qué hace

1. **Ingesta** — lee `data/vambe_clients.csv` y upserta los clientes en PostgreSQL, marcando duplicados de email automáticamente.
2. **Análisis LLM** — al cargar el dashboard, detecta clientes sin analizar y lanza un batch contra Claude Haiku. El progreso llega en tiempo real vía SSE.
3. **Dashboard** — tres vistas: Resumen (KPIs + alertas), Análisis (gráficos por industria y pain points) y Clientes (tabla filtrable con paginación).

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| Backend / API | Next.js Route Handlers (App Router) |
| LLM | Claude Haiku (`claude-haiku-4-5`) via Anthropic SDK |
| Base de datos | PostgreSQL (Supabase) + Prisma 7 + `@prisma/adapter-pg` |
| Monorepo | pnpm workspaces |

---

## Estructura

```
apps/
  web/              — Next.js 16 (dashboard + API routes)
packages/
  database/         — Schema Prisma, migraciones, cliente DB
  domain/           — Lógica de negocio pura (sin React)
    analysis/       — Orquestación batch, llamadas al LLM, prompts
    clients/        — Listado paginado con filtros y lead score
    metrics/        — Agregaciones para el dashboard
    compose/        — Generación de emails con IA
scripts/            — seed.ts, reset-analysis.ts
data/               — vambe_clients.csv
```

La arquitectura sigue **Screaming Architecture**: el código se organiza por dominio (análisis, clientes, métricas), no por capa técnica.

---

## Configuración local

### Requisitos

- Node.js 20+
- pnpm 9+
- Una instancia PostgreSQL (Supabase free tier funciona)
- API Key de Anthropic

### 1. Clonar e instalar

```bash
git clone https://github.com/lucasmv8/prueba-vambe.git
cd prueba-vambe
pnpm install
```

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

```env
# Supabase pooler URL (puerto 6543) — usada en runtime
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# API Key de Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

> Define `DRY_RUN=true` para que las llamadas al LLM devuelvan datos mock y logueen el costo estimado sin gastar tokens reales.

### 3. Migrar la base de datos

```bash
cd packages/database
pnpm prisma migrate dev
cd ../..
```

### 4. Cargar datos

```bash
pnpm seed
```

Lee `data/vambe_clients.csv`, detecta emails duplicados y upserta los clientes sin análisis.

### 5. Levantar el servidor

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). El dashboard detecta los clientes pendientes y arranca el análisis automáticamente.

---

## Comandos

```bash
pnpm dev                        # Servidor de desarrollo
pnpm build                      # Build de producción
pnpm seed                       # Cargar CSV a la base de datos
pnpm reset-analysis             # Forzar re-análisis de todos los clientes
pnpm --filter @vambe/web lint   # Linter
```

---

## Dimensiones extraídas por el LLM

Claude Haiku extrae 8 dimensiones por transcripción usando `tool_use` forzado (garantiza JSON válido):

| Campo | Descripción | Valores |
|---|---|---|
| `industria` | Sector de la empresa | finanzas, salud, retail, educacion, logistica, turismo, tecnologia, moda, restaurante, consultoria, otro |
| `volumenMensajes` | Volumen actual de consultas | bajo, medio, alto |
| `canalDescubrimiento` | Cómo llegó el cliente | referido, google, conferencia, webinar, articulo, redes_sociales, feria, otro |
| `painPoint` | Problema principal | 8 valores fijos (ver abajo) |
| `integraciones` | Sistemas a integrar | texto libre ≤100 chars |
| `potencial` | Potencial de cierre | alta, media, baja |
| `conclusionEjecutiva` | Síntesis orientada a ventas | texto ≤200 chars |
| `proximaAccion` | Siguiente paso para el vendedor | texto ≤100 chars |

**Pain points disponibles:**
- alto volumen de consultas repetitivas
- gestión manual ineficiente
- desbordamiento en temporada pico
- soporte técnico desbordado
- gestión de citas y reservas
- consultas sobre envíos y logística
- escalado sin aumentar personal
- falta de atención al cliente 24/7

---

## Dashboard

### Resumen
- KPIs: leads calificados, tasa de cierre, vendedor top, industria líder.
- Performance por vendedor: bar chart de reuniones totales vs. cerradas.
- Reuniones por mes y tasa de conversión mensual.
- **Alertas automáticas:** leads de alto potencial sin cerrar (oportunidades) y cierres con potencial bajo (anomalías). Desde cada alerta se puede generar un email personalizado con IA.
- Calidad de datos: grupos de emails duplicados detectados en la ingesta.

### Análisis
- Nube de pain points: frecuencia y tasa de cierre por problema.
- Close rate por industria.

### Clientes
- Tabla paginada con filtros por vendedor, industria, estado de cierre, potencial y búsqueda de texto.
- **Lead score** calculado inline: `potencial` (alta=60, media=35, baja=10) + `volumenMensajes` (alto=40, medio=22, bajo=8).
- Re-análisis individual por cliente.

---

## Pilares de arquitectura

### Screaming Architecture
El código se organiza por dominio (`analysis/`, `clients/`, `metrics/`, `compose/`), no por capa técnica (controllers, services, repositories). La idea es que al abrir el proyecto, la estructura grite lo que hace la aplicación — no cómo está construida.

Se eligió este enfoque por tres razones concretas:

- **Escalabilidad sin fricción:** agregar un dominio nuevo (por ejemplo, `proposals/` o `contracts/`) no requiere tocar nada existente. Cada feature vive en su propia carpeta con su lógica, tipos y servicios.
- **Navegación intuitiva:** un desarrollador nuevo puede localizar cualquier pieza de lógica siguiendo el negocio, no la convención técnica del framework.
- **Evita el acoplamiento horizontal:** en arquitecturas por capa (todos los services juntos, todos los controllers juntos), un cambio en un dominio frecuentemente arrastra cambios en otros. Aquí, cada dominio es independiente por diseño.

Este mismo principio se replica dentro de `apps/web`: los componentes, hooks y utilidades están agrupados por dominio (`analysis/`, `clients/`, `metrics/`, `filters/`), no en carpetas genéricas como `components/` o `hooks/`.

### Separación estricta de paquetes
`@vambe/domain` no importa React ni Next.js — es lógica pura, desacoplada del framework. `@vambe/database` solo expone el cliente Prisma y los tipos generados. Cada capa es reemplazable y testeable de forma aislada sin levantar la aplicación completa.

### Filtrado y paginación en el servidor
La tabla de clientes no carga todos los registros en memoria: todos los filtros (vendedor, industria, potencial, texto libre) se resuelven en la base de datos. El frontend solo recibe la página solicitada. Escala a miles de registros sin tocar el frontend.

### Lead score dinámico
El score de cada lead se calcula en tiempo de consulta a partir de `potencial` y `volumenMensajes`, no se almacena en la DB. Cambiar la fórmula no requiere una migración ni re-análisis de los clientes.

### Alertas basadas en lógica de negocio
Las alertas no son genéricas. Detectan patrones concretos con valor comercial real: leads de alto potencial sin cerrar (oportunidades perdidas) y cierres con potencial bajo (anomalías que merecen revisión). Cada alerta incluye acción directa desde el dashboard.

---

## Decisiones de diseño

### Batch LLM con caché de prompt
Se agrupan hasta 15 clientes por llamada a la API. El system prompt se envía con `cache_control: ephemeral`, lo que reduce el costo de tokens en retries a ~10%. Se elige **Claude Haiku** por su balance costo/calidad en tareas de extracción estructurada.

### Streaming SSE para progreso en tiempo real
`POST /api/analysis` retorna un `ReadableStream` con eventos SSE. El frontend lo consume con `fetch` + lector de stream en lugar de `EventSource`, ya que SSE con POST body no es compatible con la API nativa de EventSource.

### `tool_use` forzado para JSON confiable
Se usa `tool_choice: { type: "tool", name: "categorize_clients" }`. Anthropic garantiza que la respuesta sigue el schema definido, eliminando el parsing frágil de texto libre.

### Prisma 7 + Supabase sin `directUrl`
Prisma 7 eliminó `directUrl`. `prisma.config.ts` deriva automáticamente la URL de sesión (puerto 5432) desde `DATABASE_URL` (puerto 6543 de PgBouncer) al ejecutar migraciones, sin necesidad de variable adicional.

### Generación de emails contextuales
`POST /api/compose` genera asunto y cuerpo de email usando el contexto completo del cliente (industria, pain point, conclusión ejecutiva, próxima acción). Accesible directamente desde las alertas del dashboard.
