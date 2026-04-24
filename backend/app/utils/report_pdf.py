"""PDF report generation for enrollment data using reportlab."""

import logging
from io import BytesIO
from datetime import datetime
from pathlib import Path

try:
    from PIL import Image as PILImage
    _PIL_AVAILABLE = True
except ImportError:
    _PIL_AVAILABLE = False

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak, Image,
)
from reportlab.lib.utils import ImageReader
from reportlab.graphics.shapes import Drawing, String, Rect, Group
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart, HorizontalBarChart
from reportlab.graphics.charts.legends import Legend

logger = logging.getLogger(__name__)

# ── Brand colours ─────────────────────────────────────────────────────
HEADER_BG  = colors.HexColor("#065f46")
HEADER_FG  = colors.white
ACCENT     = colors.HexColor("#10b981")
ROW_ALT    = colors.HexColor("#f0fdf4")
BORDER     = colors.HexColor("#d1d5db")
TEXT_DARK  = colors.HexColor("#1f2937")
TEXT_MUTED = colors.HexColor("#6b7280")
CARD_BG    = colors.HexColor("#f9fafb")
CARD_BORDER= colors.HexColor("#e5e7eb")

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
    colors.HexColor("#f59e0b"),  # Pending
    colors.HexColor("#22c55e"),  # Approved
    colors.HexColor("#ef4444"),  # Denied
]


# ── Chart helpers ──────────────────────────────────────────────────────

CAPTION_H = 16   # space reserved below each card for the caption


def _card(drawing: Drawing, w: float, h: float, title: str,
          description: str = "") -> Drawing:
    """Card + optional caption that sits below the card box (never overlaps content)."""
    total_h = h + CAPTION_H
    card = Drawing(w, total_h)

    # Caption below the card box
    if description:
        card.add(String(w / 2, 3, description,
                        textAnchor="middle", fontSize=5.5,
                        fontName="Helvetica-Oblique", fillColor=TEXT_MUTED))

    # Card box starts at CAPTION_H and goes up to total_h
    card.add(Rect(0, CAPTION_H, w, h, rx=4, ry=4,
                  fillColor=CARD_BG, strokeColor=CARD_BORDER, strokeWidth=0.5))
    # Title bar at the top of the card box
    card.add(Rect(0, CAPTION_H + h - 18, w, 18, rx=4, ry=4,
                  fillColor=HEADER_BG, strokeColor=None, strokeWidth=0))
    card.add(Rect(0, CAPTION_H + h - 18, w, 10,
                  fillColor=HEADER_BG, strokeColor=None, strokeWidth=0))
    card.add(String(w / 2, CAPTION_H + h - 13, title,
                    textAnchor="middle", fontSize=7.5,
                    fontName="Helvetica-Bold", fillColor=colors.white))

    # Shift all inner drawing content up by CAPTION_H
    g = Group(*drawing.contents)
    g.transform = (1, 0, 0, 1, 0, CAPTION_H)
    card.add(g)

    return card


def _make_pie(data_dict: dict, w: float, h: float, title: str,
              slice_colors: list | None = None,
              description: str = "") -> Drawing:
    inner_h = h - 20   # below title bar
    inner_w = w
    drawing = Drawing(inner_w, inner_h)

    items = [(k, v) for k, v in data_dict.items() if v > 0]
    if not items:
        drawing.add(String(inner_w / 2, inner_h / 2 - 6, "No data",
                           textAnchor="middle", fontSize=8,
                           fontName="Helvetica", fillColor=TEXT_MUTED))
        return _card(drawing, w, h, title)

    labels, values = zip(*items)
    palette = slice_colors or CHART_COLORS
    pie_size = min(inner_h - 20, 90)

    pie = Pie()
    pie.x = 10
    pie.y = (inner_h - pie_size) / 2
    pie.width  = pie_size
    pie.height = pie_size
    pie.data   = list(values)
    pie.labels = [""] * len(labels)
    pie.simpleLabels = 1

    for i in range(len(values)):
        pie.slices[i].fillColor   = palette[i % len(palette)]
        pie.slices[i].strokeColor = colors.white
        pie.slices[i].strokeWidth = 1.2
        pie.slices[i].popout      = 0

    drawing.add(pie)

    # Compact legend to the right of pie
    legend = Legend()
    legend.x             = pie.x + pie_size + 10
    legend.y             = pie.y + pie_size - 2
    legend.dx            = 8
    legend.dy            = 8
    legend.fontName      = "Helvetica"
    legend.fontSize      = 6.5
    legend.strokeColor   = None
    legend.alignment     = "left"
    legend.deltay        = 13
    legend.columnMaximum = 10
    legend.colorNamePairs = [
        (palette[i % len(palette)], f"{labels[i]} ({values[i]})")
        for i in range(len(labels))
    ]
    drawing.add(legend)

    return _card(drawing, w, h, title, description)


def _rotated_label(text: str, x: float, y: float, font_size: float = 6) -> Group:
    """Return a Group containing text rotated 90° CCW, centered at (x, y)."""
    s = String(0, 0, text, textAnchor="middle", fontSize=font_size,
               fontName="Helvetica", fillColor=TEXT_MUTED)
    g = Group(s)
    g.transform = (0, 1, -1, 0, x, y)   # 90° CCW rotation + translate
    return g


def _make_vbar(data_dict: dict, w: float, h: float, title: str,
               x_label: str = "", y_label: str = "No. of Students",
               description: str = "") -> Drawing:
    inner_h = h - 20
    drawing = Drawing(w, inner_h)

    items = [(k, v) for k, v in data_dict.items() if v > 0]
    if not items:
        drawing.add(String(w / 2, inner_h / 2 - 6, "No data",
                           textAnchor="middle", fontSize=8,
                           fontName="Helvetica", fillColor=TEXT_MUTED))
        return _card(drawing, w, h, title)

    labels, values = zip(*items)
    max_v = max(values)

    bc = VerticalBarChart()
    bc.x      = 32    # extra left room for Y-axis label
    bc.y      = 26    # extra bottom room for X-axis label
    bc.width  = w - 44
    bc.height = inner_h - 42

    bc.data = [list(values)]
    bc.valueAxis.valueMin  = 0
    bc.valueAxis.valueMax  = max_v + max(1, round(max_v * 0.2))
    bc.valueAxis.valueStep = max(1, round(max_v / 4))
    bc.valueAxis.labels.fontName  = "Helvetica"
    bc.valueAxis.labels.fontSize  = 6
    bc.valueAxis.gridStrokeColor  = colors.HexColor("#f3f4f6")
    bc.valueAxis.gridStrokeWidth  = 0.5

    bc.categoryAxis.categoryNames    = list(labels)
    bc.categoryAxis.labels.fontName  = "Helvetica"
    bc.categoryAxis.labels.fontSize  = 6
    bc.categoryAxis.labels.angle     = 15 if len(labels) > 4 else 0
    bc.categoryAxis.labels.boxAnchor = "ne" if len(labels) > 4 else "n"
    bc.categoryAxis.labels.dx        = -3 if len(labels) > 4 else 0
    bc.categoryAxis.labels.dy        = -4

    bc.groupSpacing = 6
    bc.barSpacing   = 1
    bc.bars[0].fillColor   = ACCENT
    bc.bars[0].strokeColor = None

    for i in range(len(values)):
        bc.bars[0, i].fillColor = CHART_COLORS[i % len(CHART_COLORS)]

    drawing.add(bc)

    # Y-axis label (rotated 90° CCW)
    drawing.add(_rotated_label(y_label, 7, bc.y + bc.height / 2))

    # X-axis label
    if x_label:
        drawing.add(String(bc.x + bc.width / 2, 5, x_label,
                           textAnchor="middle", fontSize=6,
                           fontName="Helvetica", fillColor=TEXT_MUTED))

    return _card(drawing, w, h, title, description)


def _make_hbar(data_dict: dict, w: float, h: float, title: str,
               x_label: str = "No. of Students", y_label: str = "",
               description: str = "") -> Drawing:
    inner_h = h - 20
    drawing = Drawing(w, inner_h)

    items = [(k, v) for k, v in data_dict.items() if v > 0]
    if not items:
        drawing.add(String(w / 2, inner_h / 2 - 6, "No data",
                           textAnchor="middle", fontSize=8,
                           fontName="Helvetica", fillColor=TEXT_MUTED))
        return _card(drawing, w, h, title)

    labels, values = zip(*items)
    max_v = max(values)

    bc = HorizontalBarChart()
    bc.x      = 65
    bc.y      = 20    # extra bottom room for X-axis label
    bc.width  = w - 79
    bc.height = inner_h - 32

    bc.data = [list(values)]
    bc.valueAxis.valueMin  = 0
    bc.valueAxis.valueMax  = max_v + max(1, round(max_v * 0.2))
    bc.valueAxis.valueStep = max(1, round(max_v / 4))
    bc.valueAxis.labels.fontName  = "Helvetica"
    bc.valueAxis.labels.fontSize  = 6
    bc.valueAxis.gridStrokeColor  = colors.HexColor("#f3f4f6")
    bc.valueAxis.gridStrokeWidth  = 0.5

    bc.categoryAxis.categoryNames   = list(labels)
    bc.categoryAxis.labels.fontName = "Helvetica"
    bc.categoryAxis.labels.fontSize = 6

    bc.groupSpacing = 6
    bc.barSpacing   = 1
    bc.bars[0].fillColor   = ACCENT
    bc.bars[0].strokeColor = None

    for i in range(len(values)):
        bc.bars[0, i].fillColor = CHART_COLORS[i % len(CHART_COLORS)]

    drawing.add(bc)

    # X-axis label (value axis — horizontal)
    drawing.add(String(bc.x + bc.width / 2, 5, x_label,
                       textAnchor="middle", fontSize=6,
                       fontName="Helvetica", fillColor=TEXT_MUTED))

    # Y-axis label (category axis — rotated)
    if y_label:
        drawing.add(_rotated_label(y_label, 7, bc.y + bc.height / 2))

    return _card(drawing, w, h, title, description)


# ── Main builder ───────────────────────────────────────────────────────

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
    by_sex: dict | None = None,
    by_payment: dict | None = None,
    school_name: str = "",
) -> bytes:
    buffer = BytesIO()

    now_str  = datetime.now().strftime("%B %d, %Y  %I:%M %p")

    def _on_page(canvas, doc):
        """Draw watermark + footer on every page automatically."""
        canvas.saveState()

        # Watermark — centred on the page
        if _watermark_buf is not None:
            try:
                _watermark_buf.seek(0)
                page_w, page_h = letter
                wm_size = 4.5 * inch
                canvas.drawImage(
                    ImageReader(_watermark_buf),
                    (page_w - wm_size) / 2,
                    (page_h - wm_size) / 2,
                    width=wm_size,
                    height=wm_size,
                    preserveAspectRatio=True,
                    mask="auto",
                )
            except Exception:
                logger.warning("Could not draw watermark", exc_info=True)

        # Footer
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(TEXT_MUTED)
        footer_text = (
            f"Generated on {now_str} by the School Registration System"
            f"  ·  Page {doc.page}"
        )
        canvas.drawCentredString(letter[0] / 2, 0.45 * inch, footer_text)
        canvas.restoreState()

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
        fontSize=16, leading=20, textColor=HEADER_BG,
        alignment=TA_CENTER, spaceAfter=2,
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"],
        fontSize=11, textColor=HEADER_BG,
        spaceBefore=8, spaceAfter=4,
    )
    body_style = ParagraphStyle(
        "Body2", parent=styles["Normal"],
        fontSize=10, textColor=TEXT_DARK, leading=14,
    )

    story  = []
    PAGE_W = 7.0 * inch
    GAP      = 12       # gap between chart cards (points)
    CARD_W   = (PAGE_W - GAP) / 2 - 4
    CARD_H   = 140      # compact but readable

    filter_sy  = school_year or "All School Years"
    filter_sem = semester    or "All Semesters"

    # ── Reusable blocks ───────────────────────────────────────────────

    # Load the bundled school logo (logo.png next to this file's static folder)
    _logo_path = Path(__file__).parent.parent / "static" / "logo.png"
    _logo_img_data: BytesIO | None = None
    if _logo_path.exists():
        _logo_img_data = BytesIO(_logo_path.read_bytes())
    else:
        logger.warning("School logo not found at %s", _logo_path)

    # ── Watermark image (pre-processed once, reused every page) ──────
    _watermark_buf: BytesIO | None = None
    if _PIL_AVAILABLE and _logo_path.exists():
        try:
            wm = PILImage.open(_logo_path).convert("RGBA")
            r, g, b, a = wm.split()
            a = a.point(lambda x: int(x * 0.07))   # 7 % opacity
            wm = PILImage.merge("RGBA", (r, g, b, a))
            _watermark_buf = BytesIO()
            wm.save(_watermark_buf, format="PNG")
        except Exception:
            logger.warning("Could not build watermark image", exc_info=True)

    LOGO_SIZE = 0.55 * inch   # square logo

    def _letterhead():
        story.append(Spacer(1, 2))
        story.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=5))

        # School identity row: logo (optional) + school name + report title
        if _logo_img_data or school_name:
            _logo_img_data and _logo_img_data.seek(0)
            logo_cell = Image(_logo_img_data, width=LOGO_SIZE, height=LOGO_SIZE) \
                if _logo_img_data else Spacer(LOGO_SIZE, LOGO_SIZE)

            school_name_style = ParagraphStyle(
                "SchoolName", parent=styles["Normal"],
                fontSize=11, fontName="Helvetica-Bold",
                textColor=HEADER_BG, alignment=TA_CENTER, leading=14,
            )
            report_title_style = ParagraphStyle(
                "ReportTitle2", parent=styles["Normal"],
                fontSize=8, fontName="Helvetica",
                textColor=TEXT_MUTED, alignment=TA_CENTER,
            )
            name_block = [
                Paragraph(school_name, school_name_style) if school_name else Spacer(1, 14),
                Paragraph("STUDENT ENROLLMENT REPORT", report_title_style),
            ]
            identity_table = Table(
                [[logo_cell, name_block]],
                colWidths=[LOGO_SIZE + 6, PAGE_W - LOGO_SIZE - 6],
            )
            identity_table.setStyle(TableStyle([
                ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING",   (0, 0), (-1, -1), 0),
                ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
                ("TOPPADDING",    (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING",  (0, 0), (0, -1),  8),
            ]))
            story.append(identity_table)
        else:
            story.append(Paragraph("STUDENT ENROLLMENT REPORT", title_style))

        story.append(HRFlowable(width="100%", thickness=2, color=ACCENT,
                                spaceBefore=5, spaceAfter=8))

    def _meta():
        t = Table(
            [
                ["Date Generated:", now_str,  "School Year:", filter_sy],
                ["",                "",        "Semester:",    filter_sem],
            ],
            colWidths=[1.3*inch, 2.5*inch, 1.1*inch, 2.1*inch],
        )
        t.setStyle(TableStyle([
            ("FONTNAME",  (0, 0), (-1, -1), "Helvetica"),
            ("FONTNAME",  (0, 0), (0, -1),  "Helvetica-Bold"),
            ("FONTNAME",  (2, 0), (2, -1),  "Helvetica-Bold"),
            ("FONTSIZE",  (0, 0), (-1, -1), 8.5),
            ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_DARK),
            ("TEXTCOLOR", (1, 0), (1, -1),  TEXT_MUTED),
            ("TEXTCOLOR", (3, 0), (3, -1),  TEXT_MUTED),
            ("ALIGN",     (0, 0), (-1, -1), "LEFT"),
            ("VALIGN",    (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(t)


    # ══════════════════════════════════════════════════════════════════
    # PAGE 1 — Section I: Charts (2×2) + Enrollment Summary table
    # ══════════════════════════════════════════════════════════════════
    _letterhead()
    _meta()
    story.append(Spacer(1, 10))

    story.append(Paragraph("I. ENROLLMENT SUMMARY", section_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceAfter=8))

    # ── 2×2 chart grid ────────────────────────────────────────────────
    status_dict = {}
    if pending_count:   status_dict["Pending"]  = pending_count
    if approved_count:  status_dict["Approved"] = approved_count
    if denied_count:    status_dict["Denied"]   = denied_count

    c_tl = _make_pie(status_dict,              CARD_W, CARD_H,
                     "Application Status",    STATUS_COLORS,
                     description="Shows how many applicants are Pending review, Approved, or Denied.")
    c_tr = _make_pie(by_enrollment_type or {}, CARD_W, CARD_H,
                     "Enrollment Type",
                     description="Classifies students as New, Returning (Old), or Transferee enrollees.")
    c_bl = _make_vbar(by_strand or {},         CARD_W, CARD_H,
                      "Students by Strand",
                      x_label="Strand", y_label="No. of Students",
                      description="Total number of applicants grouped by their chosen academic strand.")
    c_br = _make_hbar(by_grade_level or {},    CARD_W, CARD_H,
                      "Students by Grade Level",
                      x_label="No. of Students", y_label="Grade Level",
                      description="Total number of applicants per grade level across all strands.")

    ROW_GAP = 10   # vertical space between chart rows

    grid = Table(
        [[c_tl, c_tr],
         [Spacer(1, ROW_GAP), Spacer(1, ROW_GAP)],
         [c_bl, c_br]],
        colWidths=[CARD_W, CARD_W],
        rowHeights=[CARD_H + CAPTION_H, ROW_GAP, CARD_H + CAPTION_H],
    )
    grid.setStyle(TableStyle([
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (0, -1),  GAP),
    ]))
    story.append(grid)
    story.append(Spacer(1, 12))

    # ── Summary table (left) + Side panel (right) ─────────────────────
    TABLE_GAP = 0.3 * inch          # visual gap between the two tables
    LEFT_W    = (PAGE_W - TABLE_GAP) / 2   # equal width for both tables
    RIGHT_W   = LEFT_W

    # Shared row-height spec so both tables are always the same height
    HEADER_H = 22   # pts — header row
    ROW_H    = 20   # pts — data rows
    TABLE_ROW_HEIGHTS = [HEADER_H] + [ROW_H] * 6   # 1 header + 6 data = 7 rows

    def pct(n, d):
        """Return n/d as a rounded percentage string, or '—' when d=0."""
        return f"{round(n / d * 100)}%" if d else "—"

    not_yet_enrolled = max(0, approved_count - enrolled_count)
    male_count   = (by_sex or {}).get("Male", 0)
    female_count = (by_sex or {}).get("Female", 0)
    pay_verified = (by_payment or {}).get("Verified", 0)
    pay_pending  = (by_payment or {}).get("Pending", 0)

    # ── Left: Enrollment Status ────────────────────────────────────────
    # Rows 1–4: % of Total applicants; rows 5–6: % of Approved
    summary_data = [
        ["Enrollment Status",  "Count",               "% of Total"],
        ["Total Registrants",  str(total_count),      "100%"],
        ["Approved",           str(approved_count),   pct(approved_count, total_count)],
        ["Pending Review",     str(pending_count),    pct(pending_count,  total_count)],
        ["Denied",             str(denied_count),     pct(denied_count,   total_count)],
        ["Fully Enrolled",     str(enrolled_count),   pct(enrolled_count,     approved_count)],
        ["Not Yet Enrolled",   str(not_yet_enrolled), pct(not_yet_enrolled,   approved_count)],
    ]
    # col widths must sum to LEFT_W
    left_table = Table(
        summary_data,
        colWidths=[1.8*inch, 0.7*inch, 0.85*inch],
        rowHeights=TABLE_ROW_HEIGHTS,
    )
    left_table.setStyle(TableStyle([
        # Header
        ("SPAN",          (0, 0), (-1, 0)),
        ("BACKGROUND",    (0, 0), (-1, 0),  HEADER_BG),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  HEADER_FG),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  9),
        ("ALIGN",         (0, 0), (-1, 0),  "CENTER"),
        # Alternating row colours
        ("BACKGROUND",    (0, 1), (-1, 1),  colors.white),
        ("BACKGROUND",    (0, 2), (-1, 2),  ROW_ALT),
        ("BACKGROUND",    (0, 3), (-1, 3),  colors.white),
        ("BACKGROUND",    (0, 4), (-1, 4),  ROW_ALT),
        # Fully Enrolled — green highlight
        ("BACKGROUND",    (0, 5), (-1, 5),  colors.HexColor("#d1fae5")),
        ("FONTNAME",      (0, 5), (-1, 5),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, 5), (-1, 5),  HEADER_BG),
        # Not Yet Enrolled — soft amber
        ("BACKGROUND",    (0, 6), (-1, 6),  colors.HexColor("#fffbeb")),
        # Note: rows 5-6 % column reflects % of Approved, not Total
        ("GRID",          (0, 0), (-1, -1), 0.5, BORDER),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 8.5),
        ("ALIGN",         (1, 0), (-1, -1), "CENTER"),
        ("ALIGN",         (0, 1), (0, -1),  "LEFT"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    # ── Right: Student Demographics ────────────────────────────────────
    enroll_rate  = pct(enrolled_count, approved_count)
    approval_rate = pct(approved_count, total_count)

    side_data = [
        ["Student Demographics",  "Count",             "%"],
        ["Male Students",          str(male_count),    pct(male_count,   total_count)],
        ["Female Students",        str(female_count),  pct(female_count, total_count)],
        ["Payment Verified",       str(pay_verified),  pct(pay_verified, approved_count)],
        ["Payment Pending",        str(pay_pending),   pct(pay_pending,  approved_count)],
        ["Enrollment Rate",        enroll_rate,        "of Approved"],
        ["Approval Rate",          approval_rate,      "of Total"],
    ]
    # col widths must sum to RIGHT_W
    right_table = Table(
        side_data,
        colWidths=[1.75*inch, 0.85*inch, 0.75*inch],
        rowHeights=TABLE_ROW_HEIGHTS,
    )
    right_table.setStyle(TableStyle([
        # Header spans all cols
        ("SPAN",          (0, 0), (-1, 0)),
        ("BACKGROUND",    (0, 0), (-1, 0),  HEADER_BG),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  HEADER_FG),
        ("FONTNAME",      (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, 0),  9),
        ("ALIGN",         (0, 0), (-1, 0),  "CENTER"),
        # Sex rows — blue tint
        ("BACKGROUND",    (0, 1), (-1, 2),  colors.HexColor("#eff6ff")),
        # Payment rows — amber tint
        ("BACKGROUND",    (0, 3), (-1, 4),  colors.HexColor("#fffbeb")),
        # Rate rows — green highlight
        ("BACKGROUND",    (0, 5), (-1, 6),  colors.HexColor("#d1fae5")),
        ("FONTNAME",      (0, 5), (-1, 6),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0, 5), (-1, 6),  HEADER_BG),
        ("GRID",          (0, 0), (-1, -1), 0.5, BORDER),
        ("FONTNAME",      (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 1), (-1, -1), 8),
        ("ALIGN",         (1, 0), (-1, -1), "CENTER"),
        ("ALIGN",         (0, 1), (0, -1),  "LEFT"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    side_by_side = Table(
        [[left_table, right_table]],
        colWidths=[LEFT_W, RIGHT_W],
    )
    side_by_side.setStyle(TableStyle([
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (0, -1),  TABLE_GAP),
    ]))
    story.append(side_by_side)


    # ══════════════════════════════════════════════════════════════════
    # PAGE 2 — Section II: Fully Enrolled Students List
    # ══════════════════════════════════════════════════════════════════
    story.append(PageBreak())
    _letterhead()
    _meta()
    story.append(Spacer(1, 10))

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


    doc.build(story, onFirstPage=_on_page, onLaterPages=_on_page)
    buffer.seek(0)
    return buffer.read()
