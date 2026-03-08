# Securinets ISET'R - Cyber Security Channel Platform

I have successfully updated and rebranded the `classmates_only` project into **Securinets ISET'R**. This platform features a modern React frontend, SQLite backend, and specialized channels for various cyber security domains.

## Key Features

### 1. SQLite Database & SQLAlchemy
The project now uses **SQLite** (`classmates_only.db`) and **Flask-SQLAlchemy**. This makes the project portable and easy to set up without a separate MySQL server.
- **Models**: `User`, `Channel`, `Post`, `Reply`.
- **Auto-Initialization**: The database and 11 default security channels (Forensics, Reverse Engineering, etc.) are created automatically on the first run.

### 2. Media Uploads
Users can now post images, videos, and other files.
- **Images/Videos**: Rendered directly in the post feed.
- **Files**: Provided as a download link.
- **Storage**: Files are saved in the `uploads/` directory.

### 3. Channel-Specific Posts with AJAX
The frontend is now a **React** application that loads channel content dynamically without page refreshes.
- **Sidebar**: Switch between 11 specialized security channels instantly.
- **AJAX**: Requests are sent to `/api/channels/<slug>/posts`.
- **Multiple Request Bug Prevention**: The "Post" button is disabled during submission to ensure the request is only sent once.
- **Interactive Decorations**: Each channel features unique background "watermarks" with relevant shell commands and security terminology.

### 4. Admin Panel & Permissions
Integrated **Flask-Admin** for easy content management.
- **Admin Users**: Can post in any channel and access the admin panel at `/admin`.
- **Normal Users**: Limited to posting in the "Home" channel only.
- **Default Admin**: Created automatically with username `admin` and password `admin123`.

## How to Run

1. **Backend**:
   ```bash
   python backend.py
   ```
   (Runs on http://localhost:5000)

2. **Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   (Navigate to the URL provided by Vite, usually http://localhost:5173)

## Project Structure
- `backend.py`: Flask server with SQLAlchemy models and API endpoints.
- `uploads/`: Directory for user-uploaded media.
- `frontend/`: React application built with Vite.
- `static/`: Static assets including the Securinets branding.
