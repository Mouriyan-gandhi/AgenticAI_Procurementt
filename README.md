# AgenticProcure 🧠

**AgenticProcure** is an enterprise-grade vendor evaluation and procurement intelligence platform powered by a multi-agent AI architecture. It automates the parsing, technical assessment, compliance checking, and financial scoring of vendor proposals against internal company requirements. 

It provides procurement managers and finance teams with transparent, actionable insights using real-time generative AI workflows, reducing a process that typically takes weeks down to mere minutes.

![Alt text](https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200&h=400)

---

## 🌟 Key Features

### 🤖 5-Stage Multi-Agent Workflow
1. **AI Librarian (`librarian.py`)**: Extracts structured clauses, deliverables, and capabilities from raw RFPs, NDAs, and Vendor PDFs into a clean schema.
2. **Lead Engineer (`engineer.py`)**: Evaluates the vendor's technical architecture, materials, and delivery timelines against your engineering requirements.
3. **Compliance Officer (`compliance.py`)**: Audits certifications (ISO, SOC2), SLA terms, and frameworks against internal risk & security policies.
4. **Dynamic Scorer (`scorer.py`)**: Computes a multidimensional normalized score (0-10) using Technical, Compliance, and Pricing weightages set dynamically.
5. **Human-in-the-Loop (HITL)**: Mandatory managerial sign-off gateway allowing "Approve" or "Request Re-evaluation" (which seamlessly triggers a loop back into the agents).

### ⚡ Tech Stack Architecture

- **AI Engine**: LangGraph, LangChain, Google Gemini Pro 2.5, ChromaDB (RAG memory).
- **Backend**: Python 3.11, FastAPI, Server-Sent Events (SSE) for real-time agent observability.
- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand (state management).
- **Infrastructure**: Firebase Auth, Firebase Firestore, Firebase Storage.
- **Deployment**: Full Docker orchestration via `docker-compose.yml` (Nginx + Uvicorn).

---

## 🛠️ Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Node.js version 20+ (if running locally natively)
- Python 3.11+ 

### 2. Environment Variables
Create a `.env` file in the root directory and add your Google Gemini API key:
```env
# /AgenticAIProject/.env
GOOGLE_API_KEY=AIzaSyABLe-_YOUR_API_KEY_HERE
```
Note: Ensure Firebase configurations in `frontend/src/firebase.js` match your active Firebase project specs.

### 3. Running with Docker (Recommended)
You can launch the entire stack (FastAPI backend + React/Nginx frontend) in one command:
```bash
docker compose up --build
```
- **Web Dashboard**: `http://localhost:3000`
- **FastAPI Endpoints**: `http://localhost:8000/docs`

### 4. Running Locally Natively (Dev Mode)

**Terminal 1: FastAPI Backend**
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2: React Frontend**
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 📦 Directory Structure
```
AgenticAIProject/
├── api.py                    # Core FastAPI server and LangGraph SSE stream integration
├── main.py                   # CLI version of the evaluation pipeline
├── documentation/            # Project documentation and base deps
├── vendor_proposals/         # Upload directory for vendor PDFs
├── agents/                   # LLM Agents
│   ├── librarian.py          # PDF document parser and structurer agent
│   ├── engineer.py           # Technical capability assessment agent
│   ├── compliance.py         # Certifications/SLA validation agent
│   ├── scorer.py             # Rule-based and LLM normalized scorer
│   └── report.py             # Markdown summary generator
├── tools/
│   └── pdf_parser.py         # PyMuPDF text ingestion tool
├── frontend/                 # React UI Workspace
│   ├── src/
│   │   ├── components/       # UI building blocks (Topbar, Sidebar)
│   │   ├── pages/            # Logic views (Dashboard, Login, NewEval)
│   │   ├── store/            # Zustand global stores (auth, evaluations)
│   │   └── firebase.js       # Firebase initialization
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml        # Orchestration layer
├── backend.Dockerfile        # Python runtime image
└── frontend.Dockerfile       # Node build -> Nginx server image
```

---

## 🔐 Security & Persistence
- Uploads handled securely; original vendor pdfs are kept in the bound volume (`./vendor_proposals`).
- Firebase Auth controls access to the web portal.
- All LLM agent API calls execute solely backend-side shielding your API keys away from the client browser.

---

**Developed for the next-generation of automated risk operations and procurement management.**
