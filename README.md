# School Registration System — Backend API

FastAPI backend for a school registration system with JWT authentication, role-based access control, file uploads, and PostgreSQL database.

## Tech Stack

- **FastAPI** — web framework
- **PostgreSQL** — database
- **SQLAlchemy** — ORM
- **Alembic** — migrations
- **JWT (python-jose)** — authentication
- **bcrypt** — password hashing
- **Pydantic** — request/response validation

## Project Structure

```
school-registration-system/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py             # Environment variable settings
│   ├── database.py           # SQLAlchemy engine and session
│   ├── models/               # SQLAlchemy ORM models
│   │   ├── user.py           # User (auth, roles)
│   │   ├── student.py        # Student (all form fields)
│   │   ├── subject.py        # Subject/course
│   │   └── student_subject.py # Many-to-many enrollment
│   ├── schemas/              # Pydantic request/response schemas
│   │   ├── user.py           # Auth schemas
│   │   ├── student.py        # Student form schemas
│   │   ├── subject.py        # Subject schemas
│   │   └── common.py         # Shared schemas
│   ├── auth/                 # Authentication module
│   │   ├── jwt_handler.py    # Token creation/verification
│   │   └── dependencies.py   # FastAPI auth dependencies (RBAC)
│   ├── routers/              # API route handlers
│   │   ├── auth.py           # /api/auth/*
│   │   ├── student.py        # /api/students/*
│   │   ├── admin.py          # /api/admin/*
│   │   ├── registrar.py      # /api/registrar/*
│   │   └── utils.py          # /api/utils/*
│   └── utils/
│       └── file_upload.py    # File validation and storage
├── alembic/                  # Database migration files
├── uploads/                  # Uploaded files (photos, documents)
├── alembic.ini
├── requirements.txt
├── seed.py                   # Initial data seeder
└── .env.example
```

## Installation

### 1. Clone and install dependencies

```bash
cd school-registration-system
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Set up PostgreSQL

Create the database:

```sql
CREATE DATABASE school_registration;
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and a secure JWT secret key.

### 4. Run database migrations

```bash
# Generate initial migration
alembic revision --autogenerate -m "initial tables"

# Apply migrations
alembic upgrade head
```

### 5. Seed initial data

```bash
python seed.py
```

This creates:
- **Admin**: admin@school.com / Admin123!
- **Registrar**: registrar@school.com / Registrar123!
- **3 sample students** with complete form data
- **10 subjects** across STEM, ABM, and HUMSS strands

### 6. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new student (email + password) |
| POST | `/api/auth/login` | Login (returns JWT token) |
| GET | `/api/auth/me` | Get current user info |

### Student (`/api/students`) — requires `student` role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/me` | Get own complete profile |
| PUT | `/api/students/me` | Update profile (all form fields) |
| POST | `/api/students/me/photo` | Upload student photo |
| POST | `/api/students/me/documents` | Upload documents (multiple files) |
| GET | `/api/students/me/subjects` | Get enrolled subjects |
| GET | `/api/students/me/status` | Check application status |

### Admin (`/api/admin`) — requires `admin` role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/students` | List all students (paginated, filterable) |
| GET | `/api/admin/students/pending` | List pending registrations |
| PUT | `/api/admin/students/{id}/approve` | Approve student |
| PUT | `/api/admin/students/{id}/deny` | Deny student |
| GET | `/api/admin/students/{id}` | Get student details |
| DELETE | `/api/admin/students/{id}` | Delete student |
| GET | `/api/admin/dashboard/stats` | Dashboard statistics |
| GET | `/api/admin/students/{id}/documents` | View student documents |

### Registrar (`/api/registrar`) — requires `registrar` role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/registrar/students/approved` | List approved students |
| POST | `/api/registrar/subjects` | Create subject |
| GET | `/api/registrar/subjects` | List subjects (filterable) |
| PUT | `/api/registrar/subjects/{id}` | Update subject |
| DELETE | `/api/registrar/subjects/{id}` | Delete subject |
| POST | `/api/registrar/assign-subject` | Assign subject to student |
| DELETE | `/api/registrar/unassign-subject` | Remove student from subject |
| GET | `/api/registrar/subjects/{id}/students` | Students in a subject |
| GET | `/api/registrar/students/{id}/complete-info` | Full student info |

### Utilities (`/api/utils`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/utils/provinces` | Philippine provinces |
| GET | `/api/utils/cities/{province}` | Cities by province |
| GET | `/api/utils/barangays/{city}` | Barangays by city |
| GET | `/api/utils/strands` | Available SHS strands |

## Student Form Fields

The student profile contains these sections matching the registration form:

**A. Grade Level & School Info**: school_year, lrn, is_returning_student, grade_level_to_enroll, last_grade_level_completed, last_school_year_completed, last_school_attended, school_type, strand, school_to_enroll_in, school_id, school_address

**B. Student Information**: psa_birth_certificate_no, lrn_learner_ref_no, student_photo_path, last_name, first_name, middle_name, suffix, birthday, age (auto-calculated), sex, mother_tongue, religion

**C. Address**: province, city_municipality, barangay, house_no_street, region

**D. Parent/Guardian**: father_full_name, father_contact, mother_full_name, mother_contact, guardian_full_name, guardian_contact

**E. Documents**: documents_path (JSON array of uploaded file paths)

## File Uploads

- **Photos**: JPG, PNG — max 5MB — stored in `uploads/photos/`
- **Documents**: PDF, JPG, PNG — max 5MB each — stored in `uploads/documents/`
- Files are served statically at `/uploads/{path}`

## Testing

```bash
# Register a student
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "TestPass123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@school.com", "password": "Admin123!"}'

# Use the returned token in subsequent requests
curl http://localhost:8000/api/admin/dashboard/stats \
  -H "Authorization: Bearer <your-token>"
```

Use the interactive Swagger UI at `/docs` for exploring all endpoints.
