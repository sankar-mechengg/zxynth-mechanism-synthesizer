"""
Parsing API routes — validate and normalize uploaded SVG/CSV files.
These are optional endpoints; the frontend can also parse client-side.
Server-side parsing is useful for large files or additional validation.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File

router = APIRouter()


@router.post("/parse/svg")
async def parse_svg_file(file: UploadFile = File(...)):
    """
    Parse an uploaded SVG file and return sampled path points.
    """
    if not file.filename or not file.filename.lower().endswith(".svg"):
        raise HTTPException(400, "File must be an SVG (.svg)")

    try:
        content = await file.read()
        content_str = content.decode("utf-8")

        from ..parsers.svg_parser import parse_svg
        result = parse_svg(content_str, num_samples=101)

        return {
            "points": result["points"],
            "numPoints": len(result["points"]),
            "bounds": result.get("bounds"),
            "pathData": result.get("path_d", "")[:200],  # First 200 chars of d attr
        }
    except UnicodeDecodeError:
        raise HTTPException(400, "SVG file is not valid UTF-8 text")
    except Exception as e:
        raise HTTPException(400, f"SVG parsing failed: {str(e)}")


@router.post("/parse/csv")
async def parse_csv_file(file: UploadFile = File(...), mode: str = "path"):
    """
    Parse an uploaded CSV file and return validated data points.

    Args:
        mode: 'path' for (x, y) data, 'function' for (theta_in, theta_out) data
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, "File must be a CSV (.csv)")

    if mode not in ("path", "function"):
        raise HTTPException(400, "Mode must be 'path' or 'function'")

    try:
        content = await file.read()
        content_str = content.decode("utf-8")

        from ..parsers.csv_parser import parse_csv, parse_function_csv

        if mode == "function":
            result = parse_function_csv(content_str)
            return {
                "pairs": result["pairs"],
                "numPairs": len(result["pairs"]),
                "hasHeader": result["has_header"],
                "isMonotonic": result["is_monotonic"],
                "warnings": result.get("warnings", []),
            }
        else:
            result = parse_csv(content_str)
            return {
                "points": result["points"],
                "numPoints": len(result["points"]),
                "hasHeader": result["has_header"],
                "warnings": result.get("warnings", []),
            }
    except UnicodeDecodeError:
        raise HTTPException(400, "CSV file is not valid UTF-8 text")
    except Exception as e:
        raise HTTPException(400, f"CSV parsing failed: {str(e)}")
