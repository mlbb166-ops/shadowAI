from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class RegisterRequest(StrictModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=10, max_length=256)
    display_name: str = Field(min_length=1, max_length=120)
    accept_data_processing: bool

    @field_validator("accept_data_processing")
    @classmethod
    def consent_must_be_explicit(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Persetujuan pemrosesan data diperlukan")
        return value


class LoginRequest(StrictModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=256)


class ChildCreate(StrictModel):
    name: str = Field(min_length=1, max_length=120)
    birth_date: date | None = None
    sex: Literal["female", "male", "unspecified"] | None = None
    allergies: str = Field(default="", max_length=1000)
    notes: str = Field(default="", max_length=3000)

    @field_validator("birth_date")
    @classmethod
    def birth_not_future(cls, value: date | None) -> date | None:
        if value and value > date.today():
            raise ValueError("Tanggal lahir tidak boleh di masa depan")
        return value


class MeasurementCreate(StrictModel):
    child_id: str = Field(min_length=3, max_length=80)
    measured_at: datetime | None = None
    weight_kg: float | None = Field(default=None, gt=0, le=300)
    height_cm: float | None = Field(default=None, gt=0, le=250)
    head_circumference_cm: float | None = Field(default=None, gt=0, le=100)
    notes: str = Field(default="", max_length=2000)

    @model_validator(mode="after")
    def one_measurement(self):
        if self.weight_kg is None and self.height_cm is None and self.head_circumference_cm is None:
            raise ValueError("Isi minimal satu hasil pengukuran")
        return self


class ChatRequest(StrictModel):
    child_id: str | None = Field(default=None, max_length=80)
    message: str = Field(min_length=1, max_length=4000)
    channel: Literal["web", "telegram"] = "web"


class TelegramLinkCodeRequest(StrictModel):
    child_id: str | None = Field(default=None, min_length=3, max_length=80)
