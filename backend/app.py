from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from scipy import stats
import io
import traceback

app = Flask(__name__)
CORS(app)  # Allow React frontend to call this API

# ─── Category Rules ────────────────────────────────────────────────────────────
CATEGORY_RULES = [
    {"name": "Food & Dining",   "color": "#f97316", "icon": "🍜",
     "keywords": ["zomato","swiggy","restaurant","cafe","food","pizza","burger","coffee","chai","kitchen","eat","dominos","mcdonalds","kfc","subway","bake","snack"]},
    {"name": "Transport",       "color": "#22d3ee", "icon": "🚗",
     "keywords": ["uber","ola","rapido","auto","cab","metro","bus","train","irctc","petrol","fuel","diesel","parking","toll","flight","airline","indigo","spicejet","makemytrip","redbus"]},
    {"name": "Shopping",        "color": "#a78bfa", "icon": "🛍️",
     "keywords": ["amazon","flipkart","myntra","ajio","meesho","nykaa","shop","store","mart","cloth","fashion","dress","shoe","bag","watch","jewel","gift"]},
    {"name": "Utilities",       "color": "#34d399", "icon": "💡",
     "keywords": ["electricity","water","gas","bill","bsnl","airtel","jio","vodafone","recharge","broadband","wifi","dth","mseb","bescom","cesc","adani"]},
    {"name": "Entertainment",   "color": "#f472b6", "icon": "🎮",
     "keywords": ["netflix","prime","hotstar","spotify","youtube","gaming","pvr","inox","movie","bookmyshow","ticket","ott","zee","sony"]},
    {"name": "Health",          "color": "#fb923c", "icon": "🏥",
     "keywords": ["pharmacy","medical","hospital","clinic","doctor","medicine","apollo","1mg","netmeds","pharmeasy","lab","gym","fitness","yoga","wellness"]},
    {"name": "Groceries",       "color": "#10b981", "icon": "🛒",
     "keywords": ["grocer","vegetable","fruit","milk","dairy","dmart","bigbasket","blinkit","zepto","instamart","kirana","ration","rice","flour","oil","sugar"]},
    {"name": "Education",       "color": "#fbbf24", "icon": "📚",
     "keywords": ["udemy","coursera","byju","unacademy","book","course","college","tuition","fee","exam","study","learn"]},
    {"name": "Transfers",       "color": "#6366f1", "icon": "💸",
     "keywords": ["transfer","sent","received","upi","neft","imps","rtgs","withdraw","atm","bank"]},
]
DEFAULT_CATEGORY = {"name": "Others", "color": "#94a3b8", "icon": "📌"}


def categorize(description: str) -> dict:
    """Categorize a transaction description using keyword matching."""
    desc_lower = str(description).lower()
    for rule in CATEGORY_RULES:
        if any(kw in desc_lower for kw in rule["keywords"]):
            return rule
    return DEFAULT_CATEGORY


def detect_date_column(df: pd.DataFrame) -> str | None:
    """Auto-detect the date column from common column names."""
    candidates = ["date", "txn date", "transaction date", "value date", "posting date", "time"]
    for col in df.columns:
        if any(c in col.lower() for c in candidates):
            return col
    return None


def detect_description_column(df: pd.DataFrame) -> str | None:
    """Auto-detect the description/narration column."""
    candidates = ["description", "narration", "particulars", "details", "merchant", "remarks", "note", "transaction"]
    for col in df.columns:
        if any(c in col.lower() for c in candidates):
            return col
    return None


def detect_amount_columns(df: pd.DataFrame):
    """Returns (debit_col, credit_col, amount_col)."""
    debit_col = credit_col = amount_col = None
    for col in df.columns:
        cl = col.lower()
        if any(x in cl for x in ["debit", "withdrawal", " dr", "spent", "expense"]):
            debit_col = col
        elif any(x in cl for x in ["credit", "deposit", " cr", "received"]):
            credit_col = col
        elif any(x in cl for x in ["amount", "amt", "transaction amount"]):
            amount_col = col
    return debit_col, credit_col, amount_col


def clean_amount(val) -> float:
    """Convert any amount string/number to float."""
    if pd.isna(val):
        return 0.0
    return abs(float(str(val).replace(",", "").replace("₹", "").replace("$", "").strip() or 0))


def parse_csv(file_content: bytes) -> pd.DataFrame:
    """Parse uploaded CSV bytes into a clean transactions DataFrame."""
    df = pd.read_csv(io.BytesIO(file_content), on_bad_lines="skip")
    df.columns = df.columns.str.strip()

    date_col   = detect_date_column(df)
    desc_col   = detect_description_column(df)
    debit_col, credit_col, amount_col = detect_amount_columns(df)

    if not date_col or not desc_col:
        raise ValueError("Could not detect date or description column. Check CSV format.")

    rows = []
    for _, row in df.iterrows():
        desc   = str(row.get(desc_col, "Unknown")).strip()
        amount = 0.0
        txn_type = "debit"

        if debit_col and clean_amount(row.get(debit_col, 0)) > 0:
            amount   = clean_amount(row[debit_col])
            txn_type = "debit"
        elif credit_col and clean_amount(row.get(credit_col, 0)) > 0:
            amount   = clean_amount(row[credit_col])
            txn_type = "credit"
        elif amount_col:
            raw = float(str(row.get(amount_col, 0)).replace(",", "").replace("₹","") or 0)
            amount   = abs(raw)
            txn_type = "credit" if raw >= 0 else "debit"

        if amount <= 0:
            continue

        # Parse date
        raw_date = str(row.get(date_col, "")).strip()
        try:
            parsed_date = pd.to_datetime(raw_date, dayfirst=True, errors="coerce")
        except Exception:
            parsed_date = pd.NaT

        if pd.isna(parsed_date):
            continue

        cat = categorize(desc)
        rows.append({
            "date":        parsed_date,
            "description": desc,
            "amount":      round(amount, 2),
            "type":        txn_type,
            "category":    cat["name"],
            "color":       cat["color"],
            "icon":        cat["icon"],
        })

    return pd.DataFrame(rows)


def compute_analytics(df: pd.DataFrame) -> dict:
    """
    Core Python/pandas analytics engine.
    Returns a dict of all stats consumed by the React frontend.
    """
    debits  = df[df["type"] == "debit"].copy()
    credits = df[df["type"] == "credit"].copy()

    total_spent  = round(float(debits["amount"].sum()), 2)
    total_income = round(float(credits["amount"].sum()), 2)
    avg_txn      = round(float(debits["amount"].mean()) if len(debits) else 0, 2)

    # ── Category breakdown ────────────────────────────────────────────────────
    cat_group = (
        debits.groupby(["category", "color", "icon"])["amount"]
        .sum().reset_index().sort_values("amount", ascending=False)
    )
    by_category = []
    for _, row in cat_group.iterrows():
        by_category.append({
            "name":   row["category"],
            "color":  row["color"],
            "icon":   row["icon"],
            "amount": round(float(row["amount"]), 2),
            "pct":    round(float(row["amount"]) / total_spent * 100, 1) if total_spent else 0,
        })

    # ── Monthly trend ─────────────────────────────────────────────────────────
    df["month"] = df["date"].dt.to_period("M")
    monthly = df.groupby(["month", "type"])["amount"].sum().unstack(fill_value=0).reset_index()
    by_month = []
    for _, row in monthly.iterrows():
        label = row["month"].strftime("%b '%y")
        by_month.append({
            "month": str(row["month"]),
            "label": label,
            "spent":  round(float(row.get("debit",  0)), 2),
            "income": round(float(row.get("credit", 0)), 2),
        })

    # ── Day of week ───────────────────────────────────────────────────────────
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    debits["dow"] = debits["date"].dt.dayofweek  # 0=Mon
    dow = debits.groupby("dow")["amount"].sum().reindex(range(7), fill_value=0)
    by_day = [{"day": day_names[i], "amount": round(float(dow[i]), 2)} for i in range(7)]

    # ── Top merchants ─────────────────────────────────────────────────────────
    merch = (
        debits.groupby("description")["amount"]
        .agg(["sum", "count"]).reset_index()
        .sort_values("sum", ascending=False).head(8)
    )
    top_merchants = [
        {"name": row["description"][:35], "amount": round(float(row["sum"]), 2), "count": int(row["count"])}
        for _, row in merch.iterrows()
    ]

    # ── Anomaly detection (Z-score, scipy) ───────────────────────────────────
    anomalies = []
    if len(debits) > 3:
        z_scores = np.abs(stats.zscore(debits["amount"]))
        anomaly_df = debits[z_scores > 1.8].sort_values("amount", ascending=False).head(6)
        for _, row in anomaly_df.iterrows():
            anomalies.append({
                "description": row["description"][:40],
                "amount":      round(float(row["amount"]), 2),
                "date":        row["date"].strftime("%d %b %Y"),
                "category":    row["category"],
            })

    # ── Recurring payment detection ───────────────────────────────────────────
    rec_group = (
        debits.groupby("description")["amount"]
        .agg(["count", "mean"]).reset_index()
        .query("count >= 2")
        .sort_values("count", ascending=False).head(6)
    )
    recurring = [
        {"name": row["description"][:35], "count": int(row["count"]), "avg": round(float(row["mean"]), 2)}
        for _, row in rec_group.iterrows()
    ]

    # ── Financial health score ────────────────────────────────────────────────
    ratio = total_spent / total_income if total_income > 0 else 1.0
    health_score = max(10, min(100, round((1 - ratio * 0.6) * 100)))

    # ── Biggest transaction ───────────────────────────────────────────────────
    biggest = None
    if len(debits):
        b = debits.loc[debits["amount"].idxmax()]
        biggest = {"description": b["description"], "amount": round(float(b["amount"]), 2)}

    return {
        "summary": {
            "total_spent":   total_spent,
            "total_income":  total_income,
            "txn_count":     len(df),
            "debit_count":   len(debits),
            "credit_count":  len(credits),
            "avg_txn":       avg_txn,
            "health_score":  health_score,
            "biggest":       biggest,
            "month_count":   len(by_month),
        },
        "by_category":   by_category,
        "by_month":      by_month,
        "by_day":        by_day,
        "top_merchants": top_merchants,
        "anomalies":     anomalies,
        "recurring":     recurring,
    }


# ─── API Routes ────────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "SpendLens backend running"})


@app.route("/api/upload", methods=["POST"])
def upload():
    """
    Accepts a CSV file upload.
    Returns full analytics JSON computed by Python/pandas.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported"}), 400

    try:
        content = file.read()
        df = parse_csv(content)

        if df.empty:
            return jsonify({"error": "No valid transactions found. Check CSV format."}), 400

        analytics = compute_analytics(df)

        # Also return raw transactions for the table view
        transactions = []
        for _, row in df.iterrows():
            transactions.append({
                "date":        row["date"].strftime("%d %b %Y"),
                "description": row["description"],
                "amount":      row["amount"],
                "type":        row["type"],
                "category":    row["category"],
                "color":       row["color"],
                "icon":        row["icon"],
            })

        return jsonify({
            "success":      True,
            "transactions": transactions,
            "analytics":    analytics,
            "row_count":    len(df),
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route("/api/sample", methods=["GET"])
def sample():
    """Return analytics for built-in sample data (no upload needed)."""
    import random
    from datetime import datetime, timedelta

    random.seed(42)
    merchants = [
        ("Zomato Order", "debit"), ("Swiggy Delivery", "debit"), ("Starbucks Coffee", "debit"),
        ("Uber Ride", "debit"), ("Ola Cab", "debit"), ("Indian Oil Petrol", "debit"),
        ("Amazon Purchase", "debit"), ("Flipkart Order", "debit"), ("Myntra Fashion", "debit"),
        ("Airtel Recharge", "debit"), ("Jio Bill", "debit"), ("MSEB Electricity Bill", "debit"),
        ("Netflix Subscription", "debit"), ("Spotify Premium", "debit"), ("BookMyShow Ticket", "debit"),
        ("Apollo Pharmacy", "debit"), ("Gym Membership", "debit"),
        ("BigBasket Order", "debit"), ("Blinkit Grocery", "debit"), ("DMart Purchase", "debit"),
        ("ATM Withdrawal", "debit"), ("Restaurant Dinner", "debit"),
        ("Salary Credit", "credit"), ("UPI Received", "credit"),
    ]

    rows = []
    base = datetime(2025, 1, 1)
    for i in range(90):
        d = base + timedelta(days=i)
        for _ in range(random.randint(1, 4)):
            desc, txn_type = random.choice(merchants)
            amount = round(random.uniform(80, 2000), 2)
            cat = categorize(desc)
            rows.append({
                "date":        d,
                "description": desc,
                "amount":      amount,
                "type":        txn_type,
                "category":    cat["name"],
                "color":       cat["color"],
                "icon":        cat["icon"],
            })

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    analytics = compute_analytics(df)

    transactions = []
    for _, row in df.iterrows():
        transactions.append({
            "date":        row["date"].strftime("%d %b %Y"),
            "description": row["description"],
            "amount":      row["amount"],
            "type":        row["type"],
            "category":    row["category"],
            "color":       row["color"],
            "icon":        row["icon"],
        })

    return jsonify({
        "success":      True,
        "transactions": transactions,
        "analytics":    analytics,
        "row_count":    len(df),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
