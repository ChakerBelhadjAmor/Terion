"""
Generates PDP_Test_Teriak.xlsx — a realistic test PDP for the Teriak Plan de Charge app.
Two sheets:
  - Sheet 1 "PDP_Normal"  : balanced load, all ateliers under capacity → green dashboard
  - Sheet 2 "PDP_Stress"  : overloaded ateliers I, G, H → red/amber dashboard
"""
from openpyxl import Workbook
from openpyxl.styles import (
    PatternFill, Font, Alignment, Border, Side, GradientFill
)
from openpyxl.utils import get_column_letter

# ── Teriak brand colors ──────────────────────────────────────────────────────
COLOR_PRIMARY    = "3CC2B1"   # Puerto Rico teal
COLOR_ACCENT     = "FBB829"   # Lightning Yellow
COLOR_ELM        = "1B6862"   # Elm dark
COLOR_ELM_LIGHT  = "237870"
COLOR_WHITE      = "FFFFFF"
COLOR_GRAY_LIGHT = "F0F4F4"
COLOR_GRAY_MID   = "D1E8E5"
COLOR_RED        = "E53E3E"
COLOR_GREEN      = "38A169"

ATELIERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
ATELIER_NAMES = {
    "A": "Pesée & Granulation",
    "B": "Compression",
    "C": "Enrobage",
    "D": "Remplissage Aseptique",
    "E": "Stérilisation",
    "F": "Lyophilisation",
    "G": "Conditionnement Primaire",
    "H": "Conditionnement Secondaire",
    "I": "Contrôle Qualité",
    "J": "Libération & Stockage",
}

# ── Products ─────────────────────────────────────────────────────────────────
# Each dict: name, dci, form, lots, and a dict of atelier → hours/lot
NORMAL_PRODUCTS = [
    {
        "name": "Lotentin 100mg", "dci": "Amlodipine",
        "form": "Comprimé pelliculé", "lots": 8,
        "times": {"A": 6, "B": 4, "C": 8, "G": 3, "H": 3, "I": 10, "J": 2},
    },
    {
        "name": "Cardiofix 50mg", "dci": "Metoprolol",
        "form": "Comprimé", "lots": 6,
        "times": {"A": 5, "B": 3, "G": 2, "H": 2, "I": 8, "J": 2},
    },
    {
        "name": "Nervolan XR 75mg", "dci": "Venlafaxine",
        "form": "Gélule LP", "lots": 5,
        "times": {"A": 7, "B": 5, "C": 10, "G": 3, "H": 3, "I": 12, "J": 2},
    },
    {
        "name": "Hepatol Plus 200mg", "dci": "Silymarine",
        "form": "Comprimé enrobé", "lots": 4,
        "times": {"A": 4, "B": 3, "C": 6, "G": 2, "H": 2, "I": 8, "J": 2},
    },
    {
        "name": "Respirex Injectable 5mg", "dci": "Salbutamol",
        "form": "Solution injectable", "lots": 4,
        "times": {"D": 8, "E": 12, "G": 4, "H": 4, "I": 14, "J": 2},
    },
    {
        "name": "Ostéomax 1000mg", "dci": "Calcium + Vit D3",
        "form": "Comprimé effervescent", "lots": 3,
        "times": {"A": 5, "B": 4, "G": 3, "H": 3, "I": 10, "J": 2},
    },
    {
        "name": "Lyocef 1g", "dci": "Céfazoline",
        "form": "Poudre lyophilisée", "lots": 3,
        "times": {"D": 6, "F": 24, "G": 4, "H": 4, "I": 16, "J": 2},
    },
    {
        "name": "Glucoter 500mg", "dci": "Metformine",
        "form": "Comprimé pelliculé", "lots": 4,
        "times": {"A": 6, "B": 4, "C": 7, "G": 3, "H": 3, "I": 10, "J": 2},
    },
]

STRESS_PRODUCTS = [
    {
        "name": "Lotentin 100mg", "dci": "Amlodipine",
        "form": "Comprimé pelliculé", "lots": 15,
        "times": {"A": 6, "B": 4, "C": 8, "G": 3, "H": 3, "I": 14, "J": 2},
    },
    {
        "name": "Cardiofix 50mg", "dci": "Metoprolol",
        "form": "Comprimé", "lots": 12,
        "times": {"A": 5, "B": 3, "G": 2, "H": 2, "I": 12, "J": 2},
    },
    {
        "name": "Nervolan XR 75mg", "dci": "Venlafaxine",
        "form": "Gélule LP", "lots": 10,
        "times": {"A": 7, "B": 5, "C": 10, "G": 3, "H": 3, "I": 12, "J": 2},
    },
    {
        "name": "Respirex Injectable 5mg", "dci": "Salbutamol",
        "form": "Solution injectable", "lots": 10,
        "times": {"D": 8, "E": 12, "G": 4, "H": 4, "I": 14, "J": 2},
    },
    {
        "name": "Lyocef 1g", "dci": "Céfazoline",
        "form": "Poudre lyophilisée", "lots": 12,
        "times": {"D": 6, "F": 24, "G": 4, "H": 4, "I": 16, "J": 2},
    },
    {
        "name": "Glucoter 500mg", "dci": "Metformine",
        "form": "Comprimé pelliculé", "lots": 9,
        "times": {"A": 6, "B": 4, "C": 7, "G": 3, "H": 3, "I": 10, "J": 2},
    },
    {
        "name": "Ostéomax 1000mg", "dci": "Calcium + Vit D3",
        "form": "Comprimé effervescent", "lots": 8,
        "times": {"A": 5, "B": 4, "G": 3, "H": 3, "I": 10, "J": 2},
    },
    {
        "name": "Hepatol Plus 200mg", "dci": "Silymarine",
        "form": "Comprimé enrobé", "lots": 7,
        "times": {"A": 4, "B": 3, "C": 6, "G": 2, "H": 2, "I": 8, "J": 2},
    },
]


# ── Style helpers ─────────────────────────────────────────────────────────────
def fill(hex_color):
    return PatternFill("solid", fgColor=hex_color)

def font(bold=False, color=COLOR_ELM, size=11, italic=False):
    return Font(bold=bold, color=color, size=size, italic=italic,
                name="Calibri")

def center():
    return Alignment(horizontal="center", vertical="center", wrap_text=True)

def left():
    return Alignment(horizontal="left", vertical="center", wrap_text=True)

def thin_border():
    s = Side(style="thin", color="D1E8E5")
    return Border(left=s, right=s, top=s, bottom=s)

def thick_bottom():
    s = Side(style="medium", color=COLOR_ELM)
    t = Side(style="thin", color="D1E8E5")
    return Border(left=t, right=t, top=t, bottom=s)


# ── Sheet builder ─────────────────────────────────────────────────────────────
def build_sheet(ws, products, title, scenario_note, capacity_hours):
    ws.sheet_view.showGridLines = False

    # ── Column widths ────────────────────────────────────────────────────────
    ws.column_dimensions["A"].width = 26   # PRODUIT
    ws.column_dimensions["B"].width = 18   # DCI
    ws.column_dimensions["C"].width = 22   # FORME
    ws.column_dimensions["D"].width = 7    # LOTS
    for i, _ in enumerate(ATELIERS):
        ws.column_dimensions[get_column_letter(5 + i)].width = 6

    # ── Row heights ──────────────────────────────────────────────────────────
    ws.row_dimensions[1].height = 14
    ws.row_dimensions[2].height = 36
    ws.row_dimensions[3].height = 20
    ws.row_dimensions[4].height = 32
    ws.row_dimensions[5].height = 22
    for r in range(6, 6 + len(products) + 4):
        ws.row_dimensions[r].height = 22

    # ── Banner row 1: spacer ─────────────────────────────────────────────────
    for col in range(1, 15):
        ws.cell(1, col).fill = fill(COLOR_ELM)

    # ── Banner row 2: title ──────────────────────────────────────────────────
    ws.merge_cells("A2:N2")
    c = ws["A2"]
    c.value = f"  LABORATOIRES TERIAK — {title}"
    c.fill = fill(COLOR_ELM)
    c.font = Font(bold=True, color=COLOR_WHITE, size=16, name="Calibri")
    c.alignment = left()

    # ── Row 3: scenario note ─────────────────────────────────────────────────
    ws.merge_cells("A3:N3")
    c = ws["A3"]
    c.value = f"  {scenario_note}"
    c.fill = fill(COLOR_ELM_LIGHT)
    c.font = Font(color="D1E8E5", size=10, italic=True, name="Calibri")
    c.alignment = left()

    # ── Row 4: capacity info bar ─────────────────────────────────────────────
    ws.merge_cells("A4:D4")
    c = ws["A4"]
    c.value = "Paramètres de capacité →"
    c.fill = fill(COLOR_GRAY_LIGHT)
    c.font = font(bold=True, color=COLOR_ELM, size=10)
    c.alignment = left()

    params_text = (
        f"4 sem × 5 j × 2 postes × 8h × 85% = {capacity_hours}h / atelier"
    )
    ws.merge_cells("E4:N4")
    c = ws["E4"]
    c.value = params_text
    c.fill = fill(COLOR_PRIMARY)
    c.font = Font(bold=True, color=COLOR_WHITE, size=10, name="Calibri")
    c.alignment = center()

    # ── Row 5: spacer ────────────────────────────────────────────────────────
    for col in range(1, 15):
        ws.cell(5, col).fill = fill(COLOR_GRAY_LIGHT)

    # ── Row 6: column headers ────────────────────────────────────────────────
    headers = ["PRODUIT", "DCI", "FORME", "LOTS"] + ATELIERS
    for col, h in enumerate(headers, start=1):
        c = ws.cell(6, col, h)
        c.fill = fill(COLOR_ELM)
        c.font = Font(bold=True, color=COLOR_WHITE, size=10, name="Calibri")
        c.alignment = center()
        c.border = thick_bottom()

    # ── Row 7: atelier name sub-headers ─────────────────────────────────────
    ws.row_dimensions[7].height = 36
    for i, a in enumerate(ATELIERS):
        c = ws.cell(7, 5 + i, ATELIER_NAMES[a])
        c.fill = fill(COLOR_GRAY_MID)
        c.font = Font(color=COLOR_ELM, size=8, italic=True, name="Calibri")
        c.alignment = Alignment(
            horizontal="center", vertical="center",
            wrap_text=True, text_rotation=90
        )
        c.border = thin_border()
    for col in range(1, 5):
        ws.cell(7, col).fill = fill(COLOR_GRAY_MID)

    # ── Data rows ────────────────────────────────────────────────────────────
    row_colors = [COLOR_WHITE, COLOR_GRAY_LIGHT]
    total_loads = {a: 0 for a in ATELIERS}

    for r_idx, product in enumerate(products):
        row = 8 + r_idx
        bg = row_colors[r_idx % 2]

        # PRODUIT
        c = ws.cell(row, 1, product["name"])
        c.fill = fill(bg)
        c.font = font(bold=True, color=COLOR_ELM, size=10)
        c.alignment = left()
        c.border = thin_border()

        # DCI
        c = ws.cell(row, 2, product["dci"])
        c.fill = fill(bg)
        c.font = font(color="555555", size=10)
        c.alignment = left()
        c.border = thin_border()

        # FORME
        c = ws.cell(row, 3, product["form"])
        c.fill = fill(bg)
        c.font = font(color="555555", size=10, italic=True)
        c.alignment = left()
        c.border = thin_border()

        # LOTS
        c = ws.cell(row, 4, product["lots"])
        c.fill = fill(COLOR_PRIMARY + "30" if r_idx % 2 == 0 else COLOR_GRAY_MID)
        c.font = Font(bold=True, color=COLOR_ELM, size=11, name="Calibri")
        c.alignment = center()
        c.border = thin_border()

        # Atelier processing times
        for a_idx, atelier in enumerate(ATELIERS):
            col = 5 + a_idx
            t = product["times"].get(atelier)
            c = ws.cell(row, col)
            if t:
                c.value = t
                load = t * product["lots"]
                total_loads[atelier] += load
                # Color-code by load contribution
                if t >= 12:
                    c.fill = fill("FFF3CD")   # warm amber for heavy ops
                elif t >= 6:
                    c.fill = fill("D4EDDA")   # light green for medium
                else:
                    c.fill = fill(bg)
                c.font = Font(bold=True, color=COLOR_ELM, size=10, name="Calibri")
            else:
                c.value = ""
                c.fill = fill("F8F8F8" if r_idx % 2 == 0 else "EFEFEF")
                c.font = font(color="CCCCCC", size=10)
            c.alignment = center()
            c.border = thin_border()

    # ── Totals row ───────────────────────────────────────────────────────────
    totals_row = 8 + len(products)
    ws.row_dimensions[totals_row].height = 24

    ws.merge_cells(f"A{totals_row}:C{totals_row}")
    c = ws.cell(totals_row, 1, "CHARGE TOTALE (heures)")
    c.fill = fill(COLOR_ELM)
    c.font = Font(bold=True, color=COLOR_WHITE, size=10, name="Calibri")
    c.alignment = left()

    total_lots = sum(p["lots"] for p in products)
    c = ws.cell(totals_row, 4, total_lots)
    c.fill = fill(COLOR_ELM)
    c.font = Font(bold=True, color=COLOR_ACCENT, size=11, name="Calibri")
    c.alignment = center()

    for a_idx, atelier in enumerate(ATELIERS):
        col = 5 + a_idx
        load = total_loads[atelier]
        c = ws.cell(totals_row, col, load if load > 0 else "—")
        util = (load / capacity_hours * 100) if load > 0 else 0

        if util > 100:
            bg_color = "FED7D7"
            fg_color = COLOR_RED
        elif util >= 80:
            bg_color = "FEFCBF"
            fg_color = "B7791F"
        elif util > 0:
            bg_color = "C6F6D5"
            fg_color = COLOR_GREEN
        else:
            bg_color = "F0F0F0"
            fg_color = "AAAAAA"

        c.fill = fill(bg_color)
        c.font = Font(bold=True, color=fg_color, size=10, name="Calibri")
        c.alignment = center()
        c.border = thin_border()

    # ── Utilisation % row ────────────────────────────────────────────────────
    util_row = totals_row + 1
    ws.row_dimensions[util_row].height = 22

    ws.merge_cells(f"A{util_row}:D{util_row}")
    c = ws.cell(util_row, 1, f"UTILISATION % (capacité = {capacity_hours}h)")
    c.fill = fill(COLOR_GRAY_MID)
    c.font = font(bold=True, color=COLOR_ELM, size=10)
    c.alignment = left()

    for a_idx, atelier in enumerate(ATELIERS):
        col = 5 + a_idx
        load = total_loads[atelier]
        util = round(load / capacity_hours * 100, 1) if load > 0 else 0

        if util > 100:
            bg_color = COLOR_RED
            fg_color = COLOR_WHITE
            label = f"{util}% ⚠"
        elif util >= 80:
            bg_color = COLOR_ACCENT
            fg_color = COLOR_ELM
            label = f"{util}%"
        elif util > 0:
            bg_color = COLOR_PRIMARY
            fg_color = COLOR_WHITE
            label = f"{util}%"
        else:
            bg_color = "EEEEEE"
            fg_color = "AAAAAA"
            label = "—"

        c = ws.cell(util_row, col, label)
        c.fill = fill(bg_color)
        c.font = Font(bold=True, color=fg_color, size=9, name="Calibri")
        c.alignment = center()
        c.border = thin_border()

    # ── Legend ───────────────────────────────────────────────────────────────
    legend_row = util_row + 2
    ws.row_dimensions[legend_row].height = 18

    legend_items = [
        (COLOR_PRIMARY, COLOR_WHITE, "< 80% — Nominal"),
        (COLOR_ACCENT,  COLOR_ELM,   "80–100% — Attention"),
        (COLOR_RED,     COLOR_WHITE,  "> 100% — Surcharge"),
    ]
    ws.merge_cells(f"A{legend_row}:B{legend_row}")
    c = ws.cell(legend_row, 1, "Légende :")
    c.font = font(bold=True, color=COLOR_ELM, size=9)
    c.alignment = left()

    for i, (bg_c, fg_c, label) in enumerate(legend_items):
        col = 3 + i * 2
        ws.merge_cells(
            f"{get_column_letter(col)}{legend_row}:{get_column_letter(col+1)}{legend_row}"
        )
        c = ws.cell(legend_row, col, label)
        c.fill = fill(bg_c)
        c.font = Font(bold=True, color=fg_c, size=9, name="Calibri")
        c.alignment = center()
        c.border = thin_border()


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    wb = Workbook()
    capacity = round(4 * 5 * 2 * 8 * 0.85)   # 272h

    # Sheet 1 — Normal / balanced
    ws1 = wb.active
    ws1.title = "PDP_Normal"
    build_sheet(
        ws1,
        NORMAL_PRODUCTS,
        title="PLAN DIRECTEUR DE PRODUCTION — Scénario Normal",
        scenario_note=(
            "Charge équilibrée · Tous les ateliers devraient rester sous 100% de capacité "
            "avec les paramètres par défaut (4 sem, 2 postes, 85% rendement)"
        ),
        capacity_hours=capacity,
    )

    # Sheet 2 — Stress / overloaded
    ws2 = wb.create_sheet("PDP_Stress")
    build_sheet(
        ws2,
        STRESS_PRODUCTS,
        title="PLAN DIRECTEUR DE PRODUCTION — Scénario Surcharge",
        scenario_note=(
            "Charge élevée · Les ateliers I (CQ), G et H seront en surcharge — "
            "utilisez la Simulation pour tester l'ajout d'un 3ème poste ou l'extension de l'horizon"
        ),
        capacity_hours=capacity,
    )

    # Freeze panes on both sheets
    for ws in [ws1, ws2]:
        ws.freeze_panes = "A8"

    path = "/home/zetsou/Desktop/teriak_hackathon/PDP_Test_Teriak.xlsx"
    wb.save(path)
    print(f"File saved → {path}")

    # Quick summary
    print("\n── Normal scenario loads ──────────────────────")
    cap = capacity
    loads = {a: 0 for a in ATELIERS}
    for p in NORMAL_PRODUCTS:
        for a, t in p["times"].items():
            loads[a] += t * p["lots"]
    for a in ATELIERS:
        util = round(loads[a] / cap * 100, 1)
        status = "⚠ OVER" if util > 100 else ("~ near" if util >= 80 else "✓ ok")
        print(f"  Atelier {a}: {loads[a]:>5}h / {cap}h = {util:>5}%  {status}")

    print("\n── Stress scenario loads ──────────────────────")
    loads2 = {a: 0 for a in ATELIERS}
    for p in STRESS_PRODUCTS:
        for a, t in p["times"].items():
            loads2[a] += t * p["lots"]
    for a in ATELIERS:
        util = round(loads2[a] / cap * 100, 1)
        status = "⚠ OVER" if util > 100 else ("~ near" if util >= 80 else "✓ ok")
        print(f"  Atelier {a}: {loads2[a]:>5}h / {cap}h = {util:>5}%  {status}")


if __name__ == "__main__":
    main()
