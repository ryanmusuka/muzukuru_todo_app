# MUZUKURU TO-DO 📝⚡
**A Secure, High-Performance Task Management System.**

This is a full-stack application built with **FastAPI** and **React (Vite)**. MUZUKURU TO-DO is a high-end, mobile-optimized task manager designed to provide a frictionless "productivity flow." It utilizes a "Digital Fortress" architecture to ensure user data remains private while delivering a desktop-grade search and filtering experience through local state optimization.

## 🏗️ The Tech Stack

* **Backend Framework**: **FastAPI (Python)** - Leveraging asynchronous request handling and Pydantic for high-speed data validation.
* **Database/ORM**: **SQLAlchemy & SQLite** - Utilizing a relational schema to enforce task ownership.
* **Security**: **OAuth2 + JWT (JSON Web Tokens)** - Stateless authentication with password hashing.
* **Frontend**: **React 18 (Vite)** - Engineered for instant Hot Module Replacement and performance.
* **Language**: **TypeScript** - Strict interface definitions to ensure frontend-backend contract alignment.
* **Styling**: **Tailwind CSS** - Implementing a clean, minimalist design language.
* **Animations**: **Framer Motion** - TikTok-style micro-interactions and spring-physics bottom sheets.

## ✨ Key Features

### 1. Secure Multi-User Environment
A robust JWT gatekeeper architecture. Users must register and log in to receive a signed access token. The backend validates this "digital wristband" for every protected action.

### 2. "Thumb-Zone" Mobile UX
Designed for the modern mobile user. 
* **FAB (Floating Action Button)**: Positioned for easy thumb reach.
* **Bottom Sheet Modal**: Task entry slides up from the bottom, mimicking native iOS/Android system interactions.

### 3. $O(1)$ Perceived Search & Filter
The system utilizes local state filtering. Instead of triggering expensive database queries for every keystroke, the UI filters the Redux-style state instantly, providing zero-latency feedback.

### 4. Relational Data Integrity (Anti-IDOR)
A security-first approach to task management. Every database transaction (Update/Delete) is verified against the `owner_id` of the requester, preventing **Insecure Direct Object Reference** vulnerabilities.

### 5. Skeleton Shimmer UX
Eliminating the "Flash of Unstyled Content." While data is being fetched, users are greeted with high-fidelity skeleton loaders that maintain the visual structure of the app, significantly reducing perceived wait time.

## 🧠 Lessons Learned & Engineering Trade-offs

### LIFO vs. Chronological Storage
Standard databases return items oldest-first. To match user mental models (the most recent thought should be at the top), I implemented a **LIFO (Last-In-First-Out)** presentation layer in React using `.reverse()`. This keeps the backend queries simple and performant while providing the correct UI "Stack" behavior.

### Neutralizing IDOR Vulnerabilities
In modern web security, trusting the client-side ID is a fatal error. We implemented a **Dual-Filter logic** in SQLAlchemy. Instead of simply querying by task ID, the backend enforces a mandatory ownership check: `filter(Todo.id == tid, Todo.owner_id == user.id)`. This ensures that even if an attacker guesses a task ID, the database returns `404 Not Found` unless they are the legitimate owner.

### Resolving the "422 Unprocessable Entity" Friction
A significant integration challenge occurred during the login flow. FastAPI's `OAuth2PasswordRequestForm` requires data encoded as `application/x-www-form-urlencoded`, while React defaults to `application/json`. I resolved this by authoring a dynamic payload formatter using `URLSearchParams`, ensuring strict contract alignment between the client's network headers and the server's Pydantic schemas.

### Cryptographic Dependency Conflict (Bcrypt vs. Passlib)
During backend development, I diagnosed a fatal `500 Internal Server Error` caused by a version mismatch between `passlib` and `bcrypt 4.0+`. By analyzing the stack trace and identifying the `detect_wrap_bug` failure, I stabilized the architecture by explicitly pinning the `bcrypt` dependency to version `3.2.2`, maintaining high security without sacrificing system stability.

## 🔒 Security First
* **Password Hashing**: Passwords are never stored in plain text; we use `Passlib` with `Bcrypt`.
* **Stateless Security**: No session cookies are used, making the API resistant to CSRF (Cross-Site Request Forgery).
* **CORS Policy**: Restricted access to specific trusted origins to prevent unauthorized cross-domain scripting.

---

## 🛠️ Installation & Setup

### 🔙 Backend Setup (FastAPI)
1.  **Navigate to directory**: `cd backend`
2.  **Create Virtual Env**: `python -m venv venv`
3.  **Activate**: 
    * Win: `.\venv\Scripts\activate`
    * Mac/Linux: `source venv/bin/activate`
4.  **Install Deps**: `pip install fastapi uvicorn sqlalchemy passlib[bcrypt] python-multipart pyjwt python-dotenv`
5.  **Environment**: Create a `.env` file:
    ```env
    SECRET_KEY=your_secret_key
    ALGORITHM=HS256
    ```
6.  **Run**: `uvicorn main:app --reload`

### 🔜 Frontend Setup (React)
1.  **Navigate to directory**: `cd frontend`
2.  **Install Deps**: `npm install`
3.  **Run Dev**: `npm run dev`

---

## 📝 License
Distributed under the MIT License. 