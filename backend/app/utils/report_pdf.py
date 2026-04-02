"""PDF report generation for enrollment data using reportlab."""

from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak,
)
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart, HorizontalBarChart
from reportlab.graphics.charts.legends import Legend

# ── Brand colours (match the app's emerald palette) ──────────────────
HEADER_BG  = colors.HexColor("#065f46")   # emerald-800
HEADER_FG  = colors.white
ACCENT     = colors.HexColor("#10b981")   # emerald-500
ROW_ALT    = colors.HexColor("#f0fdf4")   # emerald-50
BORDER     = colors.HexColor("#d1d5db")   # gray-300
TEXT_DARK  = colors.HexColor("#1f2937")   # gray-800
TEXT_MUTED = colors.HexColor("#6b7280")   # gray-500

CHART_COLORS = [
    colors.HexColor("#10b981"),
    colors.HexColor("#3b82f6"),
    colors.HexColor("#8b5cf6"),
    colors.HexColor("#f59e0b"),
    colors.HexColor("#ef4444"),
    colors.HexColor("#ec4899"),
    colors.HexColor("#14b8a6"),
    colors.HexColor("#f97316"),
    colors.HexColor("#6366f1"),
    colors.HexColor("#84cc16"),
]
STATUS_COLORS = [
    colors.HexColor("#f59e0b"),  # Pending  — amber
    colors.HexColor("#22c55e"),  # Approved — green
    colors.HexColor("#ef4444"),  # Denied   — red
]


# ── Chart helpers ─────────────────────────────────────────────────────

def _make_pie(data_dict: dict, width: float, height: float,
              title: str, slice_colors: list | None = None) -> Drawing:
    """Return a Drawing containing a pie chart + legend."""
    drawing = Drawing(width, height)

    items = [(k, v) for k, v in data_dict.items() if v > 0]
    if not items:
        drawing.add(String(width / 2, height / 2, "No data",
                           textAnchor="middle", fontSize=9,
                           fontName="Helvetica", fillColor=TEXT_MUTED))
        return drawing

    labels, values = zip(*items)
    palette = slice_colors or CHART_COLORS

    pie = Pie()
    pie.x = 10
    pie.y = 20
    pie.width  = height - 45
    pie.height = height - 45
    pie.data   = list(values)
    pie.labels = [""] * len(labels)   # labels shown in legend only
    pie.simpleLabels = 1

    for i in range(len(values)):
        pie.slices[i].fillColor   = palette[i % len(palette)]
        pie.slices[i].strokeColor = colors.white
        pie.slices[i].strokeWidth = 1.5

    drawing.add(pie)

    # Legend
    legend = Legend()
    legend.x             = pie.x + pie.width + 12
    legend.y             = height - 24
    legend.dx            = 9
    legend.dy            = 9
    legend.fontName      = "Helvetica"
    legend.fontSize      = 7.5
    legend.strokeColor   = None
    legend.alignment     = "left"
    legend.columnMaximum = 8
    legend.colorNamePairs = [
        (palette[i % len(palette)], f"{labels[i]}  ({values[i]})")
        for i in range(len(labels))
    ]
    drawing.add(legend)

    # Title
    drawing.add(String(width / 2, height - 10, title,
                       textAnchor="middle", fontSize=9,
                       fontName="Helvetica-Bold", fillColor=HEADER_BG))
    return drawing


def _make_vbar(data_dict: dict, width: float, height: float, title: str) -> Drawing:
    """Return a Drawing containing a vertical bar chart."""
    drawing = Drawing(width, height)

    items = [(k, v) for k, v in data_dict.items() if v > 0]
    if not items:
        drawing.add(String(width / 2, height / 2, "No data",
                           textAnchor="middle", fontSize=9,
                           fontName="Helvetica", fillColor=TEXT_MUTED))
        return drawing

    labels, values = zip(*items)
    max_v = max(values)

    bc = VerticalBarChart()
    bc.x      = 35
    bc.y      = 35
    bc.width  = width - 50
    bc.height = height - 60
    bc.data   = [list(values)]

    bc.valueAxis.valueMin  = 0
    bc.valueAxis.valueMax  = max_v + max(1, max_v // 5)
    bc.valueAxis.valueStep = max(1, max_v // 5)
    bc.valueAxis.labels.fontName = "Helvetica"
    bc.valueAxis.labels.fontSize = 7.5

    bc.categoryAxis.categoryNames          = list(labels)
    bc.categoryAxis.labels.fontName        = "Helvetica"
    bc.categoryAxis.labels.fontSize        = 7.5
    bc.categoryAxis.labels.angle           = 20 if len(labels) > 5 else 0
    bc.categoryAxis.labels.boxAnchor       = "ne" if len(labels) > 5 else "n"
    bc.categoryAxis.labels.dx              = -4 if len(labels) > 5 else 0
    bc.categoryAxis.labels.dy              = -6 if len(labels) > 5 else -3

    bc.groupSpacing = 8
    bc.barSpacing   = 2
    bc.bars[0].fillColor   = ACCENT
    bc.bars[0].strokeColor = None

    for i in range(len(values)):
        bc.bars[0, i].fillColor = CHART_COLORS[i % len(CHART_COLORS)]

    drawing.add(bc)
    drawing.add(String(width / 2, height - 10, title,
                       textAnchor="middle", fontSize=9,
                       fontName="Helvetica-Bold", fillColor=HEADER_BG))
    return drawing


def _make_hbar(data_dict: dict, width: float, height: float, title: str) -> Drawing:
    """Return a Drawing containing a horizontal bar chart."""
    drawing = Drawing(width, height)

    items = [(k, v) for k, v in data_dict.items() if v > 0]
    if not items:
        drawing.add(String(width / 2, height / 2, "No data",
                           textAnchor="middle", fontSize=9,
                           fontName="Helvetica", fillColor=TEXT_MUTED))
        return drawing

    labels, values = zip(*items)
    max_v = max(values)

    bc = HorizontalBarChart()
    bc.x      = 85
    bc.y      = 20
    bc.width  = width - 105
    bc.height = height - 45

    bc.data = [list(values)]

    bc.valueAxis.valueMin  = 0
    bc.valueAxis.valueMax  = max_v + max(1, max_v // 5)
    bc.valueAxis.valueStep = max(1, max_v // 5)
    bc.valueAxis.labels.fontName = "Helvetica"
    bc.valueAxis.labels.fontSize = 7.5

    bc.categoryAxis.categoryNames    = list(labels)
    bc.categoryAxis.labels.fontName  = "Helvetica"
    bc.categoryAxis.labels.fontSize  = 7.5

    bc.groupSpacing = 8
    bc.barSpacing   = 2
    bc.bars[0].fillColor   = ACCENT
    bc.bars[0].strokeColor = None

    for i in range(len(values)):
        bc.bars[0, i].fillColor = CHART_COLORS[i % len(CHART_COLORS)]

    drawing.add(bc)
    drawing.add(String(width / 2, height - 10, title,
                       textAnchor="middle", fontSize=9,
                       fontName="Helvetica-Bold", fillColor=HEADER_BG))
    return drawing


# ── Main builder ──────────────────────────────────────────────────────

def build_enrollment_report(
    students: list,
    school_year: str | None,
    semester: str | None,
    total_count: int,
    pending_count: int,
    approved_count: int,
    denied_count: int,
    enrolled_count: int,
    by_strand: dict | None = None,
    by_grade_level: dict | None = None,
    by_enrollment_type: dict | None = None,
) -> bytes:
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
    now_str  = datetime.now().strftime("%B %d, %Y  %I:%M %p")
    PAGE_W   = 7.0 * inch   # usable width (letter − margins)
    CHART_H  = 185

    filter_sy  = school_year or "All School Years"
    filter_sem = semester    or "All Semesters"

    def _letterhead():
        story.append(Spacer(1, 4))
        story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=6))
        story.append(Paragraph("STUDENT ENROLLMENT REPORT", title_style))
        story.append(HRFlowable(width="100%", thickness=2, color=ACCENT,
                                spaceBefore=6, spaceAfter=10))

    def _meta():
        t = Table(
            [
                ["Date Generated:", now_str,  "School Year:", filter_sy],
                ["",                "",        "Semester:",    filter_sem],
            ],
            colWidths=[1.3 * inch, 2.5 * inch, 1.1 * inch, 2.1 * inch],
        )
        t.setStyle(TableStyle([
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
        story.append(t)

    def _footer(page_label: str):
        story.append(Spacer(1, 20))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            f"Generated on {now_str} by the School Registration System  ·  {page_label}",
            footer_style,
        ))

    # ════════════════════════════════════════════════════════════════
    # PAGE 1 — Section I: Enrollment Summary + Charts
    # ════════════════════════════════════════════════════════════════
    _letterhead()
    _meta()
    story.append(Spacer(1, 16))

    story.append(Paragraph("I. ENROLLMENT SUMMARY", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8))

    summary_data = [
        ["Metric",            "Count"],
        ["Total Registrants",  str(total_count)],
        ["Approved",           str(approved_count)],
        ["Pending",            str(pending_count)],
        ["Denied",             str(denied_count)],
        ["Fully Enrolled",     str(enrolled_count)],
    ]
    summary_table = Table(summary_data, colWidths=[3.5 * inch, 1.5 * inch])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  HEADER_BG),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  HEADER_FG),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  10),
        ("ALIGN",         (0, 0), (-1, 0),  "LEFT"),
        ("LEFTPADDING",   (0, 0), (-1, 0),  8),
        ("BACKGROUND",    (0, 5), (-1, 5),  colors.HexColor("#d1fae5")),
        ("FONTNAME",      (0, 5), (-1, 5),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, 5), (-1, 5),  HEADER_BG),
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
    story.append(Spacer(1, 18))

    # ── Row 1: Status pie  +  Enrollment-type pie ─────────────────
    status_dict = {}
    if pending_count:   status_dict["Pending"]  = pending_count
    if approved_count:  status_dict["Approved"] = approved_count
    if denied_count:    status_dict["Denied"]   = denied_count

    half = PAGE_W / 2 - 4
    pie_status = _make_pie(status_dict, half, CHART_H,
                           "Application Status", STATUS_COLORS)
    pie_type   = _make_pie(by_enrollment_type or {}, half, CHART_H,
                           "Enrollment Type")

    row1 = Table([[pie_status, pie_type]], colWidths=[half, half])
    row1.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(row1)
    story.append(Spacer(1, 12))

    # ── Row 2: Students by Strand (vertical bar) ──────────────────
    if by_strand:
        story.append(_make_vbar(by_strand, PAGE_W, CHART_H, "Students by Strand"))
        story.append(Spacer(1, 12))

    # ── Row 3: Students by Grade Level (horizontal bar) ───────────
    if by_grade_level:
        story.append(_make_hbar(by_grade_level, PAGE_W, CHART_H,
                                "Students by Grade Level"))

    _footer("Page 1 of 2")

    # ════════════════════════════════════════════════════════════════
    # PAGE 2 — Section II: Fully Enrolled Students List
    # ════════════════════════════════════════════════════════════════
    story.append(PageBreak())
    _letterhead()
    _meta()
    story.append(Spacer(1, 16))

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

    _footer("Page 2 of 2")

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
