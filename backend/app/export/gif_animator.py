"""
GIF Animator

Renders mechanism animation frames using matplotlib and assembles
them into an animated GIF using Pillow.

Each frame shows the mechanism at a specific crank angle with:
- Links as colored lines
- Joints as circles
- Coupler curve trace (progressive)
- Optional desired path overlay
"""

import io
import numpy as np
from typing import Dict, List, Optional
from PIL import Image as PILImage

import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
from matplotlib.patches import Circle as MplCircle
from matplotlib.lines import Line2D


def generate_gif_bytes(data: Dict, options: Dict) -> bytes:
    """
    Generate animated GIF of the mechanism.

    Args:
        data: export data dict with mechanism, couplerCurve, desiredPath
        options: {width, height, fps, startAngle, endAngle, quality}

    Returns:
        GIF file content as bytes
    """
    width = options.get("width", 800)
    height = options.get("height", 600)
    fps = options.get("fps", 30)
    start_angle = options.get("startAngle", 0)
    end_angle = options.get("endAngle", 360)
    dpi = 100

    mech = data.get("mechanism", {})
    coupler_curve = data.get("couplerCurve", [])
    desired_path = data.get("desiredPath", [])

    if not mech or not mech.get("a1"):
        raise ValueError("No mechanism data for GIF generation")

    # Compute number of frames
    duration_sec = 6.0  # One full cycle = 6 seconds
    angle_range = end_angle - start_angle
    total_frames = min(int(duration_sec * fps), 360)
    frame_delay = int(1000 / fps)  # ms per frame

    # Generate frames
    frames = []
    fig_w = width / dpi
    fig_h = height / dpi

    for i in range(total_frames):
        angle = start_angle + (angle_range * i / max(1, total_frames - 1))
        frame = _render_frame(
            mech, angle, coupler_curve, desired_path,
            fig_w, fig_h, dpi, i, total_frames,
        )
        if frame:
            frames.append(frame)

    if not frames:
        raise ValueError("No frames could be rendered")

    # Assemble GIF
    buffer = io.BytesIO()
    frames[0].save(
        buffer,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=frame_delay,
        loop=0,
        optimize=True,
    )
    return buffer.getvalue()


def _render_frame(
    mech: Dict,
    angle_deg: float,
    coupler_curve: List,
    desired_path: List,
    fig_w: float, fig_h: float, dpi: int,
    frame_idx: int, total_frames: int,
) -> Optional[PILImage.Image]:
    """Render a single frame as a PIL Image."""
    from ..kinematics.loop_closure import solve_four_bar

    a1 = mech.get("a1", 1)
    a2 = mech.get("a2", 1)
    a3 = mech.get("a3", 1)
    a4 = mech.get("a4", 1)
    pivot_a = tuple(mech.get("pivotA", [0, 0]))
    pivot_d = tuple(mech.get("pivotD", [a1, 0]))
    cp_p = mech.get("p", 0)
    cp_alpha = np.radians(mech.get("alpha", 0))

    theta2 = np.radians(angle_deg)
    result = solve_four_bar(a1, a2, a3, a4, theta2, pivot_a, pivot_d)
    if result is None:
        return None

    A = result["A"]
    B = result["B"]
    C = result["C"]
    D = result["D"]
    theta3 = result["theta3"]

    # Coupler point
    px = B[0] + cp_p * np.cos(theta3 + cp_alpha)
    py = B[1] + cp_p * np.sin(theta3 + cp_alpha)

    # Create figure
    fig, ax = plt.subplots(1, 1, figsize=(fig_w, fig_h), dpi=dpi)
    fig.patch.set_facecolor("#0a0e1a")
    ax.set_facecolor("#0a0e1a")

    # Compute view bounds
    all_pts = [A, B, C, D, (px, py)]
    if coupler_curve:
        cc = np.array(coupler_curve)
        all_pts.extend([(cc[j, 0], cc[j, 1]) for j in range(0, len(cc), max(1, len(cc) // 20))])
    if desired_path:
        dp = np.array(desired_path)
        all_pts.extend([(dp[j, 0], dp[j, 1]) for j in range(0, len(dp), max(1, len(dp) // 20))])

    xs = [p[0] for p in all_pts]
    ys = [p[1] for p in all_pts]
    pad = max(max(xs) - min(xs), max(ys) - min(ys)) * 0.15 + 10
    ax.set_xlim(min(xs) - pad, max(xs) + pad)
    ax.set_ylim(min(ys) - pad, max(ys) + pad)
    ax.set_aspect("equal")
    ax.axis("off")

    # Desired path (dashed pink)
    if desired_path and len(desired_path) > 1:
        dp = np.array(desired_path)
        ax.plot(dp[:, 0], dp[:, 1], "--", color="#f472b6", alpha=0.5, linewidth=1.2, label="Desired")

    # Coupler curve traced so far
    if coupler_curve and len(coupler_curve) > 1:
        cc = np.array(coupler_curve)
        # Full curve faint
        ax.plot(cc[:, 0], cc[:, 1], "-", color="#34d399", alpha=0.15, linewidth=1)
        # Progressive trace
        trace_idx = int((frame_idx / max(1, total_frames - 1)) * (len(cc) - 1))
        if trace_idx > 0:
            ax.plot(cc[:trace_idx, 0], cc[:trace_idx, 1], "-", color="#34d399", alpha=0.7, linewidth=1.5)

    # Ground link (dashed)
    ax.plot([A[0], D[0]], [A[1], D[1]], "--", color="#94a3b8", linewidth=2, alpha=0.5)

    # Links
    ax.plot([A[0], B[0]], [A[1], B[1]], "-", color="#60a5fa", linewidth=2.5, solid_capstyle="round")
    ax.plot([B[0], C[0]], [B[1], C[1]], "-", color="#34d399", linewidth=2.5, solid_capstyle="round")
    ax.plot([D[0], C[0]], [D[1], C[1]], "-", color="#60a5fa", linewidth=2.5, solid_capstyle="round")

    # Joints
    joint_r = max(1, (max(xs) - min(xs)) * 0.012)
    for pos, is_fixed in [(A, True), (B, False), (C, False), (D, True)]:
        color = "#f59e0b" if is_fixed else "#60a5fa"
        circle = MplCircle(pos, joint_r, facecolor=color, edgecolor="#0a0e1a", linewidth=1.5, zorder=5)
        ax.add_patch(circle)

    # Coupler point
    cp_circle = MplCircle((px, py), joint_r * 1.2, facecolor="#34d399", edgecolor="#0a0e1a", linewidth=2, zorder=6)
    ax.add_patch(cp_circle)

    # Angle display
    ax.text(
        0.02, 0.98, f"θ₂ = {angle_deg:.1f}°",
        transform=ax.transAxes, fontsize=10, color="#60a5fa",
        fontfamily="monospace", va="top",
    )

    # Zxynth watermark
    ax.text(
        0.98, 0.02, "Zxynth",
        transform=ax.transAxes, fontsize=8, color="#243050",
        fontfamily="sans-serif", ha="right", va="bottom",
    )

    # Convert to PIL image
    buf = io.BytesIO()
    fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0.1)
    plt.close(fig)
    buf.seek(0)
    img = PILImage.open(buf).convert("RGB")

    return img
