<div align="center">

# QAssure

**Software Quality Assurance Platform**

> Verify. Validate. Assure.

<img src="https://img.shields.io/badge/UNAPEC-ISO--410-003B70?style=for-the-badge" alt="UNAPEC ISO-410" />

<br/><br/>

<a href="https://github.com/Jairo0811/QAssure/actions/workflows/ci.yml">
  <img src="https://github.com/Jairo0811/QAssure/actions/workflows/ci.yml/badge.svg" alt="CI" />
</a>

</div>

---

## 📌 Descripción

**QAssure** es una plataforma de aseguramiento de calidad de software creada para **Verificación y Validación de Software (ISO-410)** en la **Universidad APEC (UNAPEC)**.

Centraliza requisitos, riesgos, casos de prueba, ejecuciones, defectos, trazabilidad, métricas de calidad y evidencia de validación dentro de un flujo integrado de QA.

```text
Requirements → Risks → Test Cases → Test Runs → Defects → Re-test → Regression → Validation → Quality Report
```

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

## 🧭 Continuidad académica

### 🎓 Puente interinstitucional ITLA → UNAPEC

Los tres integrantes del equipo tienen trayectoria académica documentada tanto en **ITLA** como en **UNAPEC**.

| Integrante | Matrícula ITLA | Matrícula UNAPEC |
|---|---:|---:|
| Albert Mateo Tejada | **2018-6302** | **A00107388** |
| Francisco Daniel Lora Gonzalez | **2019-7800** | **A00114255** |
| Francis Jairo Matias Rosario | **2015-2984** | **A00115261** |

Esta tabla documenta únicamente la continuidad institucional de cada integrante. **No implica que hayan cursado las mismas asignaturas ni que hayan coincidido académicamente entre sí en ITLA.**

---

## 🧱 Stack tecnológico

### ⚙️ Backend

<p>
  <img src="https://skillicons.dev/icons?i=cs,dotnet" alt="C# y .NET" />
  <img src="https://img.shields.io/badge/ASP.NET%20Core-Web%20API-512BD4?style=flat-square&logo=dotnet&logoColor=white" alt="ASP.NET Core Web API" />
  <img src="https://img.shields.io/badge/EF%20Core-10-512BD4?style=flat-square&logo=dotnet&logoColor=white" alt="Entity Framework Core 10" />
</p>

- ASP.NET Core 10 Web API;
- C#;
- Entity Framework Core 10;
- Clean Architecture;
- JWT Bearer;
- autorización basada en roles;
- OpenAPI.

### 🎨 Frontend

<p>
  <img src="https://skillicons.dev/icons?i=react,ts,vite" alt="React, TypeScript y Vite" />
</p>

- React 19;
- TypeScript;
- Vite;
- workspace QA conectado a la API.

### 🗄️ Datos

<p>
  <img src="https://skillicons.dev/icons?i=sqlserver" alt="SQL Server" />
</p>

- SQL Server;
- Entity Framework Core;
- entorno local mediante Docker Compose.

### 🧪 QA, testing y CI

<p>
  <img src="https://img.shields.io/badge/xUnit-Unit%20Tests-512BD4?style=flat-square&logo=dotnet&logoColor=white" alt="xUnit" />
  <img src="https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/Postman%20%2F%20Newman-API%20Testing-FF6C37?style=flat-square&logo=postman&logoColor=white" alt="Postman Newman" />
  <img src="https://img.shields.io/badge/k6-Performance-7D64FF?style=flat-square&logo=k6&logoColor=white" alt="k6" />
  <img src="https://skillicons.dev/icons?i=git,github,githubactions,docker" alt="Git, GitHub, GitHub Actions y Docker" />
</p>

- xUnit para pruebas unitarias;
- k6 para pruebas de rendimiento;
- GitHub Actions para CI;
- Playwright para E2E **planificado**;
- Postman/Newman para API testing **planificado**.

---

## ✅ Implementación actual

### Foundation

- Clean Architecture solution structure.
- SQL Server local environment with Docker Compose.
- Health endpoint and OpenAPI foundation.
- GitHub Actions backend/frontend CI.
- QA-themed QAssure web shell.

### Phase 1 — Authentication, Projects & Requirements

- JWT authentication.
- Roles: Admin, QA Lead, Tester, Developer, Stakeholder.
- QA project creation and management.
- Requirement creation, editing and approval.
- Functional/non-functional requirements.
- Acceptance criteria and project criticality.
- Real frontend workspace connected to the API.
- Boundary-value unit tests for project keys and requirement rules.

See [`docs/PHASE-1.md`](docs/PHASE-1.md) for the endpoints, roles and ISO-410 test scenarios.

---

## 🗺️ Roadmap de módulos

| # | Módulo | Estado |
|---:|---|:---:|
| 1 | Authentication & Roles | ✅ |
| 2 | Projects | ✅ |
| 3 | Requirements | ✅ |
| 4 | Risk Analysis | ⏳ |
| 5 | Test Cases | ⏳ |
| 6 | Test Runs | ⏳ |
| 7 | Defects | ⏳ |
| 8 | Traceability Matrix | ⏳ |
| 9 | Quality Dashboard | ⏳ |
| 10 | Reports | ⏳ |

---

## 🚀 Desarrollo local

```bash
# SQL Server
docker compose up -d

# Backend
cd backend/src/QAssure.Api
dotnet run

# Frontend
cd frontend/qassure-web
npm install
npm run dev
```

The frontend uses `http://localhost:5000` as its default API URL. Copy `.env.example` to `.env` when a different API URL is needed.

### Credenciales de desarrollo

- **Email:** `admin@qassure.local`
- **Password:** `QAssure.Local123!`

Estas credenciales y la JWT signing key son exclusivamente para desarrollo local.

---

## 🧪 Filosofía QA

QAssure está diseñado para que el propio sistema pueda verificarse y validarse utilizando las mismas técnicas que administra: equivalence partitioning, boundary value analysis, decision tables, state transitions, use-case testing, regression, performance, security, usability y user acceptance testing.
