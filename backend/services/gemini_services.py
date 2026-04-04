from openai import OpenAI
from dotenv import load_dotenv
from typing import List
import os
import json
import base64

load_dotenv()

from services.image_services import encode_image_url

client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

def _extract_invoice_data(image_base64: str, schema: str, model: str = "gemini-2.5-flash") -> dict:
    """Common extraction logic for invoice images"""

    prompt_text = f"""
    Ekstrak data dari nota/invoice pada gambar.

    WAJIB:
    - Kembalikan HANYA dalam format JSON
    - Jangan gunakan markdown (```json)
    - Jangan tambahkan penjelasan apapun
    - Pastikan JSON valid
    - Gunakan field SESUAI daftar berikut, jangan tambah field lain

    Struktur JSON:
    {schema}

    Jika suatu field tidak ditemukan, isi dengan null.
    """

    response = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "You are an AI that extracts structured data from invoices and returns JSON."
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt_text
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        temperature=0
    )

    raw_content = response.choices[0].message.content

    if not raw_content:
        raise ValueError("Response kosong dari AI")

    cleaned = raw_content.replace("```json", "").replace("```", "").strip()

    return json.loads(cleaned)

def extract_invoice_from_image(image_url: str, columns: List[str], model: str = "gemini-2.5-flash"):
    image_base64 = encode_image_url(image_url)
    schema = build_json_schema(columns)
    return _extract_invoice_data(image_base64, schema, model)

def extract_invoice_from_bytes(image_bytes: bytes, columns: List[str], model: str = "gemini-2.5-flash") -> dict:
    """Extract invoice data from uploaded file bytes"""
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    schema = build_json_schema(columns)
    return _extract_invoice_data(image_base64, schema, model)

def add_images(image_paths):
    pass

def build_json_schema(columns: List[str]) -> str:
    fields = ",\n  ".join([f"\"{col}\": string | number | null" for col in columns])
    return "{\n  " + fields + "\n}"
