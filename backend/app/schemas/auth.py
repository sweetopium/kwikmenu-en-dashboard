from __future__ import annotations

from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.menu import StrictModel


class RegisterRequest(StrictModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=255)
    confirmPassword: str = Field(min_length=8, max_length=255)


class LoginRequest(StrictModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=255)


class CurrentUserResponse(StrictModel):
    id: str
    email: EmailStr
    name: str
    createdAt: datetime


class AuthResponse(StrictModel):
    user: CurrentUserResponse
    redirectUrl: str
