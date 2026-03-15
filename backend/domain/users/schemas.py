from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
