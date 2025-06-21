from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash
from typing import Optional, List

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        manager_id=user.manager_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_feedback(db: Session, feedback: schemas.FeedbackCreate, manager_id: int) -> models.Feedback:
    db_feedback = models.Feedback(
        employee_id=feedback.employee_id,
        manager_id=manager_id,
        strengths=feedback.strengths,
        areas_to_improve=feedback.areas_to_improve,
        sentiment=feedback.sentiment,
        is_anonymous=feedback.is_anonymous
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_feedback_for_employee(db: Session, employee_id: int) -> List[models.Feedback]:
    return db.query(models.Feedback).filter(models.Feedback.employee_id == employee_id).all()

def get_feedback_for_manager(db: Session, manager_id: int) -> List[models.Feedback]:
    return db.query(models.Feedback).filter(models.Feedback.manager_id == manager_id).all()

def get_feedback_by_id(db: Session, feedback_id: int) -> Optional[models.Feedback]:
    return db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()

def update_feedback(db: Session, feedback: models.Feedback, updates: schemas.FeedbackUpdate) -> models.Feedback:
    update_data = updates.dict(exclude_unset=True)

    is_content_update = "strengths" in update_data or \
                        "areas_to_improve" in update_data or \
                        "sentiment" in update_data

    # Apply content updates from the manager
    if "strengths" in update_data:
        feedback.strengths = update_data["strengths"]
    if "areas_to_improve" in update_data:
        feedback.areas_to_improve = update_data["areas_to_improve"]
    if "sentiment" in update_data:
        feedback.sentiment = update_data["sentiment"]
    
    # Handle the acknowledgment status
    if is_content_update:
        # If manager updated the content, force re-acknowledgment
        feedback.acknowledged = False
    elif "acknowledged" in update_data:
        # This case handles the acknowledgment from the employee
        feedback.acknowledged = update_data["acknowledged"]

    db.commit()
    db.refresh(feedback)
    return feedback

def create_notification(db: Session, user_id: int, message: str) -> models.Notification:
    db_notification = models.Notification(user_id=user_id, message=message)
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification

def get_notifications_for_user(db: Session, user_id: int) -> List[models.Notification]:
    return db.query(models.Notification).filter(models.Notification.user_id == user_id).order_by(models.Notification.created_at.desc()).all()

def mark_notification_as_read(db: Session, notification_id: int, user_id: int) -> Optional[models.Notification]:
    db_notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user_id
    ).first()
    
    if db_notification:
        db_notification.is_read = True
        db.commit()
        db.refresh(db_notification)
    
    return db_notification

# Peer Feedback CRUD operations
def create_peer_feedback(db: Session, feedback: schemas.PeerFeedbackCreate, from_employee_id: int) -> models.PeerFeedback:
    db_feedback = models.PeerFeedback(
        from_employee_id=from_employee_id,
        to_employee_id=feedback.to_employee_id,
        strengths=feedback.strengths,
        areas_to_improve=feedback.areas_to_improve,
        sentiment=feedback.sentiment,
        is_anonymous=feedback.is_anonymous
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def get_peer_feedback_for_employee(db: Session, employee_id: int) -> List[models.PeerFeedback]:
    return db.query(models.PeerFeedback).filter(models.PeerFeedback.to_employee_id == employee_id).all()

def get_peer_feedback_by_id(db: Session, feedback_id: int) -> Optional[models.PeerFeedback]:
    return db.query(models.PeerFeedback).filter(models.PeerFeedback.id == feedback_id).first()

def update_peer_feedback(db: Session, feedback: models.PeerFeedback, updates: schemas.PeerFeedbackUpdate) -> models.PeerFeedback:
    update_data = updates.dict(exclude_unset=True)
    
    if "strengths" in update_data:
        feedback.strengths = update_data["strengths"]
    if "areas_to_improve" in update_data:
        feedback.areas_to_improve = update_data["areas_to_improve"]
    if "sentiment" in update_data:
        feedback.sentiment = update_data["sentiment"]
    if "acknowledged" in update_data:
        feedback.acknowledged = update_data["acknowledged"]
    
    db.commit()
    db.refresh(feedback)
    return feedback

def get_team_members_for_peer_feedback(db: Session, employee_id: int) -> List[models.User]:
    """Get all employees in the same team (same manager) for peer feedback"""
    current_user = get_user_by_id(db, employee_id)
    if not current_user or not current_user.manager_id:
        return []
    
    return db.query(models.User).filter(
        models.User.manager_id == current_user.manager_id,
        models.User.id != employee_id,  # Exclude self
        models.User.role == models.RoleEnum.employee
    ).all()

# Comment CRUD operations
def create_comment(db: Session, comment: schemas.CommentCreate, employee_id: int) -> models.Comment:
    db_comment = models.Comment(
        feedback_id=comment.feedback_id,
        employee_id=employee_id,
        content=comment.content
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

def get_comments_for_feedback(db: Session, feedback_id: int) -> List[models.Comment]:
    return db.query(models.Comment).filter(models.Comment.feedback_id == feedback_id).order_by(models.Comment.created_at.asc()).all()

def get_comment_by_id(db: Session, comment_id: int) -> Optional[models.Comment]:
    return db.query(models.Comment).filter(models.Comment.id == comment_id).first()

def update_comment(db: Session, comment: models.Comment, updates: schemas.CommentUpdate) -> models.Comment:
    comment.content = updates.content
    db.commit()
    db.refresh(comment)
    return comment

def delete_comment(db: Session, comment_id: int, employee_id: int) -> bool:
    comment = db.query(models.Comment).filter(
        models.Comment.id == comment_id,
        models.Comment.employee_id == employee_id
    ).first()
    
    if comment:
        db.delete(comment)
        db.commit()
        return True
    return False

# Announcement CRUD operations
def create_announcement(db: Session, announcement: schemas.AnnouncementCreate, manager_id: int) -> models.Announcement:
    db_announcement = models.Announcement(
        manager_id=manager_id,
        title=announcement.title,
        content=announcement.content
    )
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

def get_announcements_for_team(db: Session, manager_id: int) -> List[models.Announcement]:
    """Get all active announcements for a manager's team"""
    return db.query(models.Announcement).filter(
        models.Announcement.manager_id == manager_id,
        models.Announcement.is_active == True
    ).order_by(models.Announcement.created_at.desc()).all()

def get_announcement_by_id(db: Session, announcement_id: int) -> Optional[models.Announcement]:
    return db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()

def update_announcement(db: Session, announcement: models.Announcement, updates: schemas.AnnouncementUpdate) -> models.Announcement:
    update_data = updates.dict(exclude_unset=True)
    
    if "title" in update_data:
        announcement.title = update_data["title"]
    if "content" in update_data:
        announcement.content = update_data["content"]
    if "is_active" in update_data:
        announcement.is_active = update_data["is_active"]
    
    db.commit()
    db.refresh(announcement)
    return announcement

def delete_announcement(db: Session, announcement_id: int, manager_id: int) -> bool:
    announcement = db.query(models.Announcement).filter(
        models.Announcement.id == announcement_id,
        models.Announcement.manager_id == manager_id
    ).first()
    
    if announcement:
        db.delete(announcement)
        db.commit()
        return True
    return False

def get_announcements_for_employee(db: Session, employee_id: int) -> List[models.Announcement]:
    """Get all active announcements for an employee based on their manager"""
    employee = get_user_by_id(db, employee_id)
    if not employee or not employee.manager_id:
        return []
    
    return db.query(models.Announcement).filter(
        models.Announcement.manager_id == employee.manager_id,
        models.Announcement.is_active == True
    ).order_by(models.Announcement.created_at.desc()).all()

# Document CRUD operations
def create_document(db: Session, document_data: dict, employee_id: int) -> models.Document:
    db_document = models.Document(
        employee_id=employee_id,
        title=document_data["title"],
        description=document_data.get("description"),
        filename=document_data["filename"],
        file_path=document_data["file_path"],
        file_size=document_data["file_size"],
        mime_type=document_data.get("mime_type", "application/pdf"),
        is_public=document_data.get("is_public", False)
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def get_documents_for_employee(db: Session, employee_id: int) -> List[models.Document]:
    """Get all documents uploaded by an employee"""
    return db.query(models.Document).filter(
        models.Document.employee_id == employee_id
    ).order_by(models.Document.created_at.desc()).all()

def get_public_documents_for_team(db: Session, manager_id: int) -> List[models.Document]:
    """Get all public documents from employees in a manager's team"""
    return db.query(models.Document).join(models.User).filter(
        models.User.manager_id == manager_id,
        models.Document.is_public == True
    ).order_by(models.Document.created_at.desc()).all()

def get_document_by_id(db: Session, document_id: int) -> Optional[models.Document]:
    return db.query(models.Document).filter(models.Document.id == document_id).first()

def update_document(db: Session, document: models.Document, updates: schemas.DocumentUpdate) -> models.Document:
    update_data = updates.dict(exclude_unset=True)
    
    if "title" in update_data:
        document.title = update_data["title"]
    if "description" in update_data:
        document.description = update_data["description"]
    if "is_public" in update_data:
        document.is_public = update_data["is_public"]
    
    db.commit()
    db.refresh(document)
    return document

def delete_document(db: Session, document_id: int, employee_id: int) -> bool:
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.employee_id == employee_id
    ).first()
    
    if document:
        db.delete(document)
        db.commit()
        return True
    return False 