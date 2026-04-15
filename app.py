import sqlite3
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "resumaxing_secret"

DATABASE = "users.db"

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                html_file TEXT NOT NULL,
                category TEXT DEFAULT 'Resume Template',
                is_favorite INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Seed default templates if empty
        existing = conn.execute("SELECT COUNT(*) FROM templates").fetchone()[0]
        if existing == 0:
            conn.executemany(
                "INSERT INTO templates (name, html_file, category, is_favorite) VALUES (?, ?, ?, ?)",
                [
                    ("Modern Resume", "modern_resume.html", "Resume Template", 1),
                    ("Professional Resume", "professional_resume.html", "Resume Template", 0),
                    ("University Resume", "university_resume.html", "Resume Template", 0),
                ]
            )

@app.route("/")
def index():
    return redirect(url_for("dashboard"))

@app.route("/dashboard")
def dashboard():
    return render_template("Dashboard.html")

# --- Template API ---

@app.route("/api/templates", methods=["GET"])
def get_templates():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM templates ORDER BY created_at DESC").fetchall()
    return jsonify([dict(r) for r in rows])

@app.route("/api/templates", methods=["POST"])
def create_template():
    data = request.get_json()
    name = data.get("name", "").strip()
    html_file = data.get("html_file", "").strip()
    category = data.get("category", "Resume Template").strip()
    if not name or not html_file:
        return jsonify({"error": "name and html_file are required"}), 400
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO templates (name, html_file, category) VALUES (?, ?, ?)",
            (name, html_file, category)
        )
        new_id = cur.lastrowid
        row = conn.execute("SELECT * FROM templates WHERE id = ?", (new_id,)).fetchone()
    return jsonify(dict(row)), 201

@app.route("/api/templates/<int:tid>", methods=["PUT"])
def update_template(tid):
    data = request.get_json()
    with get_db() as conn:
        conn.execute(
            "UPDATE templates SET name=?, html_file=?, category=?, is_favorite=? WHERE id=?",
            (data["name"], data["html_file"], data.get("category", "Resume Template"), data.get("is_favorite", 0), tid)
        )
        row = conn.execute("SELECT * FROM templates WHERE id = ?", (tid,)).fetchone()
    return jsonify(dict(row))

@app.route("/api/templates/<int:tid>/favorite", methods=["PATCH"])
def toggle_favorite(tid):
    with get_db() as conn:
        row = conn.execute("SELECT is_favorite FROM templates WHERE id = ?", (tid,)).fetchone()
        if not row:
            return jsonify({"error": "not found"}), 404
        new_val = 0 if row["is_favorite"] else 1
        conn.execute("UPDATE templates SET is_favorite=? WHERE id=?", (new_val, tid))
    return jsonify({"is_favorite": new_val})

@app.route("/api/templates/<int:tid>", methods=["DELETE"])
def delete_template(tid):
    with get_db() as conn:
        conn.execute("DELETE FROM templates WHERE id = ?", (tid,))
    return jsonify({"deleted": tid})

@app.route("/resume/<int:tid>")
def resume(tid):
    with get_db() as conn:
        template = conn.execute("SELECT * FROM templates WHERE id = ?", (tid,)).fetchone()
    if not template:
        return "Template not found", 404
    return render_template("resume.html", template=dict(template))


def signup():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        try:
            with get_db() as conn:
                conn.execute(
                    "INSERT INTO users (email, password) VALUES (?, ?)",
                    (email, generate_password_hash(password))
                )
            session["user"] = email
            flash("Account created successfully!")
            return redirect(url_for("index"))
        except sqlite3.IntegrityError:
            flash("Account already exists. Please log in.")
            return redirect(url_for("login"))
    return render_template("signup.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        with get_db() as conn:
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if user and check_password_hash(user["password"], password):
            session["user"] = email
            return redirect(url_for("dashboard"))
        flash("Invalid email or password.")
    return render_template("login.html")

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("index"))

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
 