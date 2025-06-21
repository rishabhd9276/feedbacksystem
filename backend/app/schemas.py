from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum
from datetime import datetime

class RoleEnum(str, Enum):
    manager = "manager"
    employee = "employee"

class SentimentEnum(str, Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum
    manager_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        orm_mode = True

class FeedbackBase(BaseModel):
    strengths: str
    areas_to_improve: str
    sentiment: SentimentEnum
    is_anonymous: Optional[bool] = False

class FeedbackCreate(FeedbackBase):
    employee_id: int

class FeedbackUpdate(BaseModel):
    strengths: Optional[str] = None
    areas_to_improve: Optional[str] = None
    sentiment: Optional[SentimentEnum] = None
    acknowledged: Optional[bool] = None
    is_anonymous: Optional[bool] = None

class FeedbackResponse(FeedbackBase):
    id: int
    employee_id: int
    manager_id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    acknowledged: bool
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class PeerFeedbackBase(BaseModel):
    strengths: str
    areas_to_improve: str
    sentiment: SentimentEnum
    is_anonymous: bool = False

class PeerFeedbackCreate(PeerFeedbackBase):
    to_employee_id: int

class PeerFeedbackUpdate(BaseModel):
    strengths: Optional[str] = None
    areas_to_improve: Optional[str] = None
    sentiment: Optional[SentimentEnum] = None
    acknowledged: Optional[bool] = None

class PeerFeedbackResponse(PeerFeedbackBase):
    id: int
    from_employee_id: Optional[int]  # None if anonymous
    to_employee_id: int
    created_at: Optional[datetime]
    acknowledged: bool
    from_employee_name: Optional[str]  # None if anonymous
    
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[RoleEnum] = None

class NotificationResponse(BaseModel):
    id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    feedback_id: int

class CommentUpdate(BaseModel):
    content: str

class CommentResponse(CommentBase):
    id: int
    feedback_id: int
    employee_id: int
    employee_name: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class AnnouncementBase(BaseModel):
    title: str
    content: str

class AnnouncementCreate(AnnouncementBase):
    pass

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None

class AnnouncementResponse(AnnouncementBase):
    id: int
    manager_id: int
    manager_name: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    is_active: bool
    
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_public: bool = False

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class DocumentResponse(DocumentBase):
    id: int
    employee_id: int
    employee_name: str
    filename: str
    file_size: int
    mime_type: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    
    class Config:
        orm_mode = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        } 