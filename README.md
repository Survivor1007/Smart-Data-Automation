# Smart Data Automation Platform

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC)
![Vite](https://img.shields.io/badge/Vite-BuildTool-646CFF)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Styling-38B2AC)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)
![Pandas](https://img.shields.io/badge/Pandas-DataProcessing-150458)

A lightweight, user-friendly web application for automatic dataset analysis, cleaning, and transformation. Built as a self-service data preparation tool with
background job processing and interactive visualizations.

---

## ✨ Features

### Backend
- **File Upload**: Support for CSV and Excel files with metadata storage
- **Automatic Analysis**: Missing values, duplicates, data types, numeric statistics, categorical top values — stored as JSONB
- **Background Cleaning Pipeline**: Multiple operations including:
  - Remove duplicates
  - Fill missing values (mean, median, constant, forward/backward fill)
  - Trim whitespace
  - Convert case (title, upper, lower)
  - Drop columns
  - Rename columns
  - Replace specific values
- **Job Tracking**: Full history with status (pending/running/completed/failed), timestamps, and error messages
- **File Versioning**: Cleaned files saved as `filename_cleaned_v1.csv`, `v2`, etc.
- **Export/Download**: Stream cleaned files with proper headers

### Frontend
- Modern React 19 + TypeScript + Tailwind CSS + Vite
- Responsive dataset list with key metrics
- Interactive **Dataset Detail** page featuring:
  - Data preview table
  - Rich analysis report with **Recharts visualizations** (missing % bar chart + categorical top values pie charts)
  - Live **Job History** table with auto-refresh polling
  - **Advanced Cleaning Modal** with configurable operations and column selection
- Dark mode support
- Toast notifications and loading skeletons

--- 

## 🏗️ System Architecture

```mermaid
graph TD
    A[User] --> B[React Frontend]
    B --> C[FastAPI Backend]
    C --> D[PostgreSQL]
    C --> E[Pandas Processing]
    E --> F[Background Jobs]
    F --> G[uploads/raw + processed]
    C --> H[Analysis Engine]
    H --> D
```


---

## 🚀 Key Features

* **Automated Analysis:** Instant generation of data profiles stored as `JSONB` for lightning-fast retrieval.
* **Asynchronous Processing:** Data cleaning and heavy lifting handled via `FastAPI BackgroundTasks`.
* **Job System:** Live-updating job monitoring with status polling.
* **Data Versioning:** Automatic tracking of cleaned file versions (e.g., `_cleaned_vN.csv`).
* **Interactive UI:** Responsive dashboard featuring **Recharts** for data visualization.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework:** React 19 + TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Charts:** Recharts
* **API Client:** Axios

### **Backend**
* **API Framework:** FastAPI
* **ORM:** SQLAlchemy + Alembic (Migrations)
* **Database:** PostgreSQL (utilizing `JSONB` for flexible reports)
* **Data Science:** Pandas + openpyxl

---

## 📊 System Flow

1.  **Upload:** File saved to `uploads/raw/` → Metadata persisted in PostgreSQL.
2.  **Auto-Analysis:** Background process triggers → Results stored in `analysis_report` JSONB field.
3.  **Visualization:** View interactive preview tables, detailed stats, and distribution charts.
4.  **Cleaning:** User selects operations (handling nulls, types, etc.) → Job is queued.
5.  **Monitoring:** Frontend polls the Job System for live progress updates.
6.  **Export:** Download the processed, version-controlled dataset.

---

## ⚙️ Getting Started

### Prerequisites
* **Python** 3.11+
* **Node.js** 18+
* **PostgreSQL** (Running instance)

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Env
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
source venv/bin/activate

pip install -r requirements.txt

# Environment Configuration
cp .env.example .env
# Open .env and update your DATABASE_URL

# Run Migrations & Start Server
alembic upgrade head
uvicorn app.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📸 Screenshots

### 1. Upload Page
<img src="screenshots/01-upload-page.png" alt="Upload Page">

### 2.Dataset List
<img src="screenshots/02-dataset-page.png" alt="Dataset Page">

### 3. Dataset Detail – Preview & Analysis
<img src="screenshots/03-dataset-detail.png" alt="Dataset Detail">

### 3. Analysis Charts (Missing % + Top Values)
<img src="screenshots/04-analysis-insights.png" alt="Analysis Charts">

### 4. Advanced Cleaning Modal
<img src="screenshots/05-cleaning-operations.png" alt="Cleaning Modal">

### 5. Job History with Live Updates
<img src="screenshots/06-processing-history.png" alt="Job History">

---

## 🎯 What This Project Demonstrates

- Full-stack development using modern technologies
- Real data engineering workflows (ETL-like pipelines)
- Background processing and job tracking
- Dataset versioning
- Clean backend architecture
- routers
- services
- schemas
- models
- Responsive UI using TypeScript
- Real-world data cleaning workflows
- Live updates using polling
- Professional project structure and documentation

--- 
## 🐳 Docker Setup

The project is fully containerized using Docker and Docker Compose for easy local development and consistent environments.

### Quick Start with Docker

```bash
# From the project root
docker compose up --build
# Start all services in foreground
docker compose up --build

# Start in background (detached mode)
docker compose up -d --build

# Stop all services
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

### This will start:

- Frontend → http://localhost:5173
- Backend API → http://localhost:8000
- PostgreSQL → localhost:5433




---
## 🔮 Future Enhancements

### Planned improvements include:

- Natural Language → Data Cleaning Operations using Groq LLM
- AI-powered data quality suggestions
- User authentication and multi-user support
- Advanced dataset profiling and charts
- Celery + Redis for production-grade background jobs

---

⭐ If you like this project, consider giving it a star on GitHub!
