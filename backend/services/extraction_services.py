from openai import OpenAI
from dotenv import load_dotenv
from typing import List
from PIL import Image, ImageOps
import cv2
import numpy as np
import pytesseract
import base64
import json
import io
import os

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
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]

    image_data = base64.b64decode(image_base64)
    image = Image.open(io.BytesIO(image_data))
    image = preprocess_image(image)

    text = pytesseract.image_to_string(
        image,
        lang="ind+eng",
        config="--oem 3 --psm 6"
    )

    return text


# =========================
# EXTRACT INVOICE DATA
# =========================
def _extract_invoice_data(
    image_base64: str,
    schema: str,
    model: str = "qwen2.5:1.5b"
) -> dict:

    extracted_text = extract_text_from_image_base64(image_base64)

    prompt_text = f"""
    Berikut hasil OCR dari invoice:
    {extracted_text}

    Tugas:
    Ekstrak data invoice menjadi JSON.

    WAJIB:
    - Return HANYA JSON
    - Jangan gunakan markdown
    - Jangan tambahkan penjelasan
    - Pastikan JSON valid
    - Gunakan field sesuai schema
    - Field yang namanya plural (berakhiran s) otomatis dijadikan array

    Schema:
    {schema}

    Jika field tidak ditemukan:
    gunakan null
    """

    print(prompt_text)

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

    cleaned = (
        raw_content
        .replace("```json", "")
        .replace("```", "")
        .strip()
    )

    return json.loads(cleaned)


# =========================
# PUBLIC FUNCTION
# =========================
def extract_invoice_from_bytes(
    image_bytes: bytes,
    columns: List[str],
    model: str = "qwen2.5:1.5b"
):
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    schema = build_json_schema(columns)

    return _extract_invoice_data(
        image_base64,
        schema,
        model
    )

def extract_invoice_from_image(
        image_url: str,
        columns: List[str],
        model: str = "qwen2.5:1.5b"
):
    
    image_base64 = encode_image_url(image_url)
    schema = build_json_schema(columns)

    return _extract_invoice_data(
        image_base64, 
        schema, 
        model
    )


def build_json_schema(columns: List[str]) -> str:
    fields = ",\n  ".join([
        f"\"{col}\": string | number | null"
        for col in columns
    ])

    return "{\n  " + fields + "\n}"