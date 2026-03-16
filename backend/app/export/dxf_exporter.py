"""
DXF Exporter

Exports the mechanism as a DXF file compatible with CAD software.
Uses ezdxf to create a proper DXF with layers:
  - MECHANISM: links as lines, joints as circles
  - COUPLER_CURVE: actual coupler curve as polyline
  - DESIRED_PATH: target path as polyline
  - ANNOTATIONS: labels and dimensions
"""

import io
import numpy as np
from typing import Dict, List

import ezdxf
from ezdxf.enums import TextEntityAlignment


def generate_dxf_bytes(data: Dict, options: Dict) -> bytes:
    """
    Generate DXF file as bytes.

    Args:
        data: export data dict
        options: {includeMechanism, includeCouplerCurve, includeDesiredPath}

    Returns:
        DXF file content as bytes
    """
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()

    include_mech = options.get("includeMechanism", True)
    include_coupler = options.get("includeCouplerCurve", True)
    include_desired = options.get("includeDesiredPath", True)

    # Create layers with colors
    doc.layers.add("MECHANISM", color=5)       # Blue
    doc.layers.add("COUPLER_CURVE", color=3)   # Green
    doc.layers.add("DESIRED_PATH", color=1)    # Red
    doc.layers.add("GROUND", color=8)           # Gray
    doc.layers.add("JOINTS", color=2)           # Yellow
    doc.layers.add("ANNOTATIONS", color=7)      # White

    mech = data.get("mechanism", {})

    # ── Mechanism Links ──────────────────────────────────────
    if include_mech and mech:
        _draw_mechanism(msp, mech)

    # ── Coupler Curve ────────────────────────────────────────
    if include_coupler:
        curve = data.get("couplerCurve", [])
        if curve and len(curve) > 1:
            points = [(p[0], p[1]) for p in curve]
            msp.add_lwpolyline(
                points, close=False,
                dxfattribs={"layer": "COUPLER_CURVE"},
            )

    # ── Desired Path ─────────────────────────────────────────
    if include_desired:
        desired = data.get("desiredPath", [])
        if desired and len(desired) > 1:
            points = [(p[0], p[1]) for p in desired]
            msp.add_lwpolyline(
                points, close=False,
                dxfattribs={"layer": "DESIRED_PATH"},
            )

    # ── Annotations ──────────────────────────────────────────
    if mech:
        _add_annotations(msp, mech)

    # Write to bytes
    buffer = io.BytesIO()
    doc.write(buffer)
    return buffer.getvalue()


def _draw_mechanism(msp, mech: Dict):
    """Draw mechanism links and joints at initial position."""
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

    # Ground link (dashed)
    msp.add_line(A, D, dxfattribs={"layer": "GROUND", "linetype": "DASHED"})

    # Links
    msp.add_line(A, B, dxfattribs={"layer": "MECHANISM"})
    msp.add_line(B, C, dxfattribs={"layer": "MECHANISM"})
    msp.add_line(D, C, dxfattribs={"layer": "MECHANISM"})

    # Joints
    joint_r = max(a1, a2, a3, a4) * 0.02
    for pos, label in [(A, "J1"), (B, "J2"), (C, "J3"), (D, "J4")]:
        msp.add_circle(pos, radius=joint_r, dxfattribs={"layer": "JOINTS"})

    # Ground hatching
    for pos in [A, D]:
        hatch_w = joint_r * 3
        for i in range(-3, 4):
            x_off = i * joint_r * 0.8
            msp.add_line(
                (pos[0] + x_off, pos[1] - joint_r),
                (pos[0] + x_off - joint_r * 0.5, pos[1] - joint_r * 2),
                dxfattribs={"layer": "GROUND"},
            )

    # Coupler point
    cp_p = mech.get("p", 0)
    cp_alpha = np.radians(mech.get("alpha", 0))
    theta3 = result["theta3"]
    px = B[0] + cp_p * np.cos(theta3 + cp_alpha)
    py = B[1] + cp_p * np.sin(theta3 + cp_alpha)
    msp.add_circle((px, py), radius=joint_r * 1.5, dxfattribs={"layer": "COUPLER_CURVE"})


def _add_annotations(msp, mech: Dict):
    """Add text annotations for link labels and dimensions."""
    text_height = max(mech.get("a1", 10), 10) * 0.03

    # Title
    pivot_a = mech.get("pivotA", [0, 0])
    msp.add_text(
        "Zxynth Mechanism",
        dxfattribs={
            "layer": "ANNOTATIONS",
            "height": text_height * 2,
            "insert": (pivot_a[0], pivot_a[1] - text_height * 8),
        },
    )

    # Parameter annotations
    params_text = (
        f"a1={mech.get('a1', 0):.2f}  a2={mech.get('a2', 0):.2f}  "
        f"a3={mech.get('a3', 0):.2f}  a4={mech.get('a4', 0):.2f}"
    )
    msp.add_text(
        params_text,
        dxfattribs={
            "layer": "ANNOTATIONS",
            "height": text_height,
            "insert": (pivot_a[0], pivot_a[1] - text_height * 12),
        },
    )
