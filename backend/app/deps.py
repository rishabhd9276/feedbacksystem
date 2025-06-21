from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from .database import get_db
from . import models, crud, schemas, auth
from jose import JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = auth.decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    user = crud.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exception
    return user

def get_current_manager(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != schemas.RoleEnum.manager:
        raise HTTPException(status_code=403, detail="Manager access required")
    return current_user

def get_current_employee(current_user: models.User = Depends(get_current_user)) -> models.User:
    if current_user.role != schemas.RoleEnum.employee:
        raise HTTPException(status_code=403, detail="Employee access required")
    return current_user 