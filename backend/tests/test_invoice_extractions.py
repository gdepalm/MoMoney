from fastapi.testclient import TestClient
from sqlmodel import Session, select
import starlette.status
import asyncio

from domain.groups.entity import Group
from domain.invoices.entity import Invoice
from domain.invoice_extractions.entity import InvoiceExtraction
from domain.users.entity import User
from domain.invoice_extractions.routes import create_invoice_extraction

# 🔥 mock function
def mock_extract_invoice_from_image(image_url: str, columns: list[str], model: str):
    assert columns == ["nama barang", "tanggal beli", "Price"]
    return {
        "nama_nota": "NOTA TEST",
        "tanggal": "2026-03-17",
        "nomor_nota": "TEST-001",
        "pemasok": {"nama": "Test Supplier"},
        "daftar_barang": [],
        "ringkasan_pembelian": {},
        "metode_pembayaran": "Cash",
        "catatan": None
    }


def test_create_invoice_extraction(
    session: Session,
    test_user: User,
    authenticated_client: TestClient,
    monkeypatch
):
    # mock AI
    monkeypatch.setattr(
        "domain.invoice_extractions.routes.extract_invoice_from_image",
        mock_extract_invoice_from_image
    )

    group = Group(
        name="Extraction Group",
        owner_id=test_user.id,
        columns=["nama barang", "tanggal beli", "Price"],
    )
    session.add(group)
    session.commit()

    invoice = Invoice(
        group_id=group.id,
        data={},
        image_url="https://example.com/image.jpg"
    )
    session.add(invoice)
    session.commit()

    response = authenticated_client.post(
        f"/invoices/{invoice.id}/extractions"
    )
    data = response.json()

    assert response.status_code in [
        starlette.status.HTTP_200_OK,
        starlette.status.HTTP_201_CREATED
    ]
    assert data["invoice_id"] == invoice.id
    assert data["extracted_data"]["nama_nota"] == "NOTA TEST"


def test_create_invoice_extraction_replace_existing(
    session: Session,
    test_user: User,
    authenticated_client: TestClient,
    monkeypatch
):
    monkeypatch.setattr(
        "domain.invoice_extractions.routes.extract_invoice_from_image",
        mock_extract_invoice_from_image
    )

    group = Group(
        name="Replace Extraction",
        owner_id=test_user.id,
        columns=["nama barang", "tanggal beli", "Price"],
    )
    session.add(group)
    session.commit()

    invoice = Invoice(
        group_id=group.id,
        data={},
        image_url="https://example.com/image.jpg"
    )
    session.add(invoice)
    session.commit()

    # insert lama
    old_extraction = InvoiceExtraction(
        invoice_id=invoice.id,
        extracted_data={"old": True},
        model="old-model"
    )
    session.add(old_extraction)
    session.commit()

    # create baru (should delete old)
    response = authenticated_client.post(
        f"/invoices/{invoice.id}/extractions"
    )

    assert response.status_code == starlette.status.HTTP_200_OK

    # cek di DB cuma 1
    extractions = session.exec(
        select(InvoiceExtraction).where(
            InvoiceExtraction.invoice_id == invoice.id
        )
    ).all()

    assert len(extractions) == 1
    assert extractions[0].extracted_data["nama_nota"] == "NOTA TEST"


def test_read_invoice_extractions(
    session: Session,
    test_user: User,
    authenticated_client: TestClient
):
    group = Group(name="Read Extraction", owner_id=test_user.id, columns=[])
    session.add(group)
    session.commit()

    invoice = Invoice(
        group_id=group.id,
        data={},
        image_url="https://example.com/image.jpg"
    )
    session.add(invoice)
    session.commit()

    extraction = InvoiceExtraction(
        invoice_id=invoice.id,
        extracted_data={"nama_nota": "READ TEST"},
        model="test-model"
    )
    session.add(extraction)
    session.commit()

    response = authenticated_client.get(
        f"/invoices/{invoice.id}/extractions"
    )
    data = response.json()

    assert response.status_code == starlette.status.HTTP_200_OK
    assert len(data) == 1
    assert data[0]["extracted_data"]["nama_nota"] == "READ TEST"


def test_create_invoice_extraction_forbidden(
    session: Session,
    test_user: User,
    authenticated_client: TestClient,
    monkeypatch
):
    monkeypatch.setattr(
        "domain.invoice_extractions.routes.extract_invoice_from_image",
        mock_extract_invoice_from_image
    )

    # group milik orang lain
    group = Group(name="Forbidden", owner_id=9999, columns=[])
    session.add(group)
    session.commit()

    invoice = Invoice(
        group_id=group.id,
        data={},
        image_url="https://example.com/image.jpg"
    )
    session.add(invoice)
    session.commit()

    response = authenticated_client.post(
        f"/invoices/{invoice.id}/extractions"
    )

    assert response.status_code == starlette.status.HTTP_403_FORBIDDEN


def test_create_invoice_extraction_not_found(
    authenticated_client: TestClient
):
    response = authenticated_client.post(
        "/invoices/999999999/extractions"
    )

    assert response.status_code == starlette.status.HTTP_404_NOT_FOUND


def test_create_invoice_extraction_from_image_url_passes_group_columns(
    session: Session,
    test_user: User,
    monkeypatch
):
    captured = {}

    def mock_extract(image_url: str, columns: list[str], model: str):
        captured["image_url"] = image_url
        captured["columns"] = columns
        captured["model"] = model
        return {"nama barang": "Pakaian SD PR", "tanggal beli": "21 Juli 2022", "Price": 8500000}

    monkeypatch.setattr(
        "domain.invoice_extractions.routes.extract_invoice_from_image",
        mock_extract
    )

    group = Group(
        name="Direct Route Extraction",
        owner_id=test_user.id,
        columns=["nama barang", "tanggal beli", "Price"],
    )
    session.add(group)
    session.commit()

    invoice = Invoice(
        group_id=group.id,
        data={},
        image_url="https://example.com/direct.jpg"
    )
    session.add(invoice)
    session.commit()

    result = asyncio.run(
        create_invoice_extraction(
            invoice_id=invoice.id,
            file=None,
            session=session,
            current_user=test_user,
        )
    )

    assert captured == {
        "image_url": "https://example.com/direct.jpg",
        "columns": ["nama barang", "tanggal beli", "Price"],
        "model": "qwen2.5:1.5b",
    }
    assert result.extracted_data["Price"] == 8500000
