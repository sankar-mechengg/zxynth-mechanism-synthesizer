"""
Export API routes — generate downloadable files from synthesis results.
"""

import json
import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..models.schemas import ExportRequest

router = APIRouter()


@router.post("/export/pdf")
async def export_pdf(request: ExportRequest):
    """Generate a PDF report (full educational or concise)."""
    try:
        from ..export.pdf_report import generate_pdf_bytes
        mode = request.options.get("mode", "full")
        pdf_bytes = generate_pdf_bytes(request.model_dump(), mode=mode)

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=zxynth-report.pdf"},
        )
    except Exception as e:
        raise HTTPException(500, f"PDF generation failed: {str(e)}")


@router.post("/export/gif")
async def export_gif(request: ExportRequest):
    """Generate an animated GIF of the mechanism."""
    try:
        from ..export.gif_animator import generate_gif_bytes
        gif_bytes = generate_gif_bytes(request.model_dump(), request.options)

        return StreamingResponse(
            io.BytesIO(gif_bytes),
            media_type="image/gif",
            headers={"Content-Disposition": "attachment; filename=zxynth-mechanism.gif"},
        )
    except Exception as e:
        raise HTTPException(500, f"GIF generation failed: {str(e)}")


@router.post("/export/dxf")
async def export_dxf(request: ExportRequest):
    """Generate a DXF file for CAD import."""
    try:
        from ..export.dxf_exporter import generate_dxf_bytes
        dxf_bytes = generate_dxf_bytes(request.model_dump(), request.options)

        return StreamingResponse(
            io.BytesIO(dxf_bytes),
            media_type="application/dxf",
            headers={"Content-Disposition": "attachment; filename=zxynth-mechanism.dxf"},
        )
    except Exception as e:
        raise HTTPException(500, f"DXF generation failed: {str(e)}")


@router.post("/export/svg")
async def export_svg(request: ExportRequest):
    """Generate a layered SVG export."""
    try:
        from ..export.svg_exporter import generate_svg_bytes
        svg_bytes = generate_svg_bytes(request.model_dump(), request.options)

        return StreamingResponse(
            io.BytesIO(svg_bytes),
            media_type="image/svg+xml",
            headers={"Content-Disposition": "attachment; filename=zxynth-mechanism.svg"},
        )
    except Exception as e:
        raise HTTPException(500, f"SVG generation failed: {str(e)}")


@router.post("/export/json")
async def export_json(request: ExportRequest):
    """Export mechanism parameters as JSON."""
    data = request.model_dump()
    json_bytes = json.dumps(data, indent=2, default=str).encode("utf-8")

    return StreamingResponse(
        io.BytesIO(json_bytes),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=zxynth-mechanism.json"},
    )


@router.post("/export/csv")
async def export_csv(request: ExportRequest):
    """Export mechanism parameters as CSV."""
    try:
        from ..export.json_csv_exporter import mechanism_to_csv_bytes
        csv_bytes = mechanism_to_csv_bytes(request.model_dump())

        return StreamingResponse(
            io.BytesIO(csv_bytes),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=zxynth-mechanism.csv"},
        )
    except Exception as e:
        raise HTTPException(500, f"CSV generation failed: {str(e)}")
