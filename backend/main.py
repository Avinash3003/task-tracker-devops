from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import Optional

from database import engine, get_db, Base
from models import User, Task
from schemas import (
    UserRegister,
    UserLogin,
    ForgotPassword,
    TaskCreate,
    TaskResponse,
    TokenResponse,
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def cleanup_expired_deleted_tasks(db: Session, user_id: int):
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=5)
    expired = (
        db.query(Task)
        .filter(
            Task.user_id == user_id,
            Task.is_deleted == True,
            Task.deleted_at != None,
            Task.deleted_at < cutoff,
        )
        .all()
    )
    for task in expired:
        db.delete(task)
    if expired:
        db.commit()


# --- Auth Endpoints ---


@app.post("/register", response_model=TokenResponse)
def register(user: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )
    new_user = User(
        username=user.username,
        password_hash=hash_password(user.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_access_token(data={"sub": new_user.username})
    return TokenResponse(
        access_token=token, token_type="bearer", username=new_user.username
    )


@app.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(data={"sub": db_user.username})
    return TokenResponse(
        access_token=token, token_type="bearer", username=db_user.username
    )


@app.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Username not found",
        )
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Password reset successful"}


@app.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


# --- Task Endpoints ---


@app.post("/tasks", response_model=TaskResponse)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deadline = None
    if task.deadline_date:
        try:
            deadline = datetime.fromisoformat(task.deadline_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format",
            )

    new_task = Task(
        user_id=current_user.id,
        title=task.title,
        description=task.description or "",
        deadline_date=deadline,
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task


@app.get("/tasks", response_model=list[TaskResponse])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cleanup_expired_deleted_tasks(db, current_user.id)
    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.is_deleted == False)
        .order_by(Task.created_at.asc())
        .all()
    )
    return tasks


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    task.is_deleted = True
    task.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Task soft deleted", "task_id": task_id}


@app.put("/tasks/{task_id}/restore", response_model=TaskResponse)
def restore_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Task not found"
        )
    if task.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )
    if not task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is not deleted",
        )
    if task.deleted_at:
        deleted_at = task.deleted_at.replace(tzinfo=timezone.utc) if task.deleted_at.tzinfo is None else task.deleted_at
        elapsed = (datetime.now(timezone.utc) - deleted_at).total_seconds()
        if elapsed > 5:
            db.delete(task)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Undo window expired",
            )
    task.is_deleted = False
    task.deleted_at = None
    db.commit()
    db.refresh(task)
    return task


@app.get("/tasks/search", response_model=list[TaskResponse])
def search_tasks(
    q: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cleanup_expired_deleted_tasks(db, current_user.id)
    query = db.query(Task).filter(
        Task.user_id == current_user.id, Task.is_deleted == False
    )

    if q:
        query = query.filter(Task.title.ilike(f"%{q}%"))

    if from_date:
        try:
            fd = datetime.fromisoformat(from_date)
            query = query.filter(Task.created_at >= fd)
        except ValueError:
            pass

    if to_date:
        try:
            td = datetime.fromisoformat(to_date)
            td = td.replace(hour=23, minute=59, second=59)
            query = query.filter(Task.created_at <= td)
        except ValueError:
            pass

    return query.order_by(Task.created_at.asc()).all()


@app.get("/tasks/sort", response_model=list[TaskResponse])
def sort_tasks(
    sort_by: str = Query("created_at"),
    order: str = Query("asc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cleanup_expired_deleted_tasks(db, current_user.id)
    query = db.query(Task).filter(
        Task.user_id == current_user.id, Task.is_deleted == False
    )

    column_map = {
        "created_at": Task.created_at,
        "deadline_date": Task.deadline_date,
        "title": Task.title,
    }
    col = column_map.get(sort_by, Task.created_at)

    if order == "desc":
        query = query.order_by(col.desc())
    else:
        query = query.order_by(col.asc())

    return query.all()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
