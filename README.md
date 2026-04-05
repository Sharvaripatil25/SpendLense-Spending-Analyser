# SpendLens — UPI/Bank Statement Spending Analyzer

A full-stack data science project:
- **Backend**: Python (Flask + pandas + numpy + scipy)
- **Frontend**: React + Recharts

---

## Project Structure

```
spendlens/
├── backend/
│   ├── app.py              ← Flask API + all Python analytics
│   └── requirements.txt    ← Python dependencies
└── frontend/
    ├── public/index.html
    ├── package.json
    └── src/
        ├── App.js           ← routing + sidebar
        ├── utils/api.js     ← all API calls to Python backend
        └── pages/
            ├── Upload.js    ← CSV upload screen
            ├── Dashboard.js ← charts & summary
            ├── Transactions.js ← searchable table
            └── Insights.js  ← health score, anomalies, savings
```

---

## Setup & Run

### Step 1 — Python Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
# Flask runs on http://localhost:5000
```

### Step 2 — React Frontend (new terminal)

```bash
cd frontend
npm install
npm start
# React runs on http://localhost:3000
```

Open http://localhost:3000 in your browser.

---

## What Python Does

All business logic lives in `backend/app.py`:

| Library  | Used for |
|----------|----------|
| `pandas`  | CSV parsing, groupby, monthly/daily aggregation |
| `numpy`   | Mean, std dev calculations |
| `scipy.stats` | Z-score based anomaly detection |
| `flask`   | REST API serving JSON to React |

React is **only for display** — it receives JSON from Python and renders charts.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/health`  | Check if backend is running |
| POST | `/api/upload`  | Upload CSV → returns analytics JSON |
| GET  | `/api/sample`  | Returns analytics for built-in sample data |

---

## Sample CSV Format

The app auto-detects columns. Works with:
- SBI, HDFC, ICICI, Axis, Kotak statements
- PhonePe, GPay, Paytm exports

Minimum required columns:
```
Date, Description/Narration/Particulars, Debit/Credit/Amount
```
