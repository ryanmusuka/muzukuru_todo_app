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

# Pydantic Schemas
class UserCreate(BaseModel):
    username: str
    password: str = Field(..., max_length=50)

# Endpoints
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