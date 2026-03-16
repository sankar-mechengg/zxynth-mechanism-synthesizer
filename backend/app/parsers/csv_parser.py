"""
CSV Parser (Server-side)
Handles path data (x,y) and function data (theta_in, theta_out).
Supports BOM, auto-detects delimiter, validates numeric content.
"""

import re
from typing import Dict, List


def parse_csv(content: str) -> Dict:
    """
    Parse CSV with (x, y) path data.

    Returns:
        dict with 'points' ([[x,y],...]), 'has_header', 'warnings'
    """
    cleaned = content.replace("\ufeff", "").strip()
    if not cleaned:
        raise ValueError("CSV file is empty")

    delimiter = _detect_delimiter(cleaned)
    lines = [l.strip() for l in cleaned.split("\n") if l.strip()]

    if len(lines) < 2:
        raise ValueError("CSV must have at least 2 data rows")

    # Detect header
    first_cells = lines[0].split(delimiter)
    has_header = any(not _is_numeric(c.strip()) for c in first_cells)
    data_start = 1 if has_header else 0

    points = []
    warnings = []

    for i in range(data_start, len(lines)):
        cells = [c.strip() for c in lines[i].split(delimiter)]
        if len(cells) < 2:
            warnings.append(f"Row {i+1}: expected 2+ columns, got {len(cells)}")
            continue

        try:
            x = float(cells[0])
            y = float(cells[1])
        except ValueError:
            warnings.append(f"Row {i+1}: non-numeric values")
            continue

        if not (all(map(_is_finite, [x, y]))):
            warnings.append(f"Row {i+1}: infinite/NaN values")
            continue

        points.append([x, y])

    if len(points) < 2:
        raise ValueError(
            f"Only {len(points)} valid rows found (need ≥ 2). "
            + (f"First warning: {warnings[0]}" if warnings else "")
        )

    return {
        "points": points,
        "has_header": has_header,
        "warnings": warnings[:10],
    }


def parse_function_csv(content: str) -> Dict:
    """
    Parse CSV with (theta_in, theta_out) function data.

    Returns:
        dict with 'pairs' ([[theta_in, theta_out],...]), 'has_header',
        'is_monotonic', 'warnings'
    """
    result = parse_csv(content)

    pairs = [[p[0], p[1]] for p in result["points"]]

    # Check monotonicity of theta_in
    is_monotonic = all(
        pairs[i][0] < pairs[i+1][0]
        for i in range(len(pairs) - 1)
    )

    warnings = list(result["warnings"])
    if not is_monotonic:
        warnings.append("θ_input values are not strictly monotonically increasing")

    return {
        "pairs": pairs,
        "has_header": result["has_header"],
        "is_monotonic": is_monotonic,
        "warnings": warnings,
    }


def _detect_delimiter(content: str) -> str:
    """Auto-detect CSV delimiter from first line."""
    first_line = content.split("\n")[0]
    counts = {
        ",": first_line.count(","),
        ";": first_line.count(";"),
        "\t": first_line.count("\t"),
    }
    if counts["\t"] > 0 and counts["\t"] >= counts[","]:
        return "\t"
    if counts[";"] > counts[","]:
        return ";"
    return ","


def _is_numeric(s: str) -> bool:
    """Check if a string is a valid number."""
    try:
        float(s)
        return True
    except (ValueError, TypeError):
        return False


def _is_finite(v: float) -> bool:
    """Check if a float is finite."""
    import math
    return math.isfinite(v)
