from fastapi.testclient import TestClient
from sqlmodel import Session
import starlette.status

from domain.groups.entity import Group
from domain.users.entity import User


def test_create_invoice(session: Session, test_user: User, authenticated_client: TestClient):
    group = Group(name="Invoices Group", owner_id=test_user.id,
                  columns=["date", "vendor", "total"])
    session.add(group)
    session.commit()

    response = authenticated_client.post(
        f"/groups/{group.id}/invoices",
        json={
            "data": {
                "date": "2026-03-16",
                "vendor": "Starbucks",
                "total": 5.50
            },
            "image_url": "https://example.com/receipt-1.jpg"
        }
    )
    data = response.json()

    assert response.status_code in [
        starlette.status.HTTP_200_OK, starlette.status.HTTP_201_CREATED]
    assert data["group_id"] == group.id
    assert data["data"]["vendor"] == "Starbucks"
    assert data["image_url"] == "https://example.com/receipt-1.jpg"


def test_update_invoice(session: Session, test_user: User, authenticated_client: TestClient):
    group = Group(name="Update Invoices", owner_id=test_user.id,
                  columns=["vendor", "total"])
    session.add(group)
    session.commit()

    create_response = authenticated_client.post(
        f"/groups/{group.id}/invoices",
        json={"data": {"vendor": "A", "total": 10}}
    )
    invoice_id = create_response.json()["id"]

    response = authenticated_client.patch(
        f"/invoices/{invoice_id}",
        json={"data": {"vendor": "B", "total": 12}}
    )
    data = response.json()

    assert response.status_code == starlette.status.HTTP_200_OK
    assert data["data"]["vendor"] == "B"
    assert data["data"]["total"] == 12


def test_delete_invoice(session: Session, test_user: User, authenticated_client: TestClient):
    group = Group(name="Delete Invoices", owner_id=test_user.id,
                  columns=["vendor", "total"])
    session.add(group)
    session.commit()

    create_response = authenticated_client.post(
        f"/groups/{group.id}/invoices",
        json={"data": {"vendor": "A", "total": 20}}
    )
    invoice_id = create_response.json()["id"]

    response = authenticated_client.delete(f"/invoices/{invoice_id}")
    assert response.status_code == starlette.status.HTTP_200_OK
    assert response.json()["ok"] is True


def test_read_group_includes_invoices(session: Session, test_user: User, authenticated_client: TestClient):
    group = Group(name="Read Group Invoices",
                  owner_id=test_user.id, columns=["vendor", "total"])
    session.add(group)
    session.commit()

    authenticated_client.post(
        f"/groups/{group.id}/invoices",
        json={"data": {"vendor": "Coffee Shop", "total": 8.5}}
    )

    response = authenticated_client.get(f"/groups/{group.id}")
    data = response.json()

    assert response.status_code == starlette.status.HTTP_200_OK
    assert "invoices" in data
    assert len(data["invoices"]) == 1
    assert data["invoices"][0]["data"]["vendor"] == "Coffee Shop"
