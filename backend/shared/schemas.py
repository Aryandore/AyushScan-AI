"""
Pydantic data models for AyushScan AI
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PatientInfo(BaseModel):
    """Patient demographic information - all fields optional"""
    name: Optional[str] = None
    age: Optional[int] = Field(None, gt=0, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    location: Optional[str] = None


class TriageRequest(BaseModel):
    """Request payload for triage analysis"""
    patient_info: Optional[PatientInfo] = None
    voice_transcript: str = Field(min_length=10)
    image_s3_key: Optional[str] = None
    rekognition_labels: Optional[List[str]] = None


class TriageResponse(BaseModel):
    """Response from triage analysis"""
    assessment_id: str
    triage_level: str = Field(pattern="^(GREEN|YELLOW|RED)$")
    confidence_score: float = Field(ge=0.0, le=1.0)
    symptoms_detected: List[str]
    primary_concern: str
    recommended_action: str
    urgency_reason: str
    follow_up_questions: List[str]
    timestamp: str


class ReportRequest(BaseModel):
    """Request to generate PDF report"""
    assessment_id: str


class ReportResponse(BaseModel):
    """Response with PDF download URL"""
    report_s3_url: str
    s3_key: str
    expires_in: int = 3600


class AssessmentRecord(BaseModel):
    """Complete assessment record for database storage"""
    assessment_id: str
    patient_info: Optional[PatientInfo] = None
    voice_transcript: str
    image_s3_key: Optional[str] = None
    rekognition_labels: Optional[List[str]] = None
    triage_level: str
    confidence_score: float
    symptoms_detected: List[str]
    primary_concern: str
    recommended_action: str
    urgency_reason: str
    follow_up_questions: List[str]
    timestamp: str
