from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

from services.image_services import encode_image_url

client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY"),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

def extract_invoice_from_image(image_url: str, model: str = "gemini-2.5-flash"):

    image_base64 = encode_image_url(image_url)

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
                        "text": "Ekstrak semua informasi dari nota/invoice pada gambar.\n\nWAJIB:\n- Kembalikan HANYA dalam format JSON\n- Jangan gunakan markdown (```json)\n- Jangan tambahkan penjelasan apapun\n- Pastikan JSON valid\n\nGunakan struktur JSON berikut:\n{\n  \"nama_nota\": string,\n  \"tanggal\": string,\n  \"nomor_nota\": string,\n  \"pemasok\": {\n    \"nama\": string,\n    \"alamat\": string,\n    \"kota\": string,\n    \"telepon\": string\n  },\n  \"daftar_barang\": [\n    {\n      \"no\": number,\n      \"nama_barang\": string,\n      \"jumlah\": number,\n      \"harga_satuan\": number,\n      \"total_harga_item\": number\n    }\n  ],\n  \"ringkasan_pembelian\": {\n    \"jumlah_pembelian\": number,\n    \"diskon_persen\": string,\n    \"diskon_jumlah\": number,\n    \"total_pembayaran\": number\n  },\n  \"metode_pembayaran\": string,\n  \"catatan\": string | null\n}\n\nJika suatu field tidak ditemukan, isi dengan null."
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

def add_images(image_paths):
    pass
