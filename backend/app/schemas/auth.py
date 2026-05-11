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
    phone: str | None = None
    hasPassword: bool
    authProviders: list[str] = Field(default_factory=list)
    createdAt: datetime


class AuthResponse(StrictModel):
    user: CurrentUserResponse
    redirectUrl: str


class ProfileUpdateRequest(StrictModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=64)


class PasswordUpdateRequest(StrictModel):
    currentPassword: str = Field(min_length=1, max_length=255)
    newPassword: str = Field(min_length=8, max_length=255)
    confirmPassword: str = Field(min_length=8, max_length=255)
