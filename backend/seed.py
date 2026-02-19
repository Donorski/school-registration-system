"""Seed script — creates initial admin, registrar, sample students, and subjects."""

from datetime import date, datetime, timezone

from app.database import SessionLocal, engine, Base
from app.auth.jwt_handler import hash_password
from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus, SchoolType, Sex
from app.models.subject import Subject
from app.models.notification import Notification  # noqa: F401 — ensure table is created


def seed():
    # Create all tables (safe if they already exist)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "admin@school.com").first():
            print("Database already seeded. Skipping.")
            return

        # --- Admin ---
        admin = User(
            email="admin@school.com",
            password_hash=hash_password("Admin123!"),
            role=UserRole.ADMIN,
        )
        db.add(admin)

        # --- Registrar ---
        registrar = User(
            email="registrar@school.com",
            password_hash=hash_password("Registrar123!"),
            role=UserRole.REGISTRAR,
        )
        db.add(registrar)

        # --- Sample Students ---
        sample_students = [
            {
                "email": "juan.delacruz@email.com",
                "password": "Student123!",
                "student_number": "DBTC-1-25",
                "status": StudentStatus.APPROVED,
                "school_year": "2024-2025",
                "lrn": "123456789012",
                "is_returning_student": False,
                "grade_level_to_enroll": "Grade 11",
                "last_grade_level_completed": "Grade 10",
                "last_school_year_completed": "2023-2024",
                "last_school_attended": "Manila Science High School",
                "school_type": SchoolType.PUBLIC,
                "strand": "STEM",
                "school_to_enroll_in": "Philippine Science High School",
                "school_address": "Diliman, Quezon City",
                "psa_birth_certificate_no": "PSA-2008-12345",
                "lrn_learner_ref_no": "123456789012",
                "last_name": "Dela Cruz",
                "first_name": "Juan",
                "middle_name": "Santos",
                "birthday": date(2008, 5, 15),
                "age": 16,
                "sex": Sex.MALE,
                "mother_tongue": "Filipino",
                "religion": "Roman Catholic",
                "province": "Metro Manila",
                "city_municipality": "Quezon City",
                "barangay": "Diliman",
                "house_no_street": "123 Katipunan Ave",
                "region": "NCR",
                "father_full_name": "Pedro Dela Cruz",
                "father_contact": "09171234567",
                "mother_full_name": "Maria Santos Dela Cruz",
                "mother_contact": "09181234567",
                "guardian_full_name": "Pedro Dela Cruz",
                "guardian_contact": "09171234567",
            },
            {
                "email": "maria.garcia@email.com",
                "password": "Student123!",
                "student_number": "DBTC-2-25",
                "status": StudentStatus.APPROVED,
                "school_year": "2024-2025",
                "lrn": "234567890123",
                "is_returning_student": False,
                "grade_level_to_enroll": "Grade 11",
                "last_grade_level_completed": "Grade 10",
                "last_school_year_completed": "2023-2024",
                "last_school_attended": "Makati High School",
                "school_type": SchoolType.PRIVATE,
                "strand": "ABM",
                "school_to_enroll_in": "Makati Business Academy",
                "school_address": "Poblacion, Makati",
                "psa_birth_certificate_no": "PSA-2008-23456",
                "lrn_learner_ref_no": "234567890123",
                "last_name": "Garcia",
                "first_name": "Maria",
                "middle_name": "Reyes",
                "birthday": date(2008, 8, 22),
                "age": 16,
                "sex": Sex.FEMALE,
                "mother_tongue": "Filipino",
                "religion": "Roman Catholic",
                "province": "Metro Manila",
                "city_municipality": "Makati",
                "barangay": "Poblacion",
                "house_no_street": "456 Ayala Ave",
                "region": "NCR",
                "father_full_name": "Carlos Garcia",
                "father_contact": "09191234567",
                "mother_full_name": "Ana Reyes Garcia",
                "mother_contact": "09201234567",
                "guardian_full_name": "Carlos Garcia",
                "guardian_contact": "09191234567",
            },
            {
                "email": "jose.rizal@email.com",
                "password": "Student123!",
                "student_number": "DBTC-3-25",
                "status": StudentStatus.APPROVED,
                "school_year": "2024-2025",
                "lrn": "345678901234",
                "is_returning_student": True,
                "grade_level_to_enroll": "Grade 12",
                "last_grade_level_completed": "Grade 11",
                "last_school_year_completed": "2023-2024",
                "last_school_attended": "Calamba National High School",
                "school_type": SchoolType.PUBLIC,
                "strand": "HUMSS",
                "school_to_enroll_in": "Calamba National High School",
                "school_address": "Calamba, Laguna",
                "psa_birth_certificate_no": "PSA-2007-34567",
                "lrn_learner_ref_no": "345678901234",
                "last_name": "Rizal",
                "first_name": "Jose",
                "middle_name": "Protasio",
                "suffix": "Jr.",
                "birthday": date(2007, 6, 19),
                "age": 17,
                "sex": Sex.MALE,
                "mother_tongue": "Tagalog",
                "religion": "Roman Catholic",
                "province": "Laguna",
                "city_municipality": "Calamba",
                "barangay": "Bagong Kalsada",
                "house_no_street": "789 Rizal St",
                "region": "Region IV-A",
                "father_full_name": "Francisco Rizal",
                "father_contact": "09211234567",
                "mother_full_name": "Teodora Alonzo Rizal",
                "mother_contact": "09221234567",
                "guardian_full_name": "Francisco Rizal",
                "guardian_contact": "09211234567",
            },
        ]

        for s in sample_students:
            user = User(
                email=s["email"],
                password_hash=hash_password(s["password"]),
                role=UserRole.STUDENT,
            )
            db.add(user)
            db.flush()

            student = Student(
                user_id=user.id,
                student_number=s["student_number"],
                status=s["status"],
                school_year=s["school_year"],
                lrn=s["lrn"],
                is_returning_student=s["is_returning_student"],
                grade_level_to_enroll=s["grade_level_to_enroll"],
                last_grade_level_completed=s["last_grade_level_completed"],
                last_school_year_completed=s["last_school_year_completed"],
                last_school_attended=s["last_school_attended"],
                school_type=s["school_type"],
                strand=s["strand"],
                school_to_enroll_in=s["school_to_enroll_in"],
                school_address=s["school_address"],
                psa_birth_certificate_no=s["psa_birth_certificate_no"],
                lrn_learner_ref_no=s["lrn_learner_ref_no"],
                last_name=s["last_name"],
                first_name=s["first_name"],
                middle_name=s["middle_name"],
                suffix=s.get("suffix"),
                birthday=s["birthday"],
                age=s["age"],
                sex=s["sex"],
                mother_tongue=s["mother_tongue"],
                religion=s["religion"],
                province=s["province"],
                city_municipality=s["city_municipality"],
                barangay=s["barangay"],
                house_no_street=s["house_no_street"],
                region=s["region"],
                father_full_name=s["father_full_name"],
                father_contact=s["father_contact"],
                mother_full_name=s["mother_full_name"],
                mother_contact=s["mother_contact"],
                guardian_full_name=s["guardian_full_name"],
                guardian_contact=s["guardian_contact"],
                documents_path=[],
            )
            db.add(student)

        # --- Subjects ---
        subjects = [
            # STEM — Grade 11
            Subject(subject_code="STEM11-GC", subject_name="General Chemistry 1", units=3, schedule="MWF 8:00-9:00 AM", strand="STEM", grade_level="Grade 11", max_students=40),
            Subject(subject_code="STEM11-GP", subject_name="General Physics 1", units=3, schedule="MWF 9:00-10:00 AM", strand="STEM", grade_level="Grade 11", max_students=40),
            Subject(subject_code="STEM11-PC", subject_name="Pre-Calculus", units=3, schedule="TTH 8:00-9:30 AM", strand="STEM", grade_level="Grade 11", max_students=40),
            Subject(subject_code="STEM11-CS", subject_name="Introduction to Computer Science", units=3, schedule="TTH 10:00-11:30 AM", strand="STEM", grade_level="Grade 11", max_students=35),
            # ABM — Grade 11
            Subject(subject_code="ABM11-BM", subject_name="Business Mathematics", units=3, schedule="MWF 8:00-9:00 AM", strand="ABM", grade_level="Grade 11", max_students=40),
            Subject(subject_code="ABM11-FA", subject_name="Fundamentals of ABM 1", units=3, schedule="MWF 10:00-11:00 AM", strand="ABM", grade_level="Grade 11", max_students=40),
            Subject(subject_code="ABM11-OB", subject_name="Organization and Management", units=3, schedule="TTH 8:00-9:30 AM", strand="ABM", grade_level="Grade 11", max_students=40),
            # HUMSS — Grade 12
            Subject(subject_code="HUMSS12-PP", subject_name="Philippine Politics and Governance", units=3, schedule="MWF 8:00-9:00 AM", strand="HUMSS", grade_level="Grade 12", max_students=40),
            Subject(subject_code="HUMSS12-CT", subject_name="Creative Writing", units=3, schedule="TTH 10:00-11:30 AM", strand="HUMSS", grade_level="Grade 12", max_students=35),
            Subject(subject_code="HUMSS12-SS", subject_name="Disciplines and Ideas in Social Sciences", units=3, schedule="MWF 10:00-11:00 AM", strand="HUMSS", grade_level="Grade 12", max_students=40),
        ]
        db.add_all(subjects)

        db.commit()
        print("Seed data created successfully!")
        print("  Admin:     admin@school.com / Admin123!")
        print("  Registrar: registrar@school.com / Registrar123!")
        print("  Students:  juan.delacruz@email.com / Student123!")
        print("             maria.garcia@email.com / Student123!")
        print("             jose.rizal@email.com / Student123!")
        print(f"  Subjects:  {len(subjects)} subjects created")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
