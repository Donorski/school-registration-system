# Senior High School Subjects Database

## Overview
Extracted and organized subjects from all Grade 11 & 12 curriculum documents for your school registration system.

## Academic Strands Available

### 1. ABM - Accountancy, Business and Management
- **Total Subjects**: 30
- **Grade Levels**: Grade 11, Grade 12
- **Focus**: Business, Accounting, Management

### 2. HUMSS - Humanities and Social Sciences  
- **Total Subjects**: 31
- **Grade Levels**: Grade 11, Grade 12
- **Focus**: Social Sciences, Humanities, Liberal Arts

### 3. TVL-CSS - Computer Systems Servicing
- **Total Subjects**: 24
- **Grade Levels**: Grade 11, Grade 12
- **Specialization**: Computer Hardware, Systems Servicing NC II

### 4. TVL-EPAS - Electrical Installation and Maintenance
- **Total Subjects**: 23
- **Grade Levels**: Grade 11, Grade 12
- **Specialization**: Electrical Installation NC II

### 5. TVL-Programming - Computer Programming
- **Total Subjects**: 32
- **Grade Levels**: Grade 11, Grade 12
- **Specialization**: Computer Programming NC IV

---

## Subject Structure

Each subject has:
- **Code**: Unique identifier (e.g., `ABM-CORE-001`)
- **Name**: Full subject name
- **Units**: Credit units (typically 2-6)
- **Semester**: 1st Semester or 2nd Semester
- **Year Level**: Grade 11 or Grade 12
- **Type**: Core, Specialized, or Immersion

---

## Sample Subjects by Strand

### ABM (30 subjects)
**Core Subjects (Grade 11 - 1st Sem):**
1. Oral Communication in Context (2 units)
2. Reading and Writing Skills (2 units)
3. Understanding Culture and Society and Politics (3 units)
4. Physical Science (3 units)
5. Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino (2 units)
6. General Mathematics (3 units)
7. Personal Development (2 units)
8. Physical Education and Health (2 units)

**Specialized Subjects:**
- Business Mathematics (3 units)
- Fund. Of Accountancy, Bus, and Mgt 1 (3 units)
- Organization and Management (3 units)
- Entrepreneurship (3 units)
- Business Finance (3 units)
- Applied Economics (3 units)

**Grade 12:**
- Research 1 & 2
- English for Academic & Professional Purposes
- Work Immersion (4 units)

---

### HUMSS (31 subjects)
**Core Subjects:** Same as ABM for Grade 11

**Specialized Subjects:**
- Creative Writing (3 units)
- Introduction to World Religions and Beliefs (3 units)
- Creative Nonfiction (3 units)
- Philippine Politics and Governance (3 units)
- Community Engagement, Solidarity and Citizenship (3 units)
- Trends, Networks and Critical Thinking (3 units)
- Disciplines and Ideas in Social Sciences (3 units)
- Disciplines and Ideas in Applied Social Science (3 units)

---

### TVL-CSS (24 subjects)
**Core Subjects:** Standard SHS core curriculum

**Specialized:**
- Computer Systems Servicing NC II (6 units per semester)
  - Covers all 4 semesters (Grade 11 & 12)
  
**Topics Covered:**
- Hardware installation and maintenance
- Network configuration
- Computer troubleshooting
- System diagnostics

---

### TVL-Programming (32 subjects)
**Core Subjects:** Standard SHS core curriculum

**Specialized:**
- Computer Programming NC IV (6 units per semester)
  - Covers all 4 semesters (Grade 11 & 12)

**Topics Covered:**
- Programming fundamentals
- Web development
- Database management
- Software development

---

## Database Integration

### Files Provided:
1. **`subjects_database.py`** - Python dictionary with all subjects
2. **`seed_subjects.py`** - Script to populate your database

### How to Use:

```bash
# 1. Make sure your backend is set up
cd backend

# 2. Copy the files to your backend folder
# - subjects_database.py
# - seed_subjects.py

# 3. Run the seed script
python seed_subjects.py

# This will add all 140+ subjects to your database!
```

### Seed Script Features:
- ✅ Automatically creates all database tables
- ✅ Adds all subjects with proper categorization
- ✅ Checks for duplicates (won't add if subjects exist)
- ✅ Can clear database: `python seed_subjects.py --clear`

---

## For Your Capstone System

### Student Registration Flow:
1. **Student registers** → Selects strand (ABM, HUMSS, TVL-CSS, etc.)
2. **Admin approves** → Student account activated
3. **Registrar assigns subjects** → Based on:
   - Student's chosen strand
   - Current grade level (11 or 12)
   - Current semester (1st or 2nd)

### Example:
If a student is:
- **Strand**: ABM
- **Grade Level**: Grade 11
- **Semester**: 1st Semester

The registrar can assign these subjects:
- Oral Communication in Context
- Reading and Writing Skills
- Understanding Culture and Society
- Physical Science
- Komunikasyon at Pananaliksik
- General Mathematics
- Personal Development
- Physical Education and Health
- Business Mathematics
- Fund. Of Accountancy 1

---

## API Endpoints You'll Need

```python
# Get subjects by strand
GET /api/v1/subjects?strand=ABM

# Get subjects by grade and semester
GET /api/v1/subjects?year_level=Grade 11&semester=1st Semester

# Assign subjects to student (Registrar only)
POST /api/v1/enrollments
{
  "student_id": 1,
  "subject_ids": [1, 2, 3, 4],
  "academic_year": "2024-2025",
  "semester": "1st Semester"
}

# Get student's enrolled subjects
GET /api/v1/students/{student_id}/subjects
```

---

## Next Steps for Your Capstone

1. ✅ Set up database models (already provided)
2. ✅ Seed subjects into database
3. 📝 Create API endpoints for:
   - Listing subjects by filters
   - Assigning subjects to students
   - Viewing student enrollments
4. 📝 Create frontend UI for:
   - Student: View assigned subjects
   - Registrar: Assign subjects interface
   - Admin: Manage subjects

---

## Statistics

- **Total Subjects**: 140+
- **Total Strands**: 5
- **Grade Levels**: 2 (Grade 11 & 12)
- **Semesters**: 2 per grade level
- **Subject Types**: 
  - Core (general education)
  - Specialized (strand-specific)
  - Immersion (work experience)

This database is complete and ready to use in your school registration system! 🎓
