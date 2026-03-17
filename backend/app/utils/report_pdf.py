"""PDF report generation for enrollment data using reportlab."""

from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

# ── Brand colours (match the app's emerald palette) ──────────────────
HEADER_BG = colors.HexColor("#065f46")   # emerald-800
HEADER_FG = colors.white
ACCENT    = colors.HexColor("#10b981")   # emerald-500
ROW_ALT   = colors.HexColor("#f0fdf4")   # emerald-50
BORDER    = colors.HexColor("#d1d5db")   # gray-300
TEXT_DARK = colors.HexColor("#1f2937")   # gray-800
TEXT_MUTED= colors.HexColor("#6b7280")   # gray-500


def build_enrollment_report(
    students: list,
    school_year: str | None,
    semester: str | None,
    total_count: int,
    pending_count: int,
    approved_count: int,
    denied_count: int,
    enrolled_count: int,
) -> bytes:
    """
    Build a professional enrollment PDF report.

    students      — fully enrolled Student ORM objects (payment_status=verified + has subjects)
    *_count       — pre-computed aggregates
    Returns raw PDF bytes.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title2", parent=styles["Title"],
        fontSize=18, leading=22, textColor=HEADER_BG,
        alignment=TA_CENTER, spaceAfter=2,
    )
    sub_style = ParagraphStyle(
        "Sub", parent=styles["Normal"],
        fontSize=11, textColor=TEXT_MUTED,
        alignment=TA_CENTER, spaceAfter=2,
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"],
        fontSize=12, textColor=HEADER_BG,
        spaceBefore=12, spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body2", parent=styles["Normal"],
        fontSize=10, textColor=TEXT_DARK, leading=14,
    )
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"],
        fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER,
    )

    story = []
    now_str = datetime.now().strftime("%B %d, %Y  %I:%M %p")

    # ── Letterhead ───────────────────────────────────────────────────
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=6))
    story.append(Paragraph("STUDENT ENROLLMENT REPORT", title_style))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceBefore=6, spaceAfter=10))

    # ── Report metadata ───────────────────────────────────────────────
    filter_sy  = school_year or "All School Years"
    filter_sem = semester    or "All Semesters"
    meta_data = [
        ["Date Generated:", now_str,  "School Year:", filter_sy],
        ["",                "",        "Semester:",    filter_sem],
    ]
    meta_table = Table(meta_data, colWidths=[1.3*inch, 2.5*inch, 1.1*inch, 2.1*inch])
    meta_table.setStyle(TableStyle([
        ("FONTNAME",  (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME",  (0, 0), (0, -1),  "Helvetica-Bold"),
        ("FONTNAME",  (2, 0), (2, -1),  "Helvetica-Bold"),
        ("FONTSIZE",  (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_DARK),
        ("TEXTCOLOR", (1, 0), (1, -1),  TEXT_MUTED),
        ("TEXTCOLOR", (3, 0), (3, -1),  TEXT_MUTED),
        ("ALIGN",     (0, 0), (-1, -1), "LEFT"),
        ("VALIGN",    (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 16))

    # ── Section 1: Enrollment Summary ────────────────────────────────
    story.append(Paragraph("I. ENROLLMENT SUMMARY", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8))

    summary_data = [
        ["Metric",           "Count"],
        ["Total Registrants", str(total_count)],
        ["Approved",          str(approved_count)],
        ["Pending",           str(pending_count)],
        ["Denied",            str(denied_count)],
        ["Fully Enrolled",    str(enrolled_count)],
    ]
    summary_table = Table(summary_data, colWidths=[3.5*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  HEADER_BG),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  HEADER_FG),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  10),
        ("ALIGN",         (0, 0), (-1, 0),  "LEFT"),
        ("LEFTPADDING",   (0, 0), (-1, 0),  8),
        # Fully Enrolled row highlight
        ("BACKGROUND",    (0, 5), (-1, 5),  colors.HexColor("#d1fae5")),
        ("FONTNAME",      (0, 5), (-1, 5),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, 5), (-1, 5),  HEADER_BG),
        # Alternating rows
        ("BACKGROUND",    (0, 1), (-1, 1),  colors.white),
        ("BACKGROUND",    (0, 2), (-1, 2),  ROW_ALT),
        ("BACKGROUND",    (0, 3), (-1, 3),  colors.white),
        ("BACKGROUND",    (0, 4), (-1, 4),  ROW_ALT),
        ("GRID",          (0, 0), (-1, -1), 0.5, BORDER),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 10),
        ("ALIGN",         (1, 0), (1, -1),  "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",   (0, 1), (-1, -1), 8),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    # ── Section 2: Fully Enrolled Students List ───────────────────────
    story.append(Paragraph("II. LIST OF FULLY ENROLLED STUDENTS", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8))

    if not students:
        story.append(Paragraph(
            "No fully enrolled students found for the selected filters.", body_style
        ))
    else:
        enrolled_data = [[
            "#", "Student No.", "Full Name", "Grade", "Strand", "Semester", "School Year",
        ]]
        for idx, s in enumerate(students, start=1):
            parts = [s.last_name or "", s.first_name or "", s.middle_name or ""]
            full_name = ", ".join(p for p in parts if p).strip(", ") or f"Student ID {s.id}"
            enrolled_data.append([
                str(idx),
                s.student_number or "—",
                full_name,
                s.grade_level_to_enroll or "—",
                s.strand or "—",
                s.semester or "—",
                s.school_year or "—",
            ])

        col_widths = [0.35*inch, 1.0*inch, 2.0*inch, 0.7*inch, 0.85*inch, 1.05*inch, 1.05*inch]
        enrolled_table = Table(enrolled_data, colWidths=col_widths, repeatRows=1)
        enrolled_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, 0),  HEADER_BG),
            ("TEXTCOLOR",     (0, 0), (-1, 0),  HEADER_FG),
            ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
            ("FONTSIZE",      (0, 0), (-1, 0),  9),
            ("ALIGN",         (0, 0), (-1, 0),  "CENTER"),
            ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE",      (0, 1), (-1, -1), 8),
            ("ALIGN",         (0, 1), (0, -1),  "CENTER"),
            ("ALIGN",         (1, 1), (1, -1),  "CENTER"),
            ("ALIGN",         (3, 1), (6, -1),  "CENTER"),
            ("ROWBACKGROUND", (0, 1), (-1, -1), [colors.white, ROW_ALT]),
            ("GRID",          (0, 0), (-1, -1), 0.5, BORDER),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING",   (0, 0), (-1, -1), 4),
        ]))
        story.append(enrolled_table)

    # ── Footer ────────────────────────────────────────────────────────
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"This report was generated on {now_str} by the School Registration System.",
        footer_style,
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
