import re

from services.extraction_services import (
    build_json_schema,
    extract_invoice_from_ocr_text,
    format_ocr_layout,
    normalize_extracted_data,
    parse_invoice_from_text,
)


SAMPLE_OCR = """
PT KEJAYAAN ABADI
Jalan Priangan No. 10, Cimahi, Bandung, Jawa Barat | Telepon: 2876345
Kepada Yth, Bandung, 21 Juli 2022
Ibu Suri
Jalan Kemanggisan No. 17
Bandung - Jawa Barat
NOTA
No. 114/NT/2022
Pakaian SD PR Rp 200.000 Rp 4.000.000
Pakaian SD LK Rp 180.000 Rp 4.500.000
Total Harga Rp 8.500.000
Penerima Barang Kasir
tid ttd
Agung Suparmi
"""

MULTI_DATE_OCR = """
FROM        INVOICE #        US-001
East Repair Inc.        INVOICE DATE        11/02/2019
1912 Harvest Lane        P.O.#        23/12/2019
DUE DATE        26/02/2019
"""

USD_MULTI_ITEM_OCR = """
YOUR                NO. 000001
LOGO
INVOICE
Date: 02 June, 2030
Item                Quantity        Price       Amount
Logo                $500          $500
Banner (2x6m)                S45           $90
Poster (1x2m)                $55          $165
Total         $755
Payment method: Cash
Note: Thank you for choosing us!
"""


def test_parse_invoice_from_text_merges_multiple_items_into_one_record():
    parsed = parse_invoice_from_text(
        SAMPLE_OCR,
        ["nama barang", "tanggal beli", "Price"],
    )

    assert parsed == {
        "nama barang": "Pakaian SD PR, Pakaian SD LK",
        "tanggal beli": "21 Juli 2022",
        "Price": 8500000,
    }


def test_parse_invoice_from_text_prefers_single_invoice_date():
    parsed = parse_invoice_from_text(
        MULTI_DATE_OCR,
        ["tanggal invoice"],
    )

    assert parsed["tanggal invoice"] == "11/02/2019"


def test_parse_invoice_from_text_keeps_all_usd_table_items():
    parsed = parse_invoice_from_text(
        USD_MULTI_ITEM_OCR,
        ["item", "date", "Price"],
    )

    assert parsed["item"] == "Logo, Banner (2x6m), Poster (1x2m)"
    assert parsed["date"] == "02 June, 2030"
    assert parsed["Price"] == 755


def test_normalize_extracted_data_keeps_schema_and_prefers_deterministic_values():
    normalized = normalize_extracted_data(
        {
            "nama barang": None,
            "tanggal beli": "wrong",
            "Price": "Rp 1.000",
            "extra": "ignored",
        },
        ["nama barang", "tanggal beli", "Price"],
        {
            "nama barang": "Pakaian SD PR, Pakaian SD LK",
            "tanggal beli": "21 Juli 2022",
            "Price": 8500000,
        },
    )

    assert normalized == {
        "nama barang": "Pakaian SD PR, Pakaian SD LK",
        "tanggal beli": "21 Juli 2022",
        "Price": 8500000,
    }


def test_normalize_extracted_data_collapses_scalar_candidates():
    normalized = normalize_extracted_data(
        {
            "tanggal invoice": ["11/02/2019", "26/02/2019"],
            "invoice number": ["US-001", "2312/2019"],
            "nama barang": ["Line item A", "Line item B"],
        },
        ["tanggal invoice", "invoice number", "nama barang"],
    )

    assert normalized == {
        "tanggal invoice": "11/02/2019",
        "invoice number": "US-001",
        "nama barang": "Line item A, Line item B",
    }


def test_format_ocr_layout_reconstructs_rows_with_horizontal_spacing():
    words = [
        {"text": "QTY", "left": 10, "top": 10, "width": 28, "height": 10, "conf": 90},
        {"text": "DESCRIPTION", "left": 80, "top": 10, "width": 85, "height": 10, "conf": 92},
        {"text": "UNIT", "left": 220, "top": 10, "width": 32, "height": 10, "conf": 91},
        {"text": "PRICE", "left": 258, "top": 10, "width": 42, "height": 10, "conf": 91},
        {"text": "Subtotal", "left": 220, "top": 45, "width": 58, "height": 10, "conf": 90},
        {"text": "145.00", "left": 320, "top": 45, "width": 48, "height": 10, "conf": 90},
    ]

    layout = format_ocr_layout(words)

    assert "------------" not in layout
    assert "line " not in layout
    assert "tokens " not in layout
    assert "QTY" in layout
    assert "DESCRIPTION" in layout
    assert "UNIT PRICE" in layout
    assert "Subtotal" in layout
    assert "145.00" in layout
    assert re.search(r"DESCRIPTION\s{2,}UNIT", layout)


def test_extract_invoice_from_ocr_text_uses_parser_without_llm_when_enough_data():
    def fail_if_called(*args, **kwargs):
        raise AssertionError("LLM should not be called for this clear invoice")

    extracted = extract_invoice_from_ocr_text(
        SAMPLE_OCR,
        ["nama barang", "tanggal beli", "Price"],
        llm_extract=fail_if_called,
    )

    assert extracted["nama barang"] == "Pakaian SD PR, Pakaian SD LK"
    assert extracted["tanggal beli"] == "21 Juli 2022"
    assert extracted["Price"] == 8500000
    assert build_json_schema(["Price"]) == '{\n  "Price": string | number | null\n}'
