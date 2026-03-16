"""
SVG Exporter

Exports the mechanism as a layered SVG file.
Each layer is an SVG <g> group that can be toggled in vector editors:
  - mechanism: links and joints
  - coupler-curve: actual coupler curve
  - desired-path: target path
  - annotations: labels and dimensions
"""

import io
import numpy as np
from typing import Dict

import svgwrite


def generate_svg_bytes(data: Dict, options: Dict) -> bytes:
    """
    Generate layered SVG as bytes.

    Args:
        data: export data dict
        options: {includeMechanism, includeCouplerCurve, includeDesiredPath}

    Returns:
        SVG file content as bytes
    """
    mech = data.get("mechanism", {})
    coupler_curve = data.get("couplerCurve", [])
    desired_path = data.get("desiredPath", [])

    include_mech = options.get("includeMechanism", True)
    include_coupler = options.get("includeCouplerCurve", True)
    include_desired = options.get("includeDesiredPath", True)

    # Compute view bounds
    all_points = []
    if coupler_curve:
        all_points.extend(coupler_curve)
    if desired_path:
        all_points.extend(desired_path)
    if mech.get("pivotA"):
        all_points.append(mech["pivotA"])
    if mech.get("pivotD"):
        all_points.append(mech["pivotD"])

    if not all_points:
        all_points = [[0, 0], [100, 100]]

    pts = np.array(all_points)
    min_x, min_y = np.min(pts, axis=0)
    max_x, max_y = np.max(pts, axis=0)
    pad = max(max_x - min_x, max_y - min_y) * 0.1 + 5

    vb_x = min_x - pad
    vb_y = min_y - pad
    vb_w = (max_x - min_x) + 2 * pad
    vb_h = (max_y - min_y) + 2 * pad

    dwg = svgwrite.Drawing(
        size=(f"{800}px", f"{600}px"),
        viewBox=f"{vb_x} {vb_y} {vb_w} {vb_h}",
    )

    # Background
    dwg.add(dwg.rect(
        insert=(vb_x, vb_y), size=(vb_w, vb_h),
        fill="#0a0e1a",
    ))

    # ── Desired Path Layer ───────────────────────────────────
    if include_desired and desired_path and len(desired_path) > 1:
        g = dwg.g(id="desired-path")
        points = [(p[0], p[1]) for p in desired_path]
        g.add(dwg.polyline(
            points,
            stroke="#f472b6", stroke_width=vb_w * 0.003,
            fill="none", stroke_dasharray="6,4",
            opacity=0.7,
        ))
        # Start/end markers
        g.add(dwg.circle(center=points[0], r=vb_w * 0.005,
                          fill="none", stroke="#f472b6", stroke_width=vb_w * 0.002))
        g.add(dwg.circle(center=points[-1], r=vb_w * 0.005,
                          fill="#f472b6", opacity=0.5))
        dwg.add(g)

    # ── Coupler Curve Layer ──────────────────────────────────
    if include_coupler and coupler_curve and len(coupler_curve) > 1:
        g = dwg.g(id="coupler-curve")
        points = [(p[0], p[1]) for p in coupler_curve]
        g.add(dwg.polyline(
            points,
            stroke="#34d399", stroke_width=vb_w * 0.003,
            fill="none", opacity=0.85,
        ))
        dwg.add(g)

    # ── Mechanism Layer ──────────────────────────────────────
    if include_mech and mech and mech.get("a1"):
        g = dwg.g(id="mechanism")
        _draw_mechanism_svg(dwg, g, mech, vb_w)
        dwg.add(g)

    # ── Annotations Layer ────────────────────────────────────
    g = dwg.g(id="annotations")
    font_size = vb_w * 0.018
    g.add(dwg.text(
        "Zxynth", insert=(vb_x + vb_w * 0.02, vb_y + vb_h - vb_h * 0.03),
        fill="#243050", font_size=font_size, font_family="sans-serif",
    ))
    dwg.add(g)

    # Write to bytes
    buffer = io.BytesIO()
    dwg.write(buffer)
    return buffer.getvalue()


def _draw_mechanism_svg(dwg, g, mech: Dict, vb_w: float):
    """Draw mechanism links and joints into an SVG group."""
    from ..kinematics.loop_closure import solve_four_bar

    a1 = mech.get("a1", 0)
    a2 = mech.get("a2", 0)
    a3 = mech.get("a3", 0)
    a4 = mech.get("a4", 0)
    pivot_a = tuple(mech.get("pivotA", [0, 0]))
    pivot_d = tuple(mech.get("pivotD", [a1, 0]))
    theta2_0 = np.radians(mech.get("theta2_0", 0))

    result = solve_four_bar(a1, a2, a3, a4, theta2_0, pivot_a, pivot_d)
    if not result:
        return

    A = result["A"]
    B = result["B"]
    C = result["C"]
    D = result["D"]

    lw = vb_w * 0.004
    jr = vb_w * 0.008

    # Ground link
    g.add(dwg.line(start=A, end=D, stroke="#94a3b8", stroke_width=lw,
                    stroke_dasharray="8,4", opacity=0.6))

    # Links
    g.add(dwg.line(start=A, end=B, stroke="#60a5fa", stroke_width=lw * 1.2,
                    stroke_linecap="round"))
    g.add(dwg.line(start=B, end=C, stroke="#34d399", stroke_width=lw * 1.2,
                    stroke_linecap="round"))
    g.add(dwg.line(start=D, end=C, stroke="#60a5fa", stroke_width=lw * 1.2,
                    stroke_linecap="round"))

    # Joints
    for pos, fixed in [(A, True), (B, False), (C, False), (D, True)]:
        color = "#f59e0b" if fixed else "#60a5fa"
        g.add(dwg.circle(center=pos, r=jr, fill=color,
                          stroke="#0a0e1a", stroke_width=lw * 0.5))

    # Coupler point
    cp_p = mech.get("p", 0)
    cp_alpha = np.radians(mech.get("alpha", 0))
    theta3 = result["theta3"]
    px = B[0] + cp_p * np.cos(theta3 + cp_alpha)
    py = B[1] + cp_p * np.sin(theta3 + cp_alpha)
    g.add(dwg.circle(center=(px, py), r=jr * 1.3, fill="#34d399",
                      stroke="#0a0e1a", stroke_width=lw * 0.6))
