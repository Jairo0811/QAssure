<div align="center">

<img src="docs/images/qassure-logo.png" alt="Logo de QAssure" width="720" />

**Software Quality Assurance Platform**

*Verify. Validate. Assure.*

<img src="https://img.shields.io/badge/UNAPEC-ISO--410-003B70?style=for-the-badge" alt="UNAPEC ISO-410" />
<img src="https://img.shields.io/badge/Estado-1.0%20Congelado-22C55E?style=for-the-badge" alt="QAssure 1.0 congelado" />
<img src="https://img.shields.io/badge/UI-Español-EF4444?style=for-the-badge" alt="Interfaz en español" />

<br/><br/>

<a href="https://github.com/Jairo0811/QAssure/actions/workflows/ci.yml">
  <img src="https://github.com/Jairo0811/QAssure/actions/workflows/ci.yml/badge.svg" alt="CI" />
</a>

</div>

---

## 📌 Descripción

**QAssure** es una plataforma de aseguramiento de calidad de software creada para **Verificación y Validación de Software (ISO-410)** en la **Universidad APEC (UNAPEC)**.

Centraliza el ciclo completo de QA en un solo flujo: requisitos, análisis de riesgos, diseño y ejecución de pruebas, defectos, re-test, regresión, trazabilidad, métricas de calidad, quality gates y evidencia de validación final.

```text
Proyecto
   ↓
Requisito → Riesgo → Caso de prueba → Ciclo de prueba → Ejecución
                                                  ↓
                                               Defecto
                                                  ↓
                                               Re-test
                                                  ↓
Trazabilidad → Reporte de calidad → Validación final → Gate de liberación
```

---

## 🧊 Estado del proyecto

**QAssure 1.0 queda congelado como entrega académica estable.** Las fases funcionales 0–7 están implementadas y el repositorio queda cerrado a nuevas funcionalidades. A partir de este punto solo deberían aceptarse correcciones críticas, de seguridad o de compatibilidad que afecten la ejecución de la versión congelada.

La congelación no fuerza un quality gate verde: cada proyecto evaluado dentro de QAssure puede seguir resultando `Ready`, `Conditional` o `Blocked` según su evidencia real.

---

## 🎓 Información académica

| Información | Detalle |
|---|---|
| 🏫 Institución | **Universidad APEC (UNAPEC)** |
| 📖 Asignatura | **Verificación y Validación de Software (ISO-410)** |
| 👨‍🏫 Profesor | **Luis Nuñez Acosta** |
| 📅 Período académico | **Enero - Abril 2025** |
| 📁 Proyecto | **QAssure** |

### 👥 Equipo académico original

| 👤 Integrante | 🆔 Matrícula UNAPEC |
|---|---|
| 👨🏻‍💻 **Albert Mateo Tejada** | **A00107388** |
| 👨🏻‍💻 **Francisco Daniel Lora Gonzalez** | **A00114255** |
| 👨🏻‍💻 **Francis Jairo Matias Rosario** | **A00115261** |

---

## 🧱 Stack tecnológico

### ⚙️ Backend / API

- .NET 10 / ASP.NET Core Web API;
- C#;
- Entity Framework Core 10;
- Clean Architecture;
- JWT Bearer y autorización basada en roles;
- OpenAPI.

### 🎨 Frontend

- React 19;
- TypeScript 5.9;
- Vite 7;
- Font Awesome;
- **SweetAlert2 11** para diálogos, prompts y feedback contextual;
- SPA conectada a la API;
- dashboard tipo **QA command center**;
- interfaz completamente en español;
- diseño responsive.

### 🗄️ Datos e infraestructura local

- SQL Server 2022;
- Entity Framework Core SQL Server provider;
- Docker Compose;
- volumen persistente para la base de datos.

### 🧪 QA, testing y CI

- xUnit para pruebas automatizadas del backend;
- GitHub Actions para restore, build y tests .NET;
- GitHub Actions para instalación y build del frontend;
- trazabilidad de requisitos, riesgos, pruebas, ejecuciones y defectos;
- evidencia final para seguridad, rendimiento, usabilidad y UAT;
- quality gate calculado a partir de evidencia real.

---

## ✅ Fases implementadas

| Fase | Alcance | Estado |
|---:|---|:---:|
| 0 | Foundation: arquitectura, CI, SQL Server, health check y OpenAPI | ✅ |
| 1 | Autenticación, roles, proyectos y requisitos | ✅ |
| 2 | Análisis de riesgos y diseño de casos de prueba | ✅ |
| 3 | Ciclos de prueba y evidencia de ejecución | ✅ |
| 4 | Defectos, re-test y ciclo de regresión | ✅ |
| 5 | Matriz de trazabilidad y cobertura | ✅ |
| 6 | Reportes de calidad, métricas y quality gates | ✅ |
| 7 | Evidencia de seguridad, rendimiento, usabilidad y UAT | ✅ |

---

## 🧪 Quality gate

Un proyecto alcanza `Ready` cuando cumple simultáneamente:

- cobertura de requisitos ≥ **95%**;
- pass rate ≥ **90%**;
- al menos **1** Test Run completado;
- **0** ejecuciones pendientes en ciclos activos;
- **0** defectos críticos abiertos;
- **0** riesgos críticos abiertos;
- **4/4** áreas finales de validación con evidencia `Passed`.

Si las condiciones no se cumplen, QAssure devuelve `Conditional` o `Blocked` según la severidad de los incumplimientos.

---

## 🔄 Flujo funcional de QA

```text
1. Crear proyecto QA
        ↓
2. Registrar requisitos y criterios de aceptación
        ↓
3. Identificar y evaluar riesgos
        ↓
4. Diseñar casos de prueba
        ↓
5. Crear Test Runs
        ↓
6. Ejecutar pruebas y registrar evidencia
        ↓
7. Crear defectos cuando corresponda
        ↓
8. Corregir → Re-test → Regresión
        ↓
9. Revisar matriz de trazabilidad y cobertura
        ↓
10. Generar reporte de calidad
        ↓
11. Registrar evidencia final de validación
        ↓
12. Evaluar gate de liberación
```

---

## 🏗️ Arquitectura

```text
React 19 + TypeScript + Vite
            │
            │ HTTP / JSON
            ▼
      QAssure.Api
     ASP.NET Core 10
            │
            ▼
      Application
            │
            ▼
         Domain
            ▲
            │
     Infrastructure
      EF Core 10
            │
            ▼
     SQL Server 2022
```

---

## 🚀 Desarrollo local

### 1. SQL Server

```bash
docker compose up -d
```

El contenedor expone SQL Server por el puerto local `14333`.

### 2. Backend

```bash
cd backend/src/QAssure.Api
dotnet run
```

### 3. Frontend

```bash
cd frontend/qassure-web
npm install
npm run dev
```

La URL base predeterminada de la API para el frontend es `http://localhost:5000`.

### Credenciales locales

```text
Email:    admin@qassure.local
Password: QAssure.Local123!
```

Estas credenciales son exclusivamente para desarrollo local.

> El bootstrap académico utiliza `EnsureCreated`. Una evolución productiva debería sustituirlo por EF Core Migrations.

---

## 🧪 Calidad y CI

El workflow `.github/workflows/ci.yml` ejecuta:

**Backend**
- `dotnet restore`;
- `dotnet build` en Release;
- `dotnet test` en Release.

**Frontend**
- Node.js 22;
- `npm install`;
- TypeScript type-check;
- build de Vite.

---

## 📚 Evidencia y documentación

- [`docs/PHASE-1.md`](docs/PHASE-1.md)
- [`docs/PHASE-2.md`](docs/PHASE-2.md)
- [`docs/PHASE-3.md`](docs/PHASE-3.md)
- [`docs/PHASE-4.md`](docs/PHASE-4.md)
- [`docs/PHASE-5.md`](docs/PHASE-5.md)
- [`docs/PHASE-6.md`](docs/PHASE-6.md)
- [`docs/PHASE-7.md`](docs/PHASE-7.md)
- [`docs/FINAL-VALIDATION-CHECKLIST.md`](docs/FINAL-VALIDATION-CHECKLIST.md)
- [`docs/RELEASE-1.0.md`](docs/RELEASE-1.0.md)

---

## 🧠 Filosofía QA

QAssure está diseñado para que el propio sistema pueda verificarse y validarse utilizando las mismas prácticas que administra: análisis de requisitos, técnicas de diseño de pruebas, evaluación de riesgos, ejecución, defect management, re-test, regresión, trazabilidad, métricas, seguridad, rendimiento, usabilidad y aceptación de usuario.

---

<div align="center">

**QAssure · ISO-410 · UNAPEC · v1.0.0 · FROZEN**

</div>
