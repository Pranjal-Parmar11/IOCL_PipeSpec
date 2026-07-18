import csv
from pathlib import Path
from typing import List, Dict, Optional, Set
from pyd_ import MaterialRow

# Directory where CSVs are stored
DATA_DIR = Path("data")

_all_rows: List[MaterialRow] = []


def safe_float(val: Optional[str], default: float = 0.0) -> float:
    if not val:
        return default
    try:
        return float(val.strip())
    except (ValueError, TypeError):
        return default


def load_data() -> None:
    """
    Loads every CSV row starting with 'PMS_' in the data directory into a MaterialRow model.
    Handles column differences such as 'RATING' vs 'THK'.
    """
    global _all_rows
    _all_rows.clear()

    if not DATA_DIR.exists():
        raise FileNotFoundError(f"Data directory not found at {DATA_DIR}")

    csv_files = list(DATA_DIR.glob("PMS_*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No PMS CSV files found in {DATA_DIR}")

    for file_path in csv_files:
        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for raw in reader:
                pms = (raw.get("PMS") or "").strip()
                pipe_class = (raw.get("CLASS") or "").strip()
                _type = (raw.get("TYPE") or "").strip()
                facing = (raw.get("FACING") or "").strip()
                dia_low = safe_float(raw.get("DIA(LOW)"))
                dia_high = safe_float(raw.get("DIA(HIGH)"))
                rating = (raw.get("RATING") or "").strip()
                design_standard = (raw.get("DESIGN_STANDARD") or "").strip()
                material_description = (raw.get("MATERIAL_DESCRIPTION") or "").strip()

                # Avoid loading completely empty rows
                if not pms and not pipe_class and not material_description:
                    continue

                row = MaterialRow(
                    pms=pms,
                    pipe_class=pipe_class,
                    type=_type,
                    facing=facing,
                    dia_low=dia_low,
                    dia_high=dia_high,
                    rating=rating,
                    design_standard=design_standard,
                    material_description=material_description,
                )
                _all_rows.append(row)


# Dropdown Helper Functions

def get_unique_pms() -> List[str]:
    """Returns sorted unique PMS values, excluding empty values."""
    pms_vals = {row.pms for row in _all_rows if row.pms}
    return sorted(list(pms_vals))


def get_unique_classes(pms: Optional[str] = None) -> List[str]:
    """Returns sorted unique Class values, optionally filtered by PMS."""
    classes = set()
    pms_normalized = pms.strip().upper() if pms else None
    for row in _all_rows:
        if not row.pipe_class:
            continue
        if pms_normalized and row.pms.strip().upper() != pms_normalized:
            continue
        classes.add(row.pipe_class)
    return sorted(list(classes))


def get_unique_types(classes: Optional[List[str]] = None) -> List[str]:
    """Returns sorted unique Type values, optionally filtered by a list of Classes."""
    types = set()
    filter_classes = {c.strip().upper() for c in classes if c} if classes else set()
    for row in _all_rows:
        if not row.type:
            continue
        if filter_classes and row.pipe_class.strip().upper() not in filter_classes:
            continue
        types.add(row.type)
    return sorted(list(types))


def get_unique_schedules(types: Optional[List[str]] = None) -> List[str]:
    """Returns sorted unique Schedule/Rating values, optionally filtered by a list of Types."""
    schedules = set()
    filter_types = {t.strip().upper() for t in types if t} if types else set()
    for row in _all_rows:
        if not row.rating:
            continue
        if filter_types and row.type.strip().upper() not in filter_types:
            continue
        schedules.add(row.rating)
    return sorted(list(schedules))


def get_unique_facings(types: Optional[List[str]] = None) -> List[str]:
    """Returns sorted unique Facing values, optionally filtered by a list of Types."""
    facings = set()
    filter_types = {t.strip().upper() for t in types if t} if types else set()
    for row in _all_rows:
        if not row.facing:
            continue
        if filter_types and row.type.strip().upper() not in filter_types:
            continue
        facings.add(row.facing)
    return sorted(list(facings))


load_data()