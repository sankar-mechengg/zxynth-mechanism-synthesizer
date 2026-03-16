"""
Tests for export modules.
Verifies that each export format generates valid output without errors.
"""

import pytest
import json

from app.export.pdf_report import generate_pdf_bytes
from app.export.json_csv_exporter import mechanism_to_csv_bytes, mechanism_to_json_bytes


@pytest.fixture
def sample_export_data():
    """Sample mechanism data for export testing."""
    return {
        "mechanism": {
            "type": "four_bar",
            "a1": 52.68,
            "a2": 23.48,
            "a3": 35.76,
            "a4": 45.40,
            "p": 99.74,
            "alpha": 177.5,
            "pivotA": [121.62, -4.69],
            "pivotD": [171.57, 12.04],
            "groundAngle": 18.51,
            "grashofMargin": 5.0,
            "theta2_0": 0,
        },
        "errorMetrics": {
            "mean": 0.63,
            "max": 1.37,
            "rms": 0.73,
            "meanPercent": 0.39,
            "maxPercent": 0.83,
            "rmsPercent": 0.45,
        },
        "grashofType": "crank-rocker",
        "transmissionAngle": {"min": 40.0, "max": 140.0},
        "couplerCurve": [[0, 0], [10, 15], [20, 25], [30, 20], [40, 5]],
        "desiredPath": [[0, 0], [10, 14], [20, 24], [30, 19], [40, 4]],
        "options": {},
    }


class TestPdfExport:
    """Test PDF report generation."""

    def test_generates_full_pdf(self, sample_export_data):
        pdf_bytes = generate_pdf_bytes(sample_export_data, mode="full")
        assert len(pdf_bytes) > 1000
        # PDF should start with %PDF
        assert pdf_bytes[:5] == b"%PDF-"

    def test_generates_concise_pdf(self, sample_export_data):
        pdf_bytes = generate_pdf_bytes(sample_export_data, mode="concise")
        assert len(pdf_bytes) > 500
        assert pdf_bytes[:5] == b"%PDF-"

    def test_concise_smaller_than_full(self, sample_export_data):
        full = generate_pdf_bytes(sample_export_data, mode="full")
        concise = generate_pdf_bytes(sample_export_data, mode="concise")
        assert len(concise) < len(full)

    def test_handles_minimal_data(self):
        data = {"mechanism": {"a1": 10, "a2": 3}, "options": {}}
        pdf_bytes = generate_pdf_bytes(data, mode="concise")
        assert pdf_bytes[:5] == b"%PDF-"


class TestCsvExport:
    """Test CSV export."""

    def test_generates_csv(self, sample_export_data):
        csv_bytes = mechanism_to_csv_bytes(sample_export_data)
        content = csv_bytes.decode("utf-8")
        assert "Zxynth" in content
        assert "a1_ground" in content
        assert "52.68" in content

    def test_csv_has_sections(self, sample_export_data):
        content = mechanism_to_csv_bytes(sample_export_data).decode("utf-8")
        assert "# Mechanism Parameters" in content
        assert "# Error Metrics" in content
        assert "# Performance" in content

    def test_csv_has_coupler_curve(self, sample_export_data):
        content = mechanism_to_csv_bytes(sample_export_data).decode("utf-8")
        assert "# Coupler Curve Points" in content
        assert "x,y" in content

    def test_handles_empty_mechanism(self):
        data = {"mechanism": {}}
        csv_bytes = mechanism_to_csv_bytes(data)
        assert len(csv_bytes) > 0


class TestJsonExport:
    """Test JSON export."""

    def test_generates_json(self, sample_export_data):
        json_bytes = mechanism_to_json_bytes(sample_export_data)
        parsed = json.loads(json_bytes.decode("utf-8"))
        assert "generator" in parsed
        assert parsed["generator"] == "Zxynth (zxynth.xyz)"

    def test_json_contains_mechanism(self, sample_export_data):
        json_bytes = mechanism_to_json_bytes(sample_export_data)
        parsed = json.loads(json_bytes.decode("utf-8"))
        assert "mechanism" in parsed
        assert parsed["mechanism"]["a1"] == 52.68

    def test_json_handles_nan(self):
        data = {"mechanism": {"a1": float("nan"), "a2": 5.0}}
        json_bytes = mechanism_to_json_bytes(data)
        parsed = json.loads(json_bytes.decode("utf-8"))
        # NaN should be converted to None
        assert parsed["mechanism"]["a1"] is None
        assert parsed["mechanism"]["a2"] == 5.0

    def test_json_handles_infinity(self):
        data = {"mechanism": {"a1": float("inf")}}
        json_bytes = mechanism_to_json_bytes(data)
        parsed = json.loads(json_bytes.decode("utf-8"))
        assert parsed["mechanism"]["a1"] is None
