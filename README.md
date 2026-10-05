<div align="center">

# QAssure

**Software Quality Assurance Platform**

> Verify. Validate. Assure.

<img src="https://img.shields.io/badge/UNAPEC-ISO--410-003B70?style=for-the-badge" alt="UNAPEC ISO-410" />

<br/><br/>

<a href="https://github.com/Jairo0811/QAssure/actions/workflows/ci.yml"><img src="https://github.com/Jairo0811/QAssure/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>

</div>

---

## 📌 Descripción

**QAssure** es una plataforma de aseguramiento de calidad de software creada para **Verificación y Validación de Software (ISO-410)** en la **Universidad APEC (UNAPEC)**. Centraliza requisitos, riesgos, diseño y ejecución de pruebas, defectos, re-test, trazabilidad, métricas, quality gates y evidencia de validación.

```text
Project → Requirement → Risk → Test Case → Test Run → Execution
                                              ↓
                                           Defect
                                              ↓
                                           Re-test
                                              ↓
Traceability → Quality Report → Final Validation → Release Gate
```

## 🎓 Información académica

| Información | Detalle |
|---|---|
| Institución | **Universidad APEC (UNAPEC)** |
| Asignatura | **Verificación y Validación de Software (ISO-410)** |
| Profesor | **Luis Nuñez Acosta** |
| Período académico documentado en el repositorio | **Enero - Abril 2025** |
| Proyecto | **QAssure** |

### Equipo académico original

| Integrante | Matrícula UNAPEC |
|---|---|
| **Albert Mateo Tejada** | **A00107388** |
| **Francisco Daniel Lora Gonzalez** | **A00114255** |
| **Francis Jairo Matias Rosario** | **A00115261** |

---

## 🧱 Stack

- **Backend:** ASP.NET Core 10 Web API, C#, EF Core 10, Clean Architecture, JWT Bearer.
- **Frontend:** React 19, TypeScript, Vite.
- **Datos:** SQL Server + Docker Compose.
- **QA:** xUnit, GitHub Actions, k6; documentación para seguridad, heurísticas de usabilidad y UAT.

## ✅ Estado — 7 fases completas

| Fase | Alcance | Estado |
|---:|---|:---:|
| Foundation | Arquitectura, CI, SQL Server, health check | ✅ |
| 1 | Authentication, Roles, Projects, Requirements | ✅ |
| 2 | Risk Analysis, Test Case Design | ✅ |
| 3 | Test Runs, Execution Evidence | ✅ |
| 4 | Defects, Re-test, Regression Loop | ✅ |
| 5 | Traceability Matrix, Coverage | ✅ |
| 6 | Quality Reports, Metrics, Quality Gates | ✅ |
| 7 | Security, Performance, Usability, UAT Evidence | ✅ |

La aplicación está en estado **QAssure 1.0 Release Candidate**. El código de las siete fases está implementado; el quality gate de cada proyecto sigue dependiendo de la evidencia real registrada y no se marca verde de forma artificial.

## 🧪 Quality gate

Un proyecto alcanza `Ready` cuando cumple simultáneamente:

- Requirement coverage ≥ **95%**.
- Pass rate ≥ **90%**.
- Al menos **1** Test Run completado.
- **0** ejecuciones pendientes en ciclos activos.
- **0** defectos críticos abiertos.
- **0** riesgos críticos abiertos.
- **4/4** áreas finales de validación con evidencia Passed.

De lo contrario QAssure devuelve `Conditional` o `Blocked` según la severidad de las condiciones incumplidas.

## 🚀 Desarrollo local

```bash
docker compose up -d

cd backend/src/QAssure.Api
dotnet run

cd frontend/qassure-web
npm install
npm run dev
```

Frontend default API: `http://localhost:5000`.

### Credenciales locales

- Email: `admin@qassure.local`
- Password: `QAssure.Local123!`

Solo para desarrollo local.

> **Nota de base de datos:** el bootstrap académico actual usa `EnsureCreated`. Si se actualiza desde una fase anterior, recrear una vez la base local para incorporar `Defects` y `ValidationEvidences`. Para producción se recomienda migrar a EF Core Migrations.

## 📚 Evidencia por fase

- [`docs/PHASE-1.md`](docs/PHASE-1.md)
- [`docs/PHASE-2.md`](docs/PHASE-2.md)
- [`docs/PHASE-3.md`](docs/PHASE-3.md)
- [`docs/PHASE-4.md`](docs/PHASE-4.md)
- [`docs/PHASE-5.md`](docs/PHASE-5.md)
- [`docs/PHASE-6.md`](docs/PHASE-6.md)
- [`docs/PHASE-7.md`](docs/PHASE-7.md)
- [`docs/FINAL-VALIDATION-CHECKLIST.md`](docs/FINAL-VALIDATION-CHECKLIST.md)
- [`docs/RELEASE-1.0.md`](docs/RELEASE-1.0.md)
