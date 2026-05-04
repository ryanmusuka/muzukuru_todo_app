import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# 1. Configure Logging (Requirement: Log to app.log)
logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

app = FastAPI()

# 2. Enable CORS (Requirement: Allow localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # This is where your React app will live
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Custom Middleware to automatically log every request
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logging.info(f"Incoming request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logging.error(f"Error handling request: {e}")
        raise e

@app.get("/")
def read_root():
    return {"message": "API is running. CORS and Logging are active!"}