from openai import OpenAI
from dotenv import load_dotenv
from typing import Any, Callable, List, Optional
from PIL import Image, ImageOps
import cv2
import numpy as np
import pytesseract
import base64
import json
import io
import os
import re

load_dotenv()

from services.image_services import encode_image_url

client = OpenAI(
    api_key="ollama",
    base_url= os.getenv("OLLAMA_URL", "http://localhost:11434/v1")
)

# =========================
# PREPROCESSING FUNCTION
# =========================
def preprocess_image(image: Image.Image) -> Image.Image:
    # 1. Convert to grayscale
    image = ImageOps.grayscale(image)

    # 2. Upscale 2x dengan LANCZOS
    width, height = image.size
    image = image.resize((width * 2, height * 2), Image.LANCZOS)

    # 3. Convert ke numpy untuk cv2
    img_np = np.array(image)

    # 4. Denoise sebelum threshold
    img_np = cv2.fastNlMeansDenoising(img_np, h=10)

    # 5. Sharpening
    kernel = np.array([[0, -1, 0],
                       [-1, 5, -1],
                       [0, -1, 0]])
    img_np = cv2.filter2D(img_np, -1, kernel)

    # 6. Otsu thresholding
    _, img_np = cv2.threshold(img_np, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # 7. Kembalikan ke PIL
    return Image.fromarray(img_np)


# =========================
# OCR FUNCTION
# =========================
def extract_text_from_image_base64(image_base64: str) -> str:
    raw_text, _ = extract_ocr_from_image_base64(image_base64)
    return raw_text


def extract_ocr_from_image_base64(image_base64: str) -> tuple[str, str]:
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]

    image_data = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_data))
    image = preprocess_image(image)

    text = combine_ocr_text_passes(image)

    data = pytesseract.image_to_data(
        image,
        lang="ind+eng",
        config="--oem 3 --psm 11",
        output_type=pytesseract.Output.DICT,
    )
    words = []
    for index, word in enumerate(data.get("text", [])):
        word = word.strip()
        if not word:
            continue
        try:
            confidence = float(data["conf"][index])
        except (TypeError, ValueError):
            confidence = -1
        if confidence < 0:
            continue
        words.append({
            "text": word,
            "left": int(data["left"][index]),
            "top": int(data["top"][index]),
            "width": int(data["width"][index]),
            "height": int(data["height"][index]),
            "block": int(data["block_num"][index]),
            "paragraph": int(data["par_num"][index]),
            "line": int(data["line_num"][index]),
            "word": int(data["word_num"][index]),
            "conf": confidence,
        })

    return text, format_ocr_layout(words)


def combine_ocr_text_passes(image: Image.Image) -> str:
    configs = [
        "--oem 3 --psm 6",
        "--oem 3 --psm 4",
        "--oem 3 --psm 11",
    ]
    seen: set[str] = set()
    lines: list[str] = []

    for config in configs:
        text = pytesseract.image_to_string(
            image,
            lang="ind+eng",
            config=config,
        )
        for line in text.splitlines():
            cleaned = line.strip()
            if not cleaned:
                continue
            key = re.sub(r"\s+", " ", cleaned).lower()
            if key in seen:
                continue
            seen.add(key)
            lines.append(cleaned)

    return "\n".join(lines)


def format_ocr_layout(words: List[dict[str, Any]]) -> str:
    clean_words = [word for word in words if str(word.get("text", "")).strip()]
    if not clean_words:
        return ""

    clean_words.sort(key=lambda word: (
        int(word.get("top", 0)) + (int(word.get("height", 0)) // 2),
        int(word.get("left", 0)),
    ))
    median_height = float(np.median([
        max(1, int(word.get("height", 1)))
        for word in clean_words
    ]))
    row_threshold = max(6, int(median_height * 0.65))

    visual_rows: list[list[dict[str, Any]]] = []
    for word in clean_words:
        word_midline = int(word.get("top", 0)) + (int(word.get("height", 0)) // 2)
        best_row: Optional[list[dict[str, Any]]] = None
        best_distance: Optional[int] = None

        for row in visual_rows:
            row_midline = int(np.median([
                int(item.get("top", 0)) + (int(item.get("height", 0)) // 2)
                for item in row
            ]))
            distance = abs(word_midline - row_midline)
            if distance <= row_threshold and (
                best_distance is None or distance < best_distance
            ):
                best_row = row
                best_distance = distance

        if best_row is None:
            visual_rows.append([word])
        else:
            best_row.append(word)

    char_widths = []
    for word in clean_words:
        text = str(word.get("text", "")).strip()
        if text:
            char_widths.append(max(1, int(word.get("width", 1))) / len(text))
    median_char_width = max(4.0, float(np.median(char_widths)) if char_widths else 8.0)

    rendered_lines: list[str] = []
    for row in visual_rows:
        row.sort(key=lambda word: int(word.get("left", 0)))
        rendered = ""
        previous_right: Optional[int] = None

        for word in row:
            text = str(word.get("text", "")).strip()
            left = int(word.get("left", 0))
            width = int(word.get("width", 0))

            if previous_right is None:
                rendered = text
            else:
                gap = left - previous_right
                spaces = max(1, round(gap / median_char_width))
                rendered += (" " * min(spaces, 16)) + text

            previous_right = max(
                previous_right or 0,
                left + width,
            )

        rendered = re.sub(r" {17,}", " " * 16, rendered.rstrip())
        if rendered:
            rendered_lines.append(rendered)

    return "\n".join(rendered_lines)


MONTH_PATTERN = (
    "januari|februari|maret|april|mei|juni|juli|agustus|september|"
    "oktober|november|desember|jan|feb|mar|apr|jun|jul|agu|agt|sep|"
    "okt|nov|des|january|february|march|april|may|june|july|august|"
    "october|december"
)
MONEY_PATTERN = re.compile(r"(?:Rp\.?|\$|S)\s*[\d.,]+", re.IGNORECASE)
TEXTUAL_DATE_PATTERN = rf"\b\d{{1,2}}\s+(?:{MONTH_PATTERN}),?\s+\d{{4}}\b"
NUMERIC_DATE_PATTERN = r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b"
DATE_PATTERN = re.compile(
    TEXTUAL_DATE_PATTERN,
    re.IGNORECASE,
)
ANY_DATE_PATTERN = re.compile(
    rf"(?:{TEXTUAL_DATE_PATTERN})|(?:{NUMERIC_DATE_PATTERN})",
    re.IGNORECASE,
)


def parse_money(value: Any) -> Any:
    if isinstance(value, (int, float)):
        return value
    if not isinstance(value, str):
        return value

    match = MONEY_PATTERN.search(value)
    money_text = match.group(0) if match else value
    digits = re.sub(r"[^\d]", "", money_text)
    if not digits:
        return value
    return int(digits)


def _find_column(columns: List[str], keywords: List[str]) -> Optional[str]:
    for column in columns:
        lowered = column.lower()
        if any(keyword in lowered for keyword in keywords):
            return column
    return None


def choose_invoice_date(text: str) -> Optional[str]:
    candidates: list[tuple[int, int, str]] = []
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    for line_index, line in enumerate(lines):
        lowered = line.lower()
        for match in ANY_DATE_PATTERN.finditer(line):
            score = 0

            if "invoice date" in lowered or "tanggal invoice" in lowered or "tgl invoice" in lowered:
                score += 80
            elif "date" in lowered or "tanggal" in lowered or "tgl" in lowered:
                score += 35

            if "invoice" in lowered:
                score += 25
            if "due" in lowered or "jatuh tempo" in lowered:
                score -= 60
            if "p.o" in lowered or "po#" in lowered or "p/o" in lowered:
                score -= 45
            if "terms" in lowered or "condition" in lowered:
                score -= 25

            candidates.append((score, -line_index, match.group(0)))

    if not candidates:
        return None

    return max(candidates)[2]


def collapse_scalar_value(value: Any) -> Any:
    if isinstance(value, list):
        for item in value:
            if item not in (None, ""):
                return item
        return None
    return value


def clean_item_name(value: str) -> str:
    item_name = MONEY_PATTERN.split(value, maxsplit=1)[0].strip(" -:\t")
    item_name = re.sub(r"^\d+[.)-]?\s*", "", item_name).strip()
    return item_name


def parse_invoice_from_text(text: str, columns: List[str]) -> dict[str, Any]:
    item_column = _find_column(columns, ["barang", "item", "produk", "product"])
    date_column = _find_column(columns, ["tanggal", "date", "tgl"])
    price_column = _find_column(columns, ["price", "harga", "total", "amount", "biaya"])

    result: dict[str, Any] = {column: None for column in columns}
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    if date_column:
        result[date_column] = choose_invoice_date(text)

    item_names: list[str] = []
    total_value: Any = None
    in_item_table = False
    for line in lines:
        money_matches = MONEY_PATTERN.findall(line)
        lowered = line.lower()

        if (
            ("item" in lowered or "description" in lowered or "barang" in lowered)
            and ("price" in lowered or "amount" in lowered or "harga" in lowered)
        ):
            in_item_table = True
            continue

        if money_matches and any(word in lowered for word in ["total", "jumlah", "grand total"]):
            total_value = parse_money(money_matches[-1])
            in_item_table = False
            continue

        if in_item_table and any(word in lowered for word in ["subtotal", "tax", "payment", "note", "terms"]):
            in_item_table = False
            continue

        if len(money_matches) >= 2 or (in_item_table and money_matches):
            item_name = clean_item_name(line)
            if item_name:
                item_names.append(item_name)

    if item_column and item_names:
        result[item_column] = ", ".join(item_names)
    if price_column and total_value is not None:
        result[price_column] = total_value

    return result


def _has_useful_deterministic_data(parsed: dict[str, Any], columns: List[str]) -> bool:
    if not parsed:
        return False
    item_column = _find_column(columns, ["barang", "item", "produk", "product"])
    price_column = _find_column(columns, ["price", "harga", "total", "amount", "biaya"])
    return bool(
        item_column
        and price_column
        and parsed.get(item_column)
        and parsed.get(price_column) is not None
    )


def _has_all_requested_data(parsed: dict[str, Any], columns: List[str]) -> bool:
    return bool(columns) and all(parsed.get(column) not in (None, "") for column in columns)


def normalize_extracted_data(
    data: Any,
    columns: List[str],
    deterministic: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    if isinstance(data, list):
        data = data[0] if data else {}
    if not isinstance(data, dict):
        data = {}

    item_column = _find_column(columns, ["barang", "item", "produk", "product"])
    normalized = {}
    for column in columns:
        value = data.get(column)
        is_date_column = _find_column([column], ["tanggal", "date", "tgl"])
        if column == item_column and isinstance(value, list):
            value = ", ".join(str(item) for item in value if item not in (None, ""))
        elif column != item_column:
            if is_date_column and isinstance(value, list):
                value = choose_invoice_date("\n".join(str(item) for item in value)) or collapse_scalar_value(value)
            else:
                value = collapse_scalar_value(value)
            if is_date_column and isinstance(value, str):
                value = choose_invoice_date(value) or value
        normalized[column] = value

    for column in columns:
        if _find_column([column], ["price", "harga", "total", "amount", "biaya"]):
            normalized[column] = parse_money(normalized[column])

    if deterministic:
        for column in columns:
            value = deterministic.get(column)
            if value is not None and value != "":
                normalized[column] = value

    return normalized


# =========================
# EXTRACT INVOICE DATA
# =========================
def _llm_extract_invoice_data(
    raw_ocr_text: str,
    layout_ocr_text: str,
    schema: str,
    model: str = "qwen2.5:1.5b"
) -> dict:
    prompt_text = f"""
    Extract receipt/invoice data into ONE JSON object.

    Raw OCR:
    {raw_ocr_text}

    Reconstructed OCR rows:
    {layout_ocr_text}

    Task:
    Extract data according to the schema.

    REQUIREMENTS:
    - Return ONLY JSON
    - Do not use markdown
    - Do not add explanations
    - Ensure the JSON is valid
    - Use only fields defined in the schema
    - Do not add any other fields
    - Use both Raw OCR and Reconstructed OCR rows; the reconstructed rows preserve larger horizontal gaps as spaces for table-like documents
    - If there is an item/description table, extract EVERY item row between the item table header and totals/payment/note/terms; combine all item names with commas in one item field
    - Do not return only the first item when rows like Logo, Banner, and Poster are present
    - For every non-item field, return exactly ONE most likely value, never a list and never multiple candidates joined together
    - For date/tanggal fields, choose the invoice/transaction date only; prefer labels like "Invoice Date", "Date", "Tanggal", or "Tgl", and avoid due dates, P.O. dates, payment terms dates, or every date found in the OCR
    - For price/Price, use the receipt total, not the per-item price

    Schema:
    {schema}

    If a field is not found:
    use null
    """

    print(prompt_text)

    if os.getenv("EXTRACTION_DEBUG", "").lower() == "true":
        print("PROMPT:\n", prompt_text)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You extract structured invoice "
                    "data and ONLY return valid JSON."
                )
            },
            {
                "role": "user",
                "content": prompt_text
            }
        ],
        temperature=0
    )

    raw_content = response.choices[0].message.content

    if not raw_content:
        raise ValueError("Response kosong")

    if os.getenv("EXTRACTION_DEBUG", "").lower() == "true":
        print("RAW LLM RESPONSE:\n", raw_content)

    cleaned = (
        raw_content
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    return json.loads(cleaned)


def extract_invoice_from_ocr_text(
    raw_ocr_text: str,
    columns: List[str],
    layout_ocr_text: str = "",
    model: str = "qwen2.5:1.5b",
    llm_extract: Optional[Callable[..., dict[str, Any]]] = None,
) -> dict[str, Any]:
    deterministic = parse_invoice_from_text(raw_ocr_text, columns)
    if not _has_useful_deterministic_data(deterministic, columns) and layout_ocr_text:
        deterministic = parse_invoice_from_text(layout_ocr_text, columns)

    if _has_useful_deterministic_data(deterministic, columns) and _has_all_requested_data(deterministic, columns):
        return normalize_extracted_data({}, columns, deterministic)

    schema = build_json_schema(columns)
    extractor = llm_extract or _llm_extract_invoice_data
    extracted = extractor(raw_ocr_text, layout_ocr_text, schema, model)
    return normalize_extracted_data(extracted, columns, deterministic)


def _extract_invoice_data(
    image_base64: str,
    columns: List[str],
    model: str = "qwen2.5:1.5b"
) -> dict:
    raw_ocr_text, layout_ocr_text = extract_ocr_from_image_base64(image_base64)
    if os.getenv("EXTRACTION_DEBUG", "").lower() == "true":
        print("RAW OCR:\n", raw_ocr_text)
        print("LAYOUT OCR:\n", layout_ocr_text)

    extracted = extract_invoice_from_ocr_text(
        raw_ocr_text,
        columns,
        layout_ocr_text,
        model,
    )

    if os.getenv("EXTRACTION_DEBUG", "").lower() == "true":
        print("FINAL EXTRACTION:\n", json.dumps(extracted, ensure_ascii=False))

    return extracted


# =========================
# PUBLIC FUNCTION
# =========================
def extract_invoice_from_bytes(
    image_bytes: bytes,
    columns: List[str],
    model: str = "qwen2.5:1.5b"
):
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")

    return _extract_invoice_data(
        image_base64,
        columns,
        model
    )

def extract_invoice_from_image(
        image_url: str,
        columns: List[str],
        model: str = "qwen2.5:1.5b"
):
    
    image_base64 = encode_image_url(image_url)

    return _extract_invoice_data(
        image_base64, 
        columns,
        model
    )


def build_json_schema(columns: List[str]) -> str:
    fields = ",\n  ".join([
        f"\"{col}\": string | number | null"
        for col in columns
    ])

    return "{\n  " + fields + "\n}"
