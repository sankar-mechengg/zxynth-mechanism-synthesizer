"""
Tests for SVG and CSV parsers.
"""

import pytest
import numpy as np

from app.parsers.svg_parser import parse_svg
from app.parsers.csv_parser import parse_csv, parse_function_csv


class TestSvgParser:
    """Test SVG path parsing and sampling."""

    def test_parses_line(self):
        svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M 10 10 L 90 90" />
        </svg>'''
        result = parse_svg(svg, num_samples=11)
        assert len(result["points"]) == 11
        # First point should be near (10, 10)
        assert abs(result["points"][0][0] - 10) < 1
        # Last point should be near (90, 90)
        assert abs(result["points"][-1][0] - 90) < 1

    def test_parses_cubic_bezier(self):
        svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
            <path d="M 10 180 C 50 10, 150 10, 190 180" />
        </svg>'''
        result = parse_svg(svg, num_samples=51)
        assert len(result["points"]) == 51

    def test_parses_arc(self):
        svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 792">
            <path d="M608.97,93.03 A605.94,605.94 0 0 0 3.03,698.97" />
        </svg>'''
        result = parse_svg(svg, num_samples=101)
        assert len(result["points"]) == 101

    def test_returns_bounds(self):
        svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <path d="M 20 30 L 80 70" />
        </svg>'''
        result = parse_svg(svg)
        assert "bounds" in result
        assert result["bounds"]["minX"] <= result["bounds"]["maxX"]

    def test_raises_on_no_path(self):
        svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10" /></svg>'
        with pytest.raises(ValueError, match="No <path>"):
            parse_svg(svg)

    def test_raises_on_empty_d(self):
        svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="" /></svg>'
        with pytest.raises(ValueError, match="empty"):
            parse_svg(svg)

    def test_raises_on_invalid_xml(self):
        with pytest.raises(ValueError, match="Invalid SVG"):
            parse_svg("<not valid xml>>>>>")


class TestCsvParser:
    """Test CSV parsing for path data."""

    def test_parses_simple_csv(self):
        content = "0,0\n1,1\n2,4\n3,9"
        result = parse_csv(content)
        assert len(result["points"]) == 4
        assert result["has_header"] is False

    def test_parses_with_header(self):
        content = "x,y\n0,0\n1,1\n2,4"
        result = parse_csv(content)
        assert len(result["points"]) == 3
        assert result["has_header"] is True

    def test_handles_bom(self):
        content = "\ufeff0,0\n1,1\n2,4"
        result = parse_csv(content)
        assert len(result["points"]) == 3

    def test_handles_semicolon_delimiter(self):
        content = "0;0\n1;1\n2;4"
        result = parse_csv(content)
        assert len(result["points"]) == 3

    def test_handles_tab_delimiter(self):
        content = "0\t0\n1\t1\n2\t4"
        result = parse_csv(content)
        assert len(result["points"]) == 3

    def test_raises_on_empty(self):
        with pytest.raises(ValueError, match="empty"):
            parse_csv("")

    def test_raises_on_single_row(self):
        with pytest.raises(ValueError, match="at least 2"):
            parse_csv("1,2")

    def test_skips_bad_rows_with_warnings(self):
        content = "0,0\nbad,data\n2,4\n3,9"
        result = parse_csv(content)
        assert len(result["points"]) == 3
        assert len(result["warnings"]) > 0


class TestFunctionCsvParser:
    """Test CSV parsing for function data."""

    def test_parses_function_pairs(self):
        content = "0,0\n30,15\n60,45\n90,80\n120,90"
        result = parse_function_csv(content)
        assert len(result["pairs"]) == 5
        assert result["is_monotonic"] is True

    def test_detects_non_monotonic(self):
        content = "0,0\n60,30\n30,15\n90,80"
        result = parse_function_csv(content)
        assert result["is_monotonic"] is False
        assert any("monotonic" in w.lower() for w in result["warnings"])
