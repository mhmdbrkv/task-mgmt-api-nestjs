# Task Management API

A production-oriented REST API for managing projects, tasks, memberships, and collaboration.

Built with **NestJS, TypeScript, Prisma, and PostgreSQL**, with a focus on backend architecture, security, authorization, and maintainability.

> 🚧 This project is being built in public as I explore what it takes to design and build a production-ready backend system.

---

## 🧠 Why This Project?

This isn't just a CRUD application.

The goal is to practice the complete backend engineering process:

```text
Business Domain
      ↓
Domain & Data Modeling
      ↓
API Contract
      ↓
Architecture
      ↓
Implementation
      ↓
Security & Testing
      ↓
Production Readiness
```

The project is intentionally designed around **business rules and system behavior**, rather than starting with controllers and database tables.

---

## ✨ Features

### Authentication

- User registration & login
- JWT authentication
- Access & refresh tokens
- Session management
- Refresh token rotation
- Token reuse detection
- Session revocation
- Secure password hashing

### Authorization

- Role-Based Access Control (RBAC)
- Project-level roles
- Resource-level authorization
- Global authentication guard
- Route-level role restrictions
- Ownership checks

### Projects

- Create projects
- Update projects
- Delete projects
- List user's projects
- Manage project members
- Promote / demote project managers
- Transfer project ownership
- Leave projects

### Tasks

- Create tasks
- Update tasks
- Delete tasks
- Assign tasks
- Change task status
- Set task priority
- Set due dates
- Validate project membership before assignment

### Collaboration

- Project invitations
- Accept / reject invitations
- Cancel invitations
- Project comments
- Member management

---

## 🏗️ Architecture

The application follows a modular architecture built around **NestJS modules and domain responsibilities**.

```text
src/
│
├── auth/
│   ├── controllers/
│   ├── services/
│   ├── strategies/
│   └── guards/
│
├── users/
│
├── projects/
│   ├── controllers/
│   ├── services/
│   └── dto/
│
├── tasks/
│   ├── controllers/
│   ├── services/
│   └── dto/
│
├── invitations/
│
├── comments/
│
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
│
├── config/
│
└── prisma/
```

The architecture is intentionally kept pragmatic: enough structure to maintain clear boundaries without introducing unnecessary abstractions.

---

## 🧩 Domain Model

The core domain consists of:

```text
User
 │
 ├──────────────┐
 │              │
 ▼              ▼
Project      Invitation
 │
 ├── ProjectMembership
 │
 ├── Task
 │    └── Comment
 │
 └── Members
```

### Project Membership

A user belongs to a project through a membership:

```text
OWNER
  │
  ├── MANAGER
  │      │
  │      └── MEMBER
  │
  └── MEMBER
```

Permissions are determined by the user's role **within the project**, rather than globally.

---

## 🗄️ Database

The project uses:

- **PostgreSQL** — relational database
- **Prisma** — ORM & database client

Core entities:

```text
User
Project
ProjectMembership
Task
Comment
Invitation
Session
```

Relationships are designed around the domain rules.

For example, a task belongs to a project, while its assignee must be a member of that project.

---

## 🔐 Security

Security is treated as part of the architecture rather than an afterthought.

Current security considerations include:

- Password hashing with bcrypt
- JWT authentication
- Protected routes by default
- Explicit public-route opt-out
- Role-based authorization
- Resource-level authorization
- Input validation
- Environment variable validation
- Secure refresh-token handling
- Token rotation
- Session revocation
- Token reuse detection
- Timing-safe comparisons

---

## 🔄 Authentication Flow

```text
                 ┌──────────────┐
                 │    Login     │
                 └──────┬───────┘
                        │
                        ▼
                Validate Credentials
                        │
                        ▼
                Create Session
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        Access Token         Refresh Token
              │                   │
              ▼                   ▼
        API Requests          New Access
                                  Token
                                    │
                                    ▼
                            Rotate Refresh Token
```

Refresh tokens are associated with server-side sessions, allowing sessions to be revoked independently.

---

## 🛡️ Authorization Model

The API distinguishes between:

### Authentication

> "Who are you?"

Handled by the authentication layer.

### Role Authorization

> "What role do you have?"

Handled through project roles such as:

```text
OWNER
MANAGER
MEMBER
```

### Resource Authorization

> "Are you allowed to perform this action on this specific resource?"

For example:

```text
User
 ↓
Project Membership
 ↓
Project
 ↓
Task
```

A user cannot simply provide a `projectId` or `taskId` and gain access to it.

The service verifies the user's relationship with the resource.

---

## 🔌 API Design

The API follows REST principles while prioritizing clear domain actions where appropriate.

### Projects

```http
POST   /projects
GET    /projects
GET    /projects/:projectId
PATCH  /projects/:projectId
DELETE /projects/:projectId
```

### Project Members

```http
POST   /projects/:projectId/managers/:userId
DELETE /projects/:projectId/managers/:userId

DELETE /projects/:projectId/members/:userId

POST   /projects/:projectId/transfer-ownership
POST   /projects/:projectId/leave
```

### Tasks

```http
POST   /tasks
GET    /tasks/:taskId
PATCH  /tasks/:taskId
DELETE /tasks/:taskId

POST   /tasks/:taskId/assign
PATCH  /tasks/:taskId/status
```

### Invitations

```http
POST   /projects/:projectId/invitations
GET    /invitations
GET    /invitations/:invitationId

POST   /invitations/:invitationId/accept
POST   /invitations/:invitationId/reject

DELETE /invitations/:invitationId
```

> The API evolves as the domain model evolves.

---

## 🧪 Validation & Error Handling

The application uses NestJS validation mechanisms to keep invalid input outside the business logic.

Current approach includes:

- DTO validation
- `class-validator`
- `class-transformer`
- Environment validation
- Consistent response structure
- Standard HTTP status codes
- Centralized error handling

Example response:

```json
{
  "statusCode": 200,
  "message": "Task retrieved successfully",
  "data": {
    "id": "...",
    "title": "Implement authentication",
    "status": "IN_PROGRESS"
  }
}
```

---

## 🐳 Docker

The application uses a multi-stage Docker build.

```text
                Docker Build
                     │
          ┌──────────┴──────────┐
          │                     │
       Builder                Runtime
          │                     │
   Install dependencies    Production deps
   Compile TypeScript      Compiled application
          │                     │
          └──────────┬──────────┘
                     ▼
              Node.js Alpine
```

This keeps the production image focused on what is required to run the application.

---

## ⚙️ Configuration

Configuration is centralized and validated at startup.

Using:

- `@nestjs/config`
- Joi validation
- Environment variables
- Namespaced configuration

Example:

```text
DATABASE_URL
JWT_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
PORT
```

The application should fail fast when required configuration is missing or invalid.

---

## 🧪 Testing

Testing is part of the development process rather than something added at the end.

Planned / implemented areas include:

### Unit Tests

- Services
- Guards
- Interceptors
- Business rules

### Integration Tests

- Authentication flows
- Database interactions
- Authorization rules

### E2E Tests

- Registration
- Login
- Project lifecycle
- Task lifecycle
- Invitations
- Authorization scenarios

---

## 📈 Production Readiness

The project is being developed with the following concerns in mind:

```text
Security
   │
Performance
   │
Observability
   │
Reliability
   │
Maintainability
   │
Scalability
```

The goal isn't to prematurely optimize everything.

Instead, each concern is introduced when the system actually needs it.

---

## 🗺️ Roadmap

### Phase 1 — Foundation

- [x] NestJS project setup
- [x] Configuration
- [x] Environment validation
- [x] Database setup
- [x] Prisma integration
- [x] Global validation
- [x] Response handling

### Phase 2 — Authentication

- [x] User registration
- [x] Login
- [x] JWT authentication
- [x] Password hashing
- [x] Sessions
- [x] Refresh token rotation

### Phase 3 — Authorization

- [x] RBAC
- [x] Project membership
- [x] Resource authorization
- [ ] Complete authorization test coverage

### Phase 4 — Core Domain

- [x] Projects
- [x] Tasks
- [ ] Comments
- [ ] Invitations
- [ ] Complete project member management

### Phase 5 — Production

- [x] Docker
- [ ] Automated testing
- [ ] CI/CD
- [ ] Logging
- [ ] Observability
- [ ] Rate limiting
- [ ] Performance testing
- [ ] Production deployment

---

## 🧠 Engineering Decisions

This project is also a place to document the **why**, not just the **how**.

Examples of questions I'm exploring:

- Why use sessions with refresh tokens?
- Where should authorization logic live?
- When should an endpoint be RESTful vs action-oriented?
- How should ownership transfer work?
- What happens when a project member is removed?
- Should deleting a user delete their tasks?
- How should concurrent refresh requests be handled?
- When is a database transaction necessary?
- Where should business rules live?
- When does a system actually need caching?
- How do we evolve an API without breaking clients?

These decisions are documented as the system evolves.

---

## 🛠️ Stack

| Category         | Technology            |
| ---------------- | --------------------- |
| Runtime          | Node.js               |
| Framework        | NestJS                |
| Language         | TypeScript            |
| Database         | PostgreSQL            |
| ORM              | Prisma                |
| Authentication   | Passport.js / JWT     |
| Validation       | class-validator / Joi |
| Password Hashing | bcrypt                |
| Testing          | Jest / Supertest      |
| Containerization | Docker                |
| API Testing      | Postman               |
| Version Control  | Git / GitHub          |

---

## 🚀 Running Locally

### 1. Clone

```bash
git clone https://github.com/mhmdbrkv/task-mgmt-api-nestjs.git

cd task-mgmt-api-nestjs
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Configure the required values.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the application

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000/api
```

---

## 📖 API Documentation

API documentation will be available here as the project evolves.

> Coming soon: OpenAPI / Swagger documentation.

---

## 📌 Status

**Active development**

This project is intentionally evolving as I learn more about backend architecture, security, testing, and production engineering.

---

<div align="center">

### Built with NestJS & TypeScript ⚡

**Model → Design → Build → Test → Secure → Scale**

</div>
