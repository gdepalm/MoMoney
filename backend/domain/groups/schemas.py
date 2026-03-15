from pydantic import BaseModel, Field


class GroupResponse(BaseModel):
    name: str = Field(..., min_length=1)
    columns: list[str]
