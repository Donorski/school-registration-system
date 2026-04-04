"""
Curriculum seeder — clears all existing subjects and seeds the complete
SHS curriculum for Database Technology College, Inc.

Strands: ABM, HUMSS, GAS, CSS, EIM, EPAS, PROG
Categories: Core, Applied, Specialized

Run from the backend directory:
    python seed_curriculum.py
"""

from app.database import SessionLocal, engine, Base
from app.models.subject import Subject
from app.models.student_subject import StudentSubject  # noqa: F401 — ensure model is loaded


# ---------------------------------------------------------------------------
# Curriculum data
# Core subjects are the same for all strands (duplicated per strand below)
# ---------------------------------------------------------------------------

CORE_G11_S1 = [
    "Oral Communication in Context",
    "Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino",
    "General Mathematics",
    "Earth and Life Science",
    "Personal Development (Pansariling Kaunlaran)",
    "21st Century Literature from Philippines and the World",
    "Physical Education and Health",
]

CORE_G11_S2 = [
    "Reading and Writing Skills",
    "Pagbasa at Pagsusuri ng iba't Ibang teksto tungo sa Pananaliksik",
    "Statistics and Probability",
    "Physical Education and Health",
]

CORE_G12_S1 = [
    "Understanding Culture, Society and Politics",
    "Introduction to the Philosophy of Human Person",
    "Contemporary Philippine Arts from the Regions",
    "Media and Information Literacy",
    "Physical Education and Health",
]

CORE_G12_S2 = [
    "Physical Science",
    "Physical Education and Health",
]

CORE_BY_GRADE_SEM = {
    ("Grade 11", "1st Semester"): CORE_G11_S1,
    ("Grade 11", "2nd Semester"): CORE_G11_S2,
    ("Grade 12", "1st Semester"): CORE_G12_S1,
    ("Grade 12", "2nd Semester"): CORE_G12_S2,
}

# Applied and Specialized subjects per strand
# Format: { (grade_level, semester): [subject_names] }
STRAND_SUBJECTS = {
    "ABM": {
        "Applied": {
            ("Grade 11", "1st Semester"): ["Filipino sa Piling Larangan (Akademik)"],
            ("Grade 11", "2nd Semester"): [
                "Research 1 / Qualitative Research in Daily Life",
                "English for Academic and Professional Purposes",
            ],
            ("Grade 12", "1st Semester"): [
                "Research 2 / Quantitative Research in Daily Life",
                "Entrepreneurship",
            ],
            ("Grade 12", "2nd Semester"): [
                "Empowerment Technologies",
                "Inquiries, Investigations and Immersion",
            ],
        },
        "Specialized": {
            ("Grade 11", "1st Semester"): [
                "Business Mathematics",
                "Business Ethics and Social Responsibility",
            ],
            ("Grade 11", "2nd Semester"): [
                "Organization and Management",
                "Applied Economics",
            ],
            ("Grade 12", "1st Semester"): [
                "Fundamentals of Accountancy, Business and Management 1",
                "Business Finance",
            ],
            ("Grade 12", "2nd Semester"): [
                "Fundamentals of Accountancy, Business and Management 2",
                "Work Immersion",
            ],
        },
    },
    "HUMSS": {
        "Applied": {
            ("Grade 11", "1st Semester"): ["Pagsulat sa Filipino sa Piling Larangan"],
            ("Grade 11", "2nd Semester"): [
                "Research 1 / Qualitative Research in Daily Life",
                "English for Academic and Professional Purposes",
            ],
            ("Grade 12", "1st Semester"): ["Research 2 / Quantitative Research in Daily Life"],
            ("Grade 12", "2nd Semester"): [
                "Empowerment Technologies",
                "Inquiries, Investigation and Immersion",
                "Entrepreneurship",
            ],
        },
        "Specialized": {
            ("Grade 11", "1st Semester"): [
                "Humanities I: Introduction to the Religions and Belief System",
                "Social Science: Philippine Politics and Governance",
            ],
            ("Grade 11", "2nd Semester"): [
                "Humanities II: Creative Writing",
                "Trends, Networks and Critical Thinking",
            ],
            ("Grade 12", "1st Semester"): [
                "Creative Nonfiction: Literary Essay",
                "Disciplines and Ideas in the Social Sciences",
            ],
            ("Grade 12", "2nd Semester"): [
                "Community Engagement, Solidarity and Citizenship",
                "Disciplines and Ideas in the Applied Social Sciences",
                "Work Immersion",
            ],
        },
    },
    "GAS": {
        "Applied": {
            ("Grade 11", "1st Semester"): ["Filipino sa Piling Larangan (Akademik)"],
            ("Grade 11", "2nd Semester"): [
                "Research 1 / Qualitative Research in Daily Life",
                "English for Academic and Professional Purposes",
            ],
            ("Grade 12", "1st Semester"): ["Research 2 / Quantitative Research in Daily Life"],
            ("Grade 12", "2nd Semester"): [
                "Empowerment Technologies",
                "Inquiries, Investigation and Immersion",
                "Entrepreneurship",
            ],
        },
        "Specialized": {
            ("Grade 11", "1st Semester"): [
                "Humanities 1: Introduction to the Religions and Belief System",
                "Social Science: Philippine Politics and Governance",
            ],
            ("Grade 11", "2nd Semester"): [
                "Humanities II: Creative Writing",
                "Applied Economics",
            ],
            ("Grade 12", "1st Semester"): [
                "Organization and Management",
                "Elective I",
            ],
            ("Grade 12", "2nd Semester"): [
                "Disaster Readiness and Risk Reduction",
                "Elective II",
                "Work Immersion",
            ],
        },
    },
    "CSS": {
        "Applied": {
            ("Grade 11", "1st Semester"): ["Filipino sa Piling Larangan (Tech-Voc)"],
            ("Grade 11", "2nd Semester"): [
                "Practical Research 1 / Qualitative Research in Daily Life",
                "English for Academic and Professional Purposes",
            ],
            ("Grade 12", "1st Semester"): [
                "Practical Research 2 / Quantitative Research in Daily Life",
                "Entrepreneurship",
            ],
            ("Grade 12", "2nd Semester"): [
                "Empowerment Technologies",
                "Entrepreneurship",
                "Inquiries, Investigation and Immersion",
            ],
        },
        "Specialized": {
            ("Grade 11", "1st Semester"): ["CSS: Computer Systems Servicing NC II (Block 1)"],
            ("Grade 11", "2nd Semester"): ["CSS: Computer Systems Servicing NC II (Block 2)"],
            ("Grade 12", "1st Semester"): ["CSS: Computer Systems Servicing NC II (Block 3)"],
            ("Grade 12", "2nd Semester"): [
                "CSS: Computer Systems Servicing NC II (Block 4)",
                "Immersion",
            ],
        },
    },
    "EIM": {
        "Applied": {
            ("Grade 11", "1st Semester"): ["Filipino sa Piling Larangan (Tech-Voc)"],
            ("Grade 11", "2nd Semester"): [
                "Practical Research 1 / Qualitative Research in Daily Life",
                "English for Academic and Professional Purposes",
            ],
            ("Grade 12", "1st Semester"): [
                "Practical Research 2 / Quantitative Research in Daily Life",
                "Entrepreneurship",
            ],
            ("Grade 12", "2nd Semester"): [
                "Empowerment Technologies",
                "Entrepreneurship",
                "Inquiries, Investigation and Immersion",
            ],
        },
        "Specialized": {
            ("Grade 11", "1st Semester"): ["EIM: Electrical Installation and Maintenance NC II (Block 1)"],
            ("Grade 11", "2nd Semester"): ["EIM: Electrical Installation and Maintenance NC II (Block 2)"],
            ("Grade 12", "1st Semester"): ["EIM: Electrical Installation and Maintenance NC II (Block 3)"],
            ("Grade 12", "2nd Semester"): [
                "EIM: Electrical Installation and Maintenance NC II (Block 4)",
                "Work Immersion",
            ],
        },
    },
    "EPAS": {
        "Applied": {
            ("Grade 11", "1st Semester"): ["Filipino sa Piling Larangan (Akademik)"],
            ("Grade 11", "2nd Semester"): [
                "Practical Research 1 / Qualitative Research in Daily Life",
                "English for Academic and Professional Purposes",
            ],
            ("Grade 12", "1st Semester"): ["Practical Research 2 / Quantitative Research in Daily Life"],
            ("Grade 12", "2nd Semester"): [
                "Empowerment Technologies",
                "Inquiries, Investigation and Immersion",
                "Entrepreneurship",
            ],
        },
        "Specialized": {
            ("Grade 11", "1st Semester"): ["EPAS: Electronic Products Assembly and Servicing NC II (Block 1)"],
            ("Grade 11", "2nd Semester"): ["EPAS: Electronic Products Assembly and Servicing NC II (Block 2)"],
            ("Grade 12", "1st Semester"): ["EPAS: Electronic Products Assembly and Servicing NC II (Block 3)"],
            ("Grade 12", "2nd Semester"): [
                "EPAS: Electronic Products Assembly and Servicing NC II (Block 4)",
                "Work Immersion",
            ],
        },
    },
    "PROG": {
        "Applied": {
            ("Grade 11", "1st Semester"): ["Filipino sa Piling Larangan (Tech-Voc)"],
            ("Grade 11", "2nd Semester"): [
                "Practical Research 1 / Qualitative Research in Daily Life",
                "English for Academic and Professional Purposes",
            ],
            ("Grade 12", "1st Semester"): [
                "Practical Research 2 / Quantitative Research in Daily Life",
                "Entrepreneurship",
            ],
            ("Grade 12", "2nd Semester"): [
                "Empowerment Technologies",
                "Entrepreneurship",
                "Inquiries, Investigation and Immersion",
            ],
        },
        "Specialized": {
            ("Grade 11", "1st Semester"): [
                "Intro to Computer Applications",
                "Logic Formulation",
            ],
            ("Grade 11", "2nd Semester"): [
                "Advance C Programming",
                "Introduction to Visual Programming (VB.NET)",
            ],
            ("Grade 12", "1st Semester"): [
                "Advance Visual Programming (VB.NET)",
                "Database Management",
            ],
            ("Grade 12", "2nd Semester"): [
                "Introduction to Object-Oriented Programming",
                "Advance OOP (JAVA)",
                "Work Immersion",
            ],
        },
    },
}

GRADE_SHORT = {"Grade 11": "11", "Grade 12": "12"}
SEM_SHORT = {"1st Semester": "S1", "2nd Semester": "S2"}
CAT_SHORT = {"Core": "CO", "Applied": "AP", "Specialized": "SP"}


def make_code(strand: str, grade: str, sem: str, category: str, seq: int) -> str:
    """Generate a unique subject code under 20 chars."""
    return f"{strand}{GRADE_SHORT[grade]}{SEM_SHORT[sem]}{CAT_SHORT[category]}{seq:02d}"


def build_subjects() -> list[Subject]:
    subjects: list[Subject] = []

    for strand, strand_data in STRAND_SUBJECTS.items():
        for grade, sem in [
            ("Grade 11", "1st Semester"),
            ("Grade 11", "2nd Semester"),
            ("Grade 12", "1st Semester"),
            ("Grade 12", "2nd Semester"),
        ]:
            # Core subjects
            for seq, name in enumerate(CORE_BY_GRADE_SEM[(grade, sem)], start=1):
                subjects.append(Subject(
                    subject_code=make_code(strand, grade, sem, "Core", seq),
                    subject_name=name,
                    units=0,
                    schedule="TBA",
                    strand=strand,
                    grade_level=grade,
                    semester=sem,
                    category="Core",
                    max_students=40,
                ))

            # Applied subjects
            applied = strand_data.get("Applied", {}).get((grade, sem), [])
            for seq, name in enumerate(applied, start=1):
                subjects.append(Subject(
                    subject_code=make_code(strand, grade, sem, "Applied", seq),
                    subject_name=name,
                    units=0,
                    schedule="TBA",
                    strand=strand,
                    grade_level=grade,
                    semester=sem,
                    category="Applied",
                    max_students=40,
                ))

            # Specialized subjects
            specialized = strand_data.get("Specialized", {}).get((grade, sem), [])
            for seq, name in enumerate(specialized, start=1):
                subjects.append(Subject(
                    subject_code=make_code(strand, grade, sem, "Specialized", seq),
                    subject_name=name,
                    units=0,
                    schedule="TBA",
                    strand=strand,
                    grade_level=grade,
                    semester=sem,
                    category="Specialized",
                    max_students=40,
                ))

    return subjects


def seed_curriculum():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Remove all enrollments first (FK safety), then all subjects
        deleted_enrollments = db.query(StudentSubject).delete()
        deleted_subjects = db.query(Subject).delete()
        db.flush()
        print(f"Cleared {deleted_subjects} existing subjects and {deleted_enrollments} enrollment records.")

        subjects = build_subjects()
        db.add_all(subjects)
        db.commit()

        print(f"Seeded {len(subjects)} subjects across 7 strands.")
        print()

        # Summary per strand
        strand_counts = {}
        for s in subjects:
            strand_counts[s.strand] = strand_counts.get(s.strand, 0) + 1
        for strand, count in sorted(strand_counts.items()):
            print(f"  {strand}: {count} subjects")

    except Exception as e:
        db.rollback()
        print(f"Error seeding curriculum: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_curriculum()
