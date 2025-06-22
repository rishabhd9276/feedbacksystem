from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, crud, auth, deps, database
from datetime import timedelta, datetime
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import os
import shutil
from fastapi import UploadFile, File, Form
from pathlib import Path

app = FastAPI()

# Define your allowed origins
origins = [
    "http://localhost:5173",  # Your local dev environment
    "https://feedbacksystem.onrender.com", # Your live backend URL
    "https://feedback-frontend.onrender.com", # Your live frontend URL
    # You can add more URLs here if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def startup():
    database.init_db()

@app.on_event("startup")
def on_startup():
    startup()

@app.get("/")
def read_root():
    return {"message": "Feedback System API"}

# --- Auth Endpoints ---
@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = crud.get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, user)

@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token = auth.create_access_token(
        data={"user_id": user.id, "role": user.role},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- User Endpoints ---
@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(deps.get_current_user)):
    return current_user

@app.get("/users/team", response_model=List[schemas.UserResponse])
def get_team(current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    return db.query(models.User).filter(models.User.manager_id == current_user.id).all()

# --- Feedback Endpoints ---
@app.post("/feedback/", response_model=schemas.FeedbackResponse)
def submit_feedback(feedback: schemas.FeedbackCreate, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    return crud.create_feedback(db, feedback, manager_id=current_user.id)

@app.get("/feedback/employee/{employee_id}", response_model=List[schemas.FeedbackResponse])
def get_feedback_for_employee(employee_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    # Employee can only see their own feedback; manager can see their team
    if current_user.role == schemas.RoleEnum.employee and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == schemas.RoleEnum.manager:
        employee = crud.get_user_by_id(db, employee_id)
        if not employee or employee.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_feedback_for_employee(db, employee_id)

@app.patch("/feedback/{feedback_id}", response_model=schemas.FeedbackResponse)
def update_feedback(feedback_id: int, updates: schemas.FeedbackUpdate, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    feedback = crud.get_feedback_by_id(db, feedback_id)
    if not feedback or feedback.manager_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feedback not found or not authorized")
    return crud.update_feedback(db, feedback, updates)

@app.post("/feedback/{feedback_id}/acknowledge", response_model=schemas.FeedbackResponse)
def acknowledge_feedback(feedback_id: int, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    feedback = crud.get_feedback_by_id(db, feedback_id)
    if not feedback or feedback.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feedback not found or not authorized")
    updates = schemas.FeedbackUpdate(acknowledged=True)
    return crud.update_feedback(db, feedback, updates)

# --- Notification Endpoints ---

@app.post("/feedback/request", status_code=status.HTTP_201_CREATED)
def request_feedback(current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    if not current_user.manager_id:
        raise HTTPException(status_code=400, detail="You do not have a manager assigned.")
    
    message = f"Employee '{current_user.name}' has requested feedback."
    crud.create_notification(db, user_id=current_user.manager_id, message=message)
    
    return {"message": "Feedback request sent successfully."}

@app.get("/notifications", response_model=List[schemas.NotificationResponse])
def read_notifications(current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    return crud.get_notifications_for_user(db, user_id=current_user.id)

@app.post("/notifications/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_read(notification_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    notification = crud.mark_notification_as_read(db, notification_id=notification_id, user_id=current_user.id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return notification

# --- Dashboard Endpoints ---
@app.get("/dashboard/manager")
def manager_dashboard(current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    team = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    feedbacks = crud.get_feedback_for_manager(db, current_user.id)
    sentiment_counts = {s.value: 0 for s in schemas.SentimentEnum}
    for fb in feedbacks:
        sentiment_counts[fb.sentiment.value] += 1
    return {
        "team_size": len(team),
        "feedback_count": len(feedbacks),
        "sentiment_trends": sentiment_counts
    }

@app.get("/dashboard/employee")
def employee_dashboard(current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    feedbacks = crud.get_feedback_for_employee(db, current_user.id)
    return {
        "feedback_timeline": [
            {
                "id": fb.id,
                "sentiment": fb.sentiment.value,
                "created_at": fb.created_at,
                "acknowledged": fb.acknowledged,
                "strengths": fb.strengths,
                "areas_to_improve": fb.areas_to_improve,
            } for fb in feedbacks
        ]
    }

def generate_feedback_pdf(employee_name: str, feedbacks: List[models.Feedback]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph(f"Feedback Report for: {employee_name}", styles['h1']))
    story.append(Spacer(1, 12))

    for fb in feedbacks:
        story.append(Paragraph(f"<b>Date:</b> {fb.created_at.strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        if fb.updated_at and fb.updated_at > fb.created_at:
            story.append(Paragraph(f"<b>Last Updated:</b> {fb.updated_at.strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        story.append(Paragraph(f"<b>Sentiment:</b> {fb.sentiment.value.capitalize()}", styles['Normal']))
        story.append(Spacer(1, 12))
        
        story.append(Paragraph("<b>Strengths:</b>", styles['h3']))
        story.append(Paragraph(fb.strengths, styles['BodyText']))
        story.append(Spacer(1, 12))

        story.append(Paragraph("<b>Areas to Improve:</b>", styles['h3']))
        story.append(Paragraph(fb.areas_to_improve, styles['BodyText']))
        story.append(Spacer(1, 24))

    doc.build(story)
    buffer.seek(0)
    return buffer

@app.get("/feedback/{feedback_id}/export", response_class=StreamingResponse)
def export_single_feedback_as_pdf(feedback_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    feedback = crud.get_feedback_by_id(db, feedback_id)

    # Authorization Check
    is_owner = feedback.employee_id == current_user.id
    is_manager = current_user.role == schemas.RoleEnum.manager and feedback.manager_id == current_user.id
    
    if not feedback or not (is_owner or is_manager):
        raise HTTPException(status_code=404, detail="Feedback not found or not authorized")

    employee = crud.get_user_by_id(db, feedback.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found.")

    pdf_buffer = generate_feedback_pdf(employee.name, [feedback])
    
    headers = {
        'Content-Disposition': f'attachment; filename="feedback_{feedback.id}_for_{employee.name.replace(" ", "_")}.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type='application/pdf', headers=headers)

@app.get("/feedback/employee/{employee_id}/export", response_class=StreamingResponse)
def export_all_feedback_as_pdf(employee_id: int, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    employee = crud.get_user_by_id(db, employee_id)
    if not employee or employee.manager_id != current_user.id:
        raise HTTPException(status_code=404, detail="Employee not found or not in your team.")

    feedbacks = crud.get_feedback_for_employee(db, employee_id)
    if not feedbacks:
        raise HTTPException(status_code=404, detail="No feedback found for this employee.")

    pdf_buffer = generate_feedback_pdf(employee.name, feedbacks)
    
    headers = {
        'Content-Disposition': f'attachment; filename="feedback_report_{employee.name.replace(" ", "_")}.pdf"'
    }
    return StreamingResponse(pdf_buffer, media_type='application/pdf', headers=headers)

# --- Peer Feedback Endpoints ---
@app.post("/peer-feedback/", response_model=schemas.PeerFeedbackResponse)
def submit_peer_feedback(feedback: schemas.PeerFeedbackCreate, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    # Check if the target employee is in the same team
    target_employee = crud.get_user_by_id(db, feedback.to_employee_id)
    if not target_employee or target_employee.manager_id != current_user.manager_id:
        raise HTTPException(status_code=400, detail="Can only give feedback to team members")
    
    if target_employee.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot give feedback to yourself")
    
    db_feedback = crud.create_peer_feedback(db, feedback, from_employee_id=current_user.id)
    
    # Format the response properly
    response_data = {
        "id": db_feedback.id,
        "to_employee_id": db_feedback.to_employee_id,
        "created_at": db_feedback.created_at,
        "acknowledged": db_feedback.acknowledged,
        "strengths": db_feedback.strengths,
        "areas_to_improve": db_feedback.areas_to_improve,
        "sentiment": db_feedback.sentiment,
        "is_anonymous": db_feedback.is_anonymous
    }
    
    if db_feedback.is_anonymous:
        response_data["from_employee_id"] = None
        response_data["from_employee_name"] = None
    else:
        response_data["from_employee_id"] = db_feedback.from_employee_id
        response_data["from_employee_name"] = current_user.name
    
    return response_data

@app.get("/peer-feedback/received", response_model=List[schemas.PeerFeedbackResponse])
def get_received_peer_feedback(current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    feedbacks = crud.get_peer_feedback_for_employee(db, current_user.id)
    
    # Convert to response format, handling anonymous feedback
    response_feedbacks = []
    for fb in feedbacks:
        response_data = {
            "id": fb.id,
            "to_employee_id": fb.to_employee_id,
            "created_at": fb.created_at,
            "acknowledged": fb.acknowledged,
            "strengths": fb.strengths,
            "areas_to_improve": fb.areas_to_improve,
            "sentiment": fb.sentiment,
            "is_anonymous": fb.is_anonymous
        }
        
        if fb.is_anonymous:
            response_data["from_employee_id"] = None
            response_data["from_employee_name"] = None
        else:
            response_data["from_employee_id"] = fb.from_employee_id
            response_data["from_employee_name"] = fb.from_employee.name
        
        response_feedbacks.append(response_data)
    
    return response_feedbacks

@app.get("/peer-feedback/team-members", response_model=List[schemas.UserResponse])
def get_team_members_for_feedback(current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    return crud.get_team_members_for_peer_feedback(db, current_user.id)

@app.post("/peer-feedback/{feedback_id}/acknowledge", response_model=schemas.PeerFeedbackResponse)
def acknowledge_peer_feedback(feedback_id: int, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    feedback = crud.get_peer_feedback_by_id(db, feedback_id)
    if not feedback or feedback.to_employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feedback not found or not authorized")
    
    updates = schemas.PeerFeedbackUpdate(acknowledged=True)
    return crud.update_peer_feedback(db, feedback, updates)

# --- Comment Endpoints ---
@app.post("/comments/", response_model=schemas.CommentResponse)
def create_comment(comment: schemas.CommentCreate, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    # Verify the feedback exists and belongs to the current user
    feedback = crud.get_feedback_by_id(db, comment.feedback_id)
    if not feedback or feedback.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Feedback not found or not authorized")
    
    db_comment = crud.create_comment(db, comment, current_user.id)
    
    # Send notification to the manager with comment preview
    comment_preview = comment.content[:100] + "..." if len(comment.content) > 100 else comment.content
    notification_message = f"Employee '{current_user.name}' has commented on feedback #{feedback.id}: \"{comment_preview}\""
    crud.create_notification(db, user_id=feedback.manager_id, message=notification_message)
    
    # Format response
    return {
        "id": db_comment.id,
        "feedback_id": db_comment.feedback_id,
        "employee_id": db_comment.employee_id,
        "employee_name": current_user.name,
        "content": db_comment.content,
        "created_at": db_comment.created_at,
        "updated_at": db_comment.updated_at
    }

@app.get("/comments/feedback/{feedback_id}", response_model=List[schemas.CommentResponse])
def get_comments_for_feedback(feedback_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    # Verify the feedback exists and user has access
    feedback = crud.get_feedback_by_id(db, feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    # Check authorization: employee can see their own feedback comments, manager can see their team's feedback comments
    if current_user.role == schemas.RoleEnum.employee and feedback.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == schemas.RoleEnum.manager and feedback.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    comments = crud.get_comments_for_feedback(db, feedback_id)
    
    # Format response
    response_comments = []
    for comment in comments:
        employee = crud.get_user_by_id(db, comment.employee_id)
        response_comments.append({
            "id": comment.id,
            "feedback_id": comment.feedback_id,
            "employee_id": comment.employee_id,
            "employee_name": employee.name if employee else "Unknown",
            "content": comment.content,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at
        })
    
    return response_comments

@app.put("/comments/{comment_id}", response_model=schemas.CommentResponse)
def update_comment(comment_id: int, updates: schemas.CommentUpdate, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    comment = crud.get_comment_by_id(db, comment_id)
    if not comment or comment.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    
    updated_comment = crud.update_comment(db, comment, updates)
    
    # Send notification to the manager about the comment update
    feedback = crud.get_feedback_by_id(db, comment.feedback_id)
    if feedback:
        comment_preview = updates.content[:100] + "..." if len(updates.content) > 100 else updates.content
        notification_message = f"Employee '{current_user.name}' has updated their comment on feedback #{feedback.id}: \"{comment_preview}\""
        crud.create_notification(db, user_id=feedback.manager_id, message=notification_message)
    
    # Format response
    return {
        "id": updated_comment.id,
        "feedback_id": updated_comment.feedback_id,
        "employee_id": updated_comment.employee_id,
        "employee_name": current_user.name,
        "content": updated_comment.content,
        "created_at": updated_comment.created_at,
        "updated_at": updated_comment.updated_at
    }

@app.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    comment = crud.get_comment_by_id(db, comment_id)
    if not comment or comment.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    
    # Get feedback info before deleting the comment
    feedback = crud.get_feedback_by_id(db, comment.feedback_id)
    
    success = crud.delete_comment(db, comment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found or not authorized")
    
    # Send notification to the manager about the comment deletion
    if feedback:
        notification_message = f"Employee '{current_user.name}' has deleted their comment on feedback #{feedback.id}."
        crud.create_notification(db, user_id=feedback.manager_id, message=notification_message)
    
    return {"message": "Comment deleted successfully"}

# --- Announcement Endpoints ---
@app.post("/announcements/", response_model=schemas.AnnouncementResponse)
def create_announcement(announcement: schemas.AnnouncementCreate, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    db_announcement = crud.create_announcement(db, announcement, manager_id=current_user.id)
    
    # Send notifications to all team members about the new announcement
    team_members = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
    for member in team_members:
        notification_message = f"New announcement from {current_user.name}: {announcement.title}"
        crud.create_notification(db, user_id=member.id, message=notification_message)
    
    # Format response
    return {
        "id": db_announcement.id,
        "manager_id": db_announcement.manager_id,
        "manager_name": current_user.name,
        "title": db_announcement.title,
        "content": db_announcement.content,
        "created_at": db_announcement.created_at,
        "updated_at": db_announcement.updated_at,
        "is_active": db_announcement.is_active
    }

@app.get("/announcements/team", response_model=List[schemas.AnnouncementResponse])
def get_team_announcements(current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    announcements = crud.get_announcements_for_team(db, current_user.id)
    
    # Format response
    response_announcements = []
    for announcement in announcements:
        response_announcements.append({
            "id": announcement.id,
            "manager_id": announcement.manager_id,
            "manager_name": current_user.name,
            "title": announcement.title,
            "content": announcement.content,
            "created_at": announcement.created_at,
            "updated_at": announcement.updated_at,
            "is_active": announcement.is_active
        })
    
    return response_announcements

@app.get("/announcements/my", response_model=List[schemas.AnnouncementResponse])
def get_my_announcements(current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    announcements = crud.get_announcements_for_employee(db, current_user.id)
    
    # Format response
    response_announcements = []
    for announcement in announcements:
        manager = crud.get_user_by_id(db, announcement.manager_id)
        response_announcements.append({
            "id": announcement.id,
            "manager_id": announcement.manager_id,
            "manager_name": manager.name if manager else "Unknown Manager",
            "title": announcement.title,
            "content": announcement.content,
            "created_at": announcement.created_at,
            "updated_at": announcement.updated_at,
            "is_active": announcement.is_active
        })
    
    return response_announcements

@app.get("/announcements/{announcement_id}", response_model=schemas.AnnouncementResponse)
def get_announcement(announcement_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    announcement = crud.get_announcement_by_id(db, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Check authorization: employees can only see announcements from their manager
    if current_user.role == schemas.RoleEnum.employee:
        if announcement.manager_id != current_user.manager_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this announcement")
    # Managers can only see their own announcements
    elif current_user.role == schemas.RoleEnum.manager:
        if announcement.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this announcement")
    
    manager = crud.get_user_by_id(db, announcement.manager_id)
    return {
        "id": announcement.id,
        "manager_id": announcement.manager_id,
        "manager_name": manager.name if manager else "Unknown Manager",
        "title": announcement.title,
        "content": announcement.content,
        "created_at": announcement.created_at,
        "updated_at": announcement.updated_at,
        "is_active": announcement.is_active
    }

@app.patch("/announcements/{announcement_id}", response_model=schemas.AnnouncementResponse)
def update_announcement(announcement_id: int, updates: schemas.AnnouncementUpdate, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    announcement = crud.get_announcement_by_id(db, announcement_id)
    if not announcement or announcement.manager_id != current_user.id:
        raise HTTPException(status_code=404, detail="Announcement not found or not authorized")
    
    updated_announcement = crud.update_announcement(db, announcement, updates)
    
    # Send notifications to team members if the announcement was updated
    if "title" in updates.dict(exclude_unset=True) or "content" in updates.dict(exclude_unset=True):
        team_members = db.query(models.User).filter(models.User.manager_id == current_user.id).all()
        for member in team_members:
            notification_message = f"Announcement updated by {current_user.name}: {updated_announcement.title}"
            crud.create_notification(db, user_id=member.id, message=notification_message)
    
    return {
        "id": updated_announcement.id,
        "manager_id": updated_announcement.manager_id,
        "manager_name": current_user.name,
        "title": updated_announcement.title,
        "content": updated_announcement.content,
        "created_at": updated_announcement.created_at,
        "updated_at": updated_announcement.updated_at,
        "is_active": updated_announcement.is_active
    }

@app.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: int, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    announcement = crud.get_announcement_by_id(db, announcement_id)
    if not announcement or announcement.manager_id != current_user.id:
        raise HTTPException(status_code=404, detail="Announcement not found or not authorized")
    
    success = crud.delete_announcement(db, announcement_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Announcement not found or not authorized")
    
    return {"message": "Announcement deleted successfully"}

# --- Document Endpoints ---

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/documents/upload", response_model=schemas.DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    is_public: bool = Form(False),
    current_user: models.User = Depends(deps.get_current_employee),
    db: Session = Depends(database.get_db)
):
    # Validate file type
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Validate file size (max 10MB)
    if file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 10MB")
    
    # Create unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{current_user.id}_{timestamp}_{file.filename}"
    file_path = UPLOAD_DIR / filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to save file")
    
    # Create document record
    document_data = {
        "title": title,
        "description": description,
        "filename": filename,
        "file_path": str(file_path),
        "file_size": file.size,
        "mime_type": file.content_type,
        "is_public": is_public
    }
    
    db_document = crud.create_document(db, document_data, current_user.id)
    
    # Send notification to manager if document is public
    if is_public and current_user.manager_id:
        notification_message = f"Employee '{current_user.name}' has uploaded a new document: {title}"
        crud.create_notification(db, user_id=current_user.manager_id, message=notification_message)
    
    return {
        "id": db_document.id,
        "employee_id": db_document.employee_id,
        "employee_name": current_user.name,
        "title": db_document.title,
        "description": db_document.description,
        "filename": db_document.filename,
        "file_size": db_document.file_size,
        "mime_type": db_document.mime_type,
        "is_public": db_document.is_public,
        "created_at": db_document.created_at,
        "updated_at": db_document.updated_at
    }

@app.get("/documents/my", response_model=List[schemas.DocumentResponse])
def get_my_documents(current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    documents = crud.get_documents_for_employee(db, current_user.id)
    
    response_documents = []
    for document in documents:
        response_documents.append({
            "id": document.id,
            "employee_id": document.employee_id,
            "employee_name": current_user.name,
            "title": document.title,
            "description": document.description,
            "filename": document.filename,
            "file_size": document.file_size,
            "mime_type": document.mime_type,
            "is_public": document.is_public,
            "created_at": document.created_at,
            "updated_at": document.updated_at
        })
    
    return response_documents

@app.get("/documents/team", response_model=List[schemas.DocumentResponse])
def get_team_documents(current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    documents = crud.get_public_documents_for_team(db, current_user.id)
    
    response_documents = []
    for document in documents:
        employee = crud.get_user_by_id(db, document.employee_id)
        response_documents.append({
            "id": document.id,
            "employee_id": document.employee_id,
            "employee_name": employee.name if employee else "Unknown Employee",
            "title": document.title,
            "description": document.description,
            "filename": document.filename,
            "file_size": document.file_size,
            "mime_type": document.mime_type,
            "is_public": document.is_public,
            "created_at": document.created_at,
            "updated_at": document.updated_at
        })
    
    return response_documents

@app.get("/documents/{document_id}", response_model=schemas.DocumentResponse)
def get_document(document_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    document = crud.get_document_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check authorization
    if current_user.role == schemas.RoleEnum.employee:
        if document.employee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this document")
    elif current_user.role == schemas.RoleEnum.manager:
        if not document.is_public:
            raise HTTPException(status_code=403, detail="Document is not public")
        employee = crud.get_user_by_id(db, document.employee_id)
        if not employee or employee.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this document")
    
    employee = crud.get_user_by_id(db, document.employee_id)
    return {
        "id": document.id,
        "employee_id": document.employee_id,
        "employee_name": employee.name if employee else "Unknown Employee",
        "title": document.title,
        "description": document.description,
        "filename": document.filename,
        "file_size": document.file_size,
        "mime_type": document.mime_type,
        "is_public": document.is_public,
        "created_at": document.created_at,
        "updated_at": document.updated_at
    }

@app.get("/documents/{document_id}/download")
def download_document(document_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    document = crud.get_document_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check authorization
    if current_user.role == schemas.RoleEnum.employee:
        if document.employee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this document")
    elif current_user.role == schemas.RoleEnum.manager:
        if not document.is_public:
            raise HTTPException(status_code=403, detail="Document is not public")
        employee = crud.get_user_by_id(db, document.employee_id)
        if not employee or employee.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this document")
    
    # Check if file exists
    file_path = Path(document.file_path)
    if not file_path.exists():
        print(f"File not found: {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        # Read file content
        with open(file_path, "rb") as file:
            content = file.read()
        
        if not content:
            raise HTTPException(status_code=404, detail="File is empty")
        
        print(f"File read successfully: {file_path}, size: {len(content)} bytes")
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type=document.mime_type,
            headers={
                "Content-Disposition": f"attachment; filename={document.filename}",
                "Content-Length": str(len(content))
            }
        )
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        raise HTTPException(status_code=500, detail="Failed to read file")

@app.patch("/documents/{document_id}", response_model=schemas.DocumentResponse)
def update_document(document_id: int, updates: schemas.DocumentUpdate, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    document = crud.get_document_by_id(db, document_id)
    if not document or document.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found or not authorized")
    
    updated_document = crud.update_document(db, document, updates)
    
    # Send notification to manager if document is now public
    if updates.is_public and not document.is_public and current_user.manager_id:
        notification_message = f"Employee '{current_user.name}' has made their document public: {updated_document.title}"
        crud.create_notification(db, user_id=current_user.manager_id, message=notification_message)
    
    return {
        "id": updated_document.id,
        "employee_id": updated_document.employee_id,
        "employee_name": current_user.name,
        "title": updated_document.title,
        "description": updated_document.description,
        "filename": updated_document.filename,
        "file_size": updated_document.file_size,
        "mime_type": updated_document.mime_type,
        "is_public": updated_document.is_public,
        "created_at": updated_document.created_at,
        "updated_at": updated_document.updated_at
    }

@app.delete("/documents/{document_id}")
def delete_document(document_id: int, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    document = crud.get_document_by_id(db, document_id)
    if not document or document.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Document not found or not authorized")
    
    # Delete file from filesystem
    file_path = Path(document.file_path)
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Failed to delete file: {e}")
    
    success = crud.delete_document(db, document_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found or not authorized")
    
    return {"message": "Document deleted successfully"}

# --- Assignment Endpoints ---
@app.post("/assignments/upload", response_model=schemas.AssignmentResponse)
async def upload_assignment(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    due_date: str = Form(None),
    current_user: models.User = Depends(deps.get_current_manager),
    db: Session = Depends(database.get_db)
):
    # Validate file type
    allowed_types = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                     "text/plain", "image/jpeg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Validate file size (10MB limit)
    if file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/assignments")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = upload_dir / filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Parse due date if provided
    parsed_due_date = None
    if due_date:
        try:
            parsed_due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid due date format")
    
    # Create assignment record
    assignment_data = {
        "title": title,
        "description": description,
        "filename": filename,
        "file_path": str(file_path),
        "file_size": file.size,
        "mime_type": file.content_type,
        "due_date": parsed_due_date
    }
    
    db_assignment = crud.create_assignment(db, assignment_data, current_user.id)
    
    # Create notifications for all employees in the team
    employees = crud.get_employees_by_manager(db, current_user.id)
    for employee in employees:
        notification_message = f"New assignment uploaded: '{title}'"
        crud.create_notification(db, user_id=employee.id, message=notification_message)
    
    return {
        "id": db_assignment.id,
        "manager_id": db_assignment.manager_id,
        "manager_name": current_user.name,
        "title": db_assignment.title,
        "description": db_assignment.description,
        "filename": db_assignment.filename,
        "file_size": db_assignment.file_size,
        "mime_type": db_assignment.mime_type,
        "due_date": db_assignment.due_date,
        "created_at": db_assignment.created_at,
        "updated_at": db_assignment.updated_at,
        "is_active": db_assignment.is_active,
        "submission_count": 0
    }

@app.get("/assignments/team", response_model=List[schemas.AssignmentResponse])
def get_team_assignments(current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    assignments = crud.get_assignments_for_team(db, current_user.id)
    
    response_assignments = []
    for assignment in assignments:
        # Count submissions for this assignment
        submissions = crud.get_submissions_for_assignment(db, assignment.id)
        
        response_assignments.append({
            "id": assignment.id,
            "manager_id": assignment.manager_id,
            "manager_name": current_user.name,
            "title": assignment.title,
            "description": assignment.description,
            "filename": assignment.filename,
            "file_size": assignment.file_size,
            "mime_type": assignment.mime_type,
            "due_date": assignment.due_date,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at,
            "is_active": assignment.is_active,
            "submission_count": len(submissions)
        })
    
    return response_assignments

@app.get("/assignments/my", response_model=List[schemas.AssignmentResponse])
def get_my_assignments(current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    assignments = crud.get_assignments_for_employee(db, current_user.id)
    
    response_assignments = []
    for assignment in assignments:
        manager = crud.get_user_by_id(db, assignment.manager_id)
        response_assignments.append({
            "id": assignment.id,
            "manager_id": assignment.manager_id,
            "manager_name": manager.name if manager else "Unknown Manager",
            "title": assignment.title,
            "description": assignment.description,
            "filename": assignment.filename,
            "file_size": assignment.file_size,
            "mime_type": assignment.mime_type,
            "due_date": assignment.due_date,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at,
            "is_active": assignment.is_active,
            "submission_count": 0  # Employees don't see submission count
        })
    
    return response_assignments

@app.get("/assignments/{assignment_id}", response_model=schemas.AssignmentResponse)
def get_assignment(assignment_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check authorization
    if current_user.role == schemas.RoleEnum.employee:
        if assignment.manager_id != current_user.manager_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
    elif current_user.role == schemas.RoleEnum.manager:
        if assignment.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
    
    manager = crud.get_user_by_id(db, assignment.manager_id)
    submissions = crud.get_submissions_for_assignment(db, assignment.id)
    
    return {
        "id": assignment.id,
        "manager_id": assignment.manager_id,
        "manager_name": manager.name if manager else "Unknown Manager",
        "title": assignment.title,
        "description": assignment.description,
        "filename": assignment.filename,
        "file_size": assignment.file_size,
        "mime_type": assignment.mime_type,
        "due_date": assignment.due_date,
        "created_at": assignment.created_at,
        "updated_at": assignment.updated_at,
        "is_active": assignment.is_active,
        "submission_count": len(submissions) if current_user.role == schemas.RoleEnum.manager else 0
    }

@app.get("/assignments/{assignment_id}/download")
def download_assignment(assignment_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check authorization
    if current_user.role == schemas.RoleEnum.employee:
        if assignment.manager_id != current_user.manager_id:
            raise HTTPException(status_code=403, detail="Not authorized to download this assignment")
    elif current_user.role == schemas.RoleEnum.manager:
        if assignment.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this assignment")
    
    # Check if file exists
    file_path = Path(assignment.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(file_path, "rb") as file:
            content = file.read()
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type=assignment.mime_type,
            headers={
                "Content-Disposition": f"attachment; filename={assignment.filename}",
                "Content-Length": str(len(content))
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to read file")

@app.patch("/assignments/{assignment_id}", response_model=schemas.AssignmentResponse)
def update_assignment(assignment_id: int, updates: schemas.AssignmentUpdate, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment or assignment.manager_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
    
    updated_assignment = crud.update_assignment(db, assignment, updates)
    manager = crud.get_user_by_id(db, assignment.manager_id)
    submissions = crud.get_submissions_for_assignment(db, assignment.id)
    
    return {
        "id": updated_assignment.id,
        "manager_id": updated_assignment.manager_id,
        "manager_name": manager.name if manager else "Unknown Manager",
        "title": updated_assignment.title,
        "description": updated_assignment.description,
        "filename": updated_assignment.filename,
        "file_size": updated_assignment.file_size,
        "mime_type": updated_assignment.mime_type,
        "due_date": updated_assignment.due_date,
        "created_at": updated_assignment.created_at,
        "updated_at": updated_assignment.updated_at,
        "is_active": updated_assignment.is_active,
        "submission_count": len(submissions)
    }

@app.delete("/assignments/{assignment_id}")
def delete_assignment(assignment_id: int, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment or assignment.manager_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
    
    # Delete file from filesystem
    file_path = Path(assignment.file_path)
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Failed to delete file: {e}")
    
    success = crud.delete_assignment(db, assignment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
    
    return {"message": "Assignment deleted successfully"}

# --- Submission Endpoints ---
@app.post("/submissions/upload", response_model=schemas.SubmissionResponse)
async def upload_submission(
    file: UploadFile = File(...),
    assignment_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    current_user: models.User = Depends(deps.get_current_employee),
    db: Session = Depends(database.get_db)
):
    # Validate file type
    allowed_types = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                     "text/plain", "image/jpeg", "image/png", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Validate file size (10MB limit)
    if file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    # Verify assignment exists and employee has access
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if assignment.manager_id != current_user.manager_id:
        raise HTTPException(status_code=403, detail="Not authorized to submit to this assignment")
    
    # Check if employee already submitted
    existing_submission = crud.get_submission_by_employee_and_assignment(db, current_user.id, assignment_id)
    if existing_submission:
        raise HTTPException(status_code=400, detail="You have already submitted for this assignment")
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/submissions")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = upload_dir / filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create submission record
    submission_data = {
        "assignment_id": assignment_id,
        "title": title,
        "description": description,
        "filename": filename,
        "file_path": str(file_path),
        "file_size": file.size,
        "mime_type": file.content_type
    }
    
    db_submission = crud.create_submission(db, submission_data, current_user.id)
    
    # Create notification for manager
    notification_message = f"Employee '{current_user.name}' has submitted work for assignment: '{assignment.title}'"
    crud.create_notification(db, user_id=assignment.manager_id, message=notification_message)
    
    return {
        "id": db_submission.id,
        "assignment_id": db_submission.assignment_id,
        "employee_id": db_submission.employee_id,
        "employee_name": current_user.name,
        "title": db_submission.title,
        "description": db_submission.description,
        "filename": db_submission.filename,
        "file_size": db_submission.file_size,
        "mime_type": db_submission.mime_type,
        "submitted_at": db_submission.submitted_at,
        "updated_at": db_submission.updated_at
    }

@app.get("/submissions/assignment/{assignment_id}", response_model=List[schemas.SubmissionResponse])
def get_submissions_for_assignment(assignment_id: int, current_user: models.User = Depends(deps.get_current_manager), db: Session = Depends(database.get_db)):
    # Verify assignment exists and manager has access
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment or assignment.manager_id != current_user.id:
        raise HTTPException(status_code=404, detail="Assignment not found or not authorized")
    
    submissions = crud.get_submissions_for_assignment(db, assignment_id)
    
    response_submissions = []
    for submission in submissions:
        employee = crud.get_user_by_id(db, submission.employee_id)
        response_submissions.append({
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "employee_id": submission.employee_id,
            "employee_name": employee.name if employee else "Unknown Employee",
            "title": submission.title,
            "description": submission.description,
            "filename": submission.filename,
            "file_size": submission.file_size,
            "mime_type": submission.mime_type,
            "submitted_at": submission.submitted_at,
            "updated_at": submission.updated_at
        })
    
    return response_submissions

@app.get("/submissions/my", response_model=List[schemas.SubmissionResponse])
def get_my_submissions(current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    submissions = crud.get_submissions_by_employee(db, current_user.id)
    
    response_submissions = []
    for submission in submissions:
        response_submissions.append({
            "id": submission.id,
            "assignment_id": submission.assignment_id,
            "employee_id": submission.employee_id,
            "employee_name": current_user.name,
            "title": submission.title,
            "description": submission.description,
            "filename": submission.filename,
            "file_size": submission.file_size,
            "mime_type": submission.mime_type,
            "submitted_at": submission.submitted_at,
            "updated_at": submission.updated_at
        })
    
    return response_submissions

@app.get("/submissions/{submission_id}", response_model=schemas.SubmissionResponse)
def get_submission(submission_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    submission = crud.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check authorization
    if current_user.role == schemas.RoleEnum.employee:
        if submission.employee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this submission")
    elif current_user.role == schemas.RoleEnum.manager:
        assignment = crud.get_assignment_by_id(db, submission.assignment_id)
        if not assignment or assignment.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this submission")
    
    employee = crud.get_user_by_id(db, submission.employee_id)
    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "employee_id": submission.employee_id,
        "employee_name": employee.name if employee else "Unknown Employee",
        "title": submission.title,
        "description": submission.description,
        "filename": submission.filename,
        "file_size": submission.file_size,
        "mime_type": submission.mime_type,
        "submitted_at": submission.submitted_at,
        "updated_at": submission.updated_at
    }

@app.get("/submissions/{submission_id}/download")
def download_submission(submission_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    submission = crud.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # Check authorization
    if current_user.role == schemas.RoleEnum.employee:
        if submission.employee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this submission")
    elif current_user.role == schemas.RoleEnum.manager:
        assignment = crud.get_assignment_by_id(db, submission.assignment_id)
        if not assignment or assignment.manager_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to download this submission")
    
    # Check if file exists
    file_path = Path(submission.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        with open(file_path, "rb") as file:
            content = file.read()
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type=submission.mime_type,
            headers={
                "Content-Disposition": f"attachment; filename={submission.filename}",
                "Content-Length": str(len(content))
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to read file")

@app.patch("/submissions/{submission_id}", response_model=schemas.SubmissionResponse)
def update_submission(submission_id: int, updates: schemas.SubmissionUpdate, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    submission = crud.get_submission_by_id(db, submission_id)
    if not submission or submission.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Submission not found or not authorized")
    
    updated_submission = crud.update_submission(db, submission, updates)
    employee = crud.get_user_by_id(db, submission.employee_id)
    
    return {
        "id": updated_submission.id,
        "assignment_id": updated_submission.assignment_id,
        "employee_id": updated_submission.employee_id,
        "employee_name": employee.name if employee else "Unknown Employee",
        "title": updated_submission.title,
        "description": updated_submission.description,
        "filename": updated_submission.filename,
        "file_size": updated_submission.file_size,
        "mime_type": updated_submission.mime_type,
        "submitted_at": updated_submission.submitted_at,
        "updated_at": updated_submission.updated_at
    }

@app.delete("/submissions/{submission_id}")
def delete_submission(submission_id: int, current_user: models.User = Depends(deps.get_current_employee), db: Session = Depends(database.get_db)):
    submission = crud.get_submission_by_id(db, submission_id)
    if not submission or submission.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Submission not found or not authorized")
    
    # Delete file from filesystem
    file_path = Path(submission.file_path)
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception as e:
            print(f"Failed to delete file: {e}")
    
    success = crud.delete_submission(db, submission_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Submission not found or not authorized")
    
    return {"message": "Submission deleted successfully"}

# --- AssignmentComment Endpoints ---
@app.post("/assignment-comments/", response_model=schemas.AssignmentCommentResponse)
def create_assignment_comment(comment: schemas.AssignmentCommentCreate, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    # Verify the assignment exists and user has access
    assignment = crud.get_assignment_by_id(db, comment.assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if user has access to this assignment
    if current_user.role == schemas.RoleEnum.employee:
        # Employee must be in the same team as the assignment manager
        if current_user.manager_id != assignment.manager_id:
            raise HTTPException(status_code=403, detail="Not authorized to comment on this assignment")
    elif current_user.role == schemas.RoleEnum.manager:
        # Manager must be the creator of the assignment
        if current_user.id != assignment.manager_id:
            raise HTTPException(status_code=403, detail="Not authorized to comment on this assignment")
    
    # Create the comment
    db_comment = crud.create_assignment_comment(db, comment, current_user.id)
    
    # Create notifications for team members
    if current_user.role == schemas.RoleEnum.employee:
        # If employee commented, notify manager and other team members
        manager = crud.get_user_by_id(db, assignment.manager_id)
        if manager:
            crud.create_notification(db, manager.id, f"New comment on assignment '{assignment.title}' by {current_user.name}")
        
        # Notify other team members
        team_members = crud.get_employees_by_manager(db, assignment.manager_id)
        for member in team_members:
            if member.id != current_user.id:  # Don't notify self
                crud.create_notification(db, member.id, f"New comment on assignment '{assignment.title}' by {current_user.name}")
    else:
        # If manager commented, notify all team members
        team_members = crud.get_employees_by_manager(db, current_user.id)
        for member in team_members:
            crud.create_notification(db, member.id, f"Manager {current_user.name} commented on assignment '{assignment.title}'")
    
    # Return comment with user name
    return {
        "id": db_comment.id,
        "assignment_id": db_comment.assignment_id,
        "employee_id": db_comment.employee_id,
        "employee_name": current_user.name,
        "content": db_comment.content,
        "created_at": db_comment.created_at,
        "updated_at": db_comment.updated_at
    }

@app.get("/assignment-comments/assignment/{assignment_id}", response_model=List[schemas.AssignmentCommentResponse])
def get_comments_for_assignment(assignment_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    # Verify assignment exists and user has access
    assignment = crud.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if user has access to this assignment
    if current_user.role == schemas.RoleEnum.employee:
        if current_user.manager_id != assignment.manager_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
    elif current_user.role == schemas.RoleEnum.manager:
        if current_user.id != assignment.manager_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this assignment")
    
    # Get comments with employee names
    comments = crud.get_comments_for_assignment(db, assignment_id)
    result = []
    for comment in comments:
        employee = crud.get_user_by_id(db, comment.employee_id)
        result.append({
            "id": comment.id,
            "assignment_id": comment.assignment_id,
            "employee_id": comment.employee_id,
            "employee_name": employee.name if employee else "Unknown",
            "content": comment.content,
            "created_at": comment.created_at,
            "updated_at": comment.updated_at
        })
    
    return result

@app.put("/assignment-comments/{comment_id}", response_model=schemas.AssignmentCommentResponse)
def update_assignment_comment(comment_id: int, updates: schemas.AssignmentCommentUpdate, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    # Get the comment
    comment = crud.get_assignment_comment_by_id(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user owns the comment
    if comment.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this comment")
    
    # Update the comment
    updated_comment = crud.update_assignment_comment(db, comment, updates)
    
    # Return with user name
    return {
        "id": updated_comment.id,
        "assignment_id": updated_comment.assignment_id,
        "employee_id": updated_comment.employee_id,
        "employee_name": current_user.name,
        "content": updated_comment.content,
        "created_at": updated_comment.created_at,
        "updated_at": updated_comment.updated_at
    }

@app.delete("/assignment-comments/{comment_id}")
def delete_assignment_comment(comment_id: int, current_user: models.User = Depends(deps.get_current_user), db: Session = Depends(database.get_db)):
    # Get the comment
    comment = crud.get_assignment_comment_by_id(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user owns the comment
    if comment.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    # Delete the comment
    success = crud.delete_assignment_comment(db, comment_id, current_user.id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete comment")
    
    return {"message": "Comment deleted successfully"}
