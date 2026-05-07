import logging
import os
import jwt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import models
from database import engine, SessionLocal

# JWT Configuration
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256") 
models.Base.metadata.create_all(bind=engine)

# Logging
logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logging.info(f"Incoming request: {request.method} {request.url}")
    try:
        return await call_next(request)
    except Exception as e:
        logging.error(f"Error handling request: {e}")
        raise e

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# Database Session Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    except Exception as e:
        logging.warning(f"Token validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user


# Pydantic Schemas
class UserCreate(BaseModel):
    username: str
    password: str = Field(..., max_length=50)

class TodoCreate(BaseModel):
    title: str

class TodoResponse(BaseModel):
    id: int
    title: str
    completed: bool
    owner_id: int

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy models

# Login Endpoints
@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # Query database to check if user already exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    
    if db_user:
        logging.warning(f"Failed registration attempt - Username taken: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Hash password and save to database
    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    
    logging.info(f"Successfully registered user: {user.username}")
    return {"message": "User created successfully"}

@app.post("/login", status_code=status.HTTP_200_OK)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Query database for user
    db_user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        logging.warning(f"Failed login attempt - User not found: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    #JWT Token Generation
    token_data = {
        "sub": db_user.username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=1) 
    }
    
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    logging.info(f"Successfully logged in user: {form_data.username}")
    return {
        "access_token": token,
        "token_type": "bearer"
    }

@app.get("/protected")
async def get_protected_data(token: str = Depends(oauth2_scheme)):

    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            logging.error("Token verification failed: No username in payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
            
        # Log the successful access 
        logging.info(f"Authorized access to /protected by user: {username}")
        return {
            "message": "Welcome to the protected route!",
            "user": username,
            "status": "Authenticated"
        }

    except jwt.ExpiredSignatureError:
        logging.warning("Access denied: Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again."
        )
    except jwt.InvalidTokenError:
        logging.warning("Access denied: Invalid token signature")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token."
        )
    
# The To-Do Endpoints
@app.post("/todos", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(todo: TodoCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Creates a new task linked to the logged-in user."""
    new_todo = models.Todo(
        title=todo.title, 
        completed=False, 
        owner_id=current_user.id
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo) 
    
    logging.info(f"User '{current_user.username}' created a new task: {todo.title}")
    return new_todo

@app.get("/todos", response_model=list[TodoResponse])
async def get_todos(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetches all tasks belonging ONLY to the logged-in user."""
    todos = db.query(models.Todo).filter(models.Todo.owner_id == current_user.id).all()
    
    logging.info(f"Fetched {len(todos)} tasks for user '{current_user.username}'")
    return todos

@app.put("/todos/{todo_id}", response_model=TodoResponse)
async def toggle_todo(todo_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Toggles the completed status of a specific task."""
    
    # SECURITY: Find the task by ID *AND* verify the logged-in user owns it
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id, 
        models.Todo.owner_id == current_user.id
    ).first()
    
    if not todo:
        logging.warning(f"User '{current_user.username}' attempted to update an unauthorized or missing task (ID: {todo_id})")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or unauthorized")
    
    # Toggle the boolean value (True becomes False, False becomes True)
    todo.completed = not todo.completed
    db.commit()
    db.refresh(todo)
    
    logging.info(f"User '{current_user.username}' toggled task {todo_id} to {todo.completed}")
    return todo

@app.delete("/todos/{todo_id}", status_code=status.HTTP_200_OK)
async def delete_todo(todo_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Deletes a specific task."""
    
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id, 
        models.Todo.owner_id == current_user.id
    ).first()
    
    if not todo:
        logging.warning(f"User '{current_user.username}' attempted to delete an unauthorized or missing task (ID: {todo_id})")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or unauthorized")
        
    db.delete(todo)
    db.commit()
    
    logging.info(f"User '{current_user.username}' deleted task {todo_id}")
    return {"message": "Task deleted successfully"}