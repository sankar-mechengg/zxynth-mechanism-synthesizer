"""
SVG Path Parser (Server-side)
Extracts <path> data from SVG content and samples into discrete (x,y) points.
Handles M, L, H, V, C, Q, A, Z commands (absolute and relative).
"""

import re
import math
from typing import List, Dict, Tuple, Optional
from lxml import etree


def parse_svg(content: str, num_samples: int = 101) -> Dict:
    """
    Parse SVG content and return sampled path points.

    Returns:
        dict with 'points' (list of [x,y]), 'bounds', 'path_d'
    """
    # Parse XML
    try:
        root = etree.fromstring(content.encode("utf-8"))
    except etree.XMLSyntaxError as e:
        raise ValueError(f"Invalid SVG XML: {e}")

    # Handle namespaces
    ns = {"svg": "http://www.w3.org/2000/svg"}
    path_el = root.find(".//svg:path", ns) or root.find(".//path")

    if path_el is None:
        # Try without namespace
        for el in root.iter():
            if el.tag.endswith("path") or el.tag == "path":
                path_el = el
                break

    if path_el is None:
        raise ValueError("No <path> element found in SVG")

    d = path_el.get("d", "")
    if not d.strip():
        raise ValueError("Path d attribute is empty")

    # Parse path commands into segments
    segments = _parse_path_commands(d)

    # Sample into dense points
    dense = _densely_sample(segments)
    if len(dense) < 2:
        raise ValueError(f"Path produced only {len(dense)} points — too few to trace")

    # Resample at uniform arc length
    points = _resample_arc_length(dense, num_samples)

    # Compute bounds
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    bounds = {
        "minX": min(xs), "minY": min(ys),
        "maxX": max(xs), "maxY": max(ys),
    }

    return {
        "points": points,
        "bounds": bounds,
        "path_d": d,
    }


def _parse_path_commands(d: str) -> list:
    """Tokenize SVG path d-attribute into command segments."""
    segments = []
    tokens = re.findall(r'[a-zA-Z][^a-zA-Z]*', d)
    cx, cy = 0.0, 0.0
    sx, sy = 0.0, 0.0  # subpath start

    for token in tokens:
        cmd = token[0]
        nums = [float(x) for x in re.findall(r'-?[\d.]+(?:e[+-]?\d+)?', token[1:], re.IGNORECASE)]
        is_rel = cmd.islower()
        CMD = cmd.upper()

        if CMD == 'M':
            x = (cx + nums[0]) if is_rel else nums[0]
            y = (cy + nums[1]) if is_rel else nums[1]
            cx, cy = x, y
            sx, sy = x, y
            segments.append(('M', x, y))
            # Implicit lineto for remaining pairs
            for i in range(2, len(nums), 2):
                lx = (cx + nums[i]) if is_rel else nums[i]
                ly = (cy + nums[i+1]) if is_rel else nums[i+1]
                segments.append(('L', cx, cy, lx, ly))
                cx, cy = lx, ly

        elif CMD == 'L':
            for i in range(0, len(nums), 2):
                x = (cx + nums[i]) if is_rel else nums[i]
                y = (cy + nums[i+1]) if is_rel else nums[i+1]
                segments.append(('L', cx, cy, x, y))
                cx, cy = x, y

        elif CMD == 'H':
            for n in nums:
                x = (cx + n) if is_rel else n
                segments.append(('L', cx, cy, x, cy))
                cx = x

        elif CMD == 'V':
            for n in nums:
                y = (cy + n) if is_rel else n
                segments.append(('L', cx, cy, cx, y))
                cy = y

        elif CMD == 'C':
            for i in range(0, len(nums), 6):
                cp1x = (cx + nums[i]) if is_rel else nums[i]
                cp1y = (cy + nums[i+1]) if is_rel else nums[i+1]
                cp2x = (cx + nums[i+2]) if is_rel else nums[i+2]
                cp2y = (cy + nums[i+3]) if is_rel else nums[i+3]
                ex = (cx + nums[i+4]) if is_rel else nums[i+4]
                ey = (cy + nums[i+5]) if is_rel else nums[i+5]
                segments.append(('C', cx, cy, cp1x, cp1y, cp2x, cp2y, ex, ey))
                cx, cy = ex, ey

        elif CMD == 'Q':
            for i in range(0, len(nums), 4):
                cpx = (cx + nums[i]) if is_rel else nums[i]
                cpy = (cy + nums[i+1]) if is_rel else nums[i+1]
                ex = (cx + nums[i+2]) if is_rel else nums[i+2]
                ey = (cy + nums[i+3]) if is_rel else nums[i+3]
                segments.append(('Q', cx, cy, cpx, cpy, ex, ey))
                cx, cy = ex, ey

        elif CMD == 'A':
            for i in range(0, len(nums), 7):
                rx, ry = abs(nums[i]), abs(nums[i+1])
                rot = nums[i+2]
                large = int(nums[i+3])
                sweep = int(nums[i+4])
                ex = (cx + nums[i+5]) if is_rel else nums[i+5]
                ey = (cy + nums[i+6]) if is_rel else nums[i+6]
                segments.append(('A', cx, cy, rx, ry, rot, large, sweep, ex, ey))
                cx, cy = ex, ey

        elif CMD == 'Z':
            if abs(cx - sx) > 1e-6 or abs(cy - sy) > 1e-6:
                segments.append(('L', cx, cy, sx, sy))
            cx, cy = sx, sy

    return segments


def _densely_sample(segments: list, pts_per_curve: int = 50) -> List[List[float]]:
    """Sample each segment densely."""
    points = []

    for seg in segments:
        cmd = seg[0]
        if cmd == 'M':
            points.append([seg[1], seg[2]])

        elif cmd == 'L':
            points.append([seg[3], seg[4]])

        elif cmd == 'C':
            _, x0, y0, cp1x, cp1y, cp2x, cp2y, x1, y1 = seg
            for i in range(1, pts_per_curve + 1):
                t = i / pts_per_curve
                mt = 1 - t
                x = mt**3*x0 + 3*mt**2*t*cp1x + 3*mt*t**2*cp2x + t**3*x1
                y = mt**3*y0 + 3*mt**2*t*cp1y + 3*mt*t**2*cp2y + t**3*y1
                points.append([x, y])

        elif cmd == 'Q':
            _, x0, y0, cpx, cpy, x1, y1 = seg
            for i in range(1, pts_per_curve + 1):
                t = i / pts_per_curve
                mt = 1 - t
                x = mt**2*x0 + 2*mt*t*cpx + t**2*x1
                y = mt**2*y0 + 2*mt*t*cpy + t**2*y1
                points.append([x, y])

        elif cmd == 'A':
            _, x0, y0, rx, ry, rot, large, sweep, x1, y1 = seg
            arc_pts = _approximate_arc(x0, y0, rx, ry, rot, large, sweep, x1, y1, pts_per_curve)
            points.extend(arc_pts[1:])  # Skip first (already in list)

    return points


def _approximate_arc(x1, y1, rx, ry, rotation, large_arc, sweep, x2, y2, n):
    """Approximate SVG arc as polyline using endpoint-to-center conversion."""
    if rx == 0 or ry == 0:
        return [[x1, y1], [x2, y2]]

    phi = math.radians(rotation)
    cos_phi, sin_phi = math.cos(phi), math.sin(phi)

    dx2, dy2 = (x1 - x2) / 2, (y1 - y2) / 2
    x1p = cos_phi * dx2 + sin_phi * dy2
    y1p = -sin_phi * dx2 + cos_phi * dy2

    lam = (x1p**2) / (rx**2) + (y1p**2) / (ry**2)
    if lam > 1:
        s = math.sqrt(lam)
        rx *= s
        ry *= s

    num = max(0, rx**2 * ry**2 - rx**2 * y1p**2 - ry**2 * x1p**2)
    den = rx**2 * y1p**2 + ry**2 * x1p**2
    sq = math.sqrt(num / den) if den > 0 else 0
    if large_arc == sweep:
        sq = -sq

    cxp = sq * (rx * y1p) / ry
    cyp = sq * -(ry * x1p) / rx

    cx = cos_phi * cxp - sin_phi * cyp + (x1 + x2) / 2
    cy = sin_phi * cxp + cos_phi * cyp + (y1 + y2) / 2

    theta1 = math.atan2((y1p - cyp) / ry, (x1p - cxp) / rx)
    dtheta = math.atan2((-y1p - cyp) / ry, (-x1p - cxp) / rx) - theta1

    if sweep and dtheta < 0:
        dtheta += 2 * math.pi
    if not sweep and dtheta > 0:
        dtheta -= 2 * math.pi

    pts = []
    for i in range(n + 1):
        t = theta1 + (i / n) * dtheta
        xr, yr = rx * math.cos(t), ry * math.sin(t)
        pts.append([
            cos_phi * xr - sin_phi * yr + cx,
            sin_phi * xr + cos_phi * yr + cy,
        ])
    return pts


def _resample_arc_length(points: List[List[float]], n: int) -> List[List[float]]:
    """Resample polyline to n uniformly spaced points by arc length."""
    if len(points) < 2:
        return points

    # Cumulative arc lengths
    arc = [0.0]
    for i in range(1, len(points)):
        dx = points[i][0] - points[i-1][0]
        dy = points[i][1] - points[i-1][1]
        arc.append(arc[-1] + math.sqrt(dx*dx + dy*dy))

    total = arc[-1]
    if total == 0:
        return [points[0]]

    result = []
    j = 0
    for i in range(n):
        target = (i / (n - 1)) * total
        while j < len(arc) - 2 and arc[j+1] < target:
            j += 1
        seg_len = arc[j+1] - arc[j]
        frac = (target - arc[j]) / seg_len if seg_len > 0 else 0
        result.append([
            points[j][0] + (points[j+1][0] - points[j][0]) * frac,
            points[j][1] + (points[j+1][1] - points[j][1]) * frac,
        ])

    return result
