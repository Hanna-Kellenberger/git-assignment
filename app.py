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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_resumes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                template_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (template_id) REFERENCES templates(id)
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
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))
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

import json

@app.route("/resume/<int:tid>")
def resume(tid):
    if "user" not in session:
        return redirect(url_for("login"))
    with get_db() as conn:
        template = conn.execute("SELECT * FROM templates WHERE id = ?", (tid,)).fetchone()
    if not template:
        return "Template not found", 404
    # Create a personal copy for this user if one doesn't exist yet
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM user_resumes WHERE user_email=? AND template_id=? ORDER BY created_at DESC LIMIT 1",
            (session["user"], tid)
        ).fetchone()
        if existing:
            resume_id = existing["id"]
        else:
            default_content = get_default_content(template["html_file"])
            cur = conn.execute(
                "INSERT INTO user_resumes (user_email, template_id, title, content) VALUES (?, ?, ?, ?)",
                (session["user"], tid, template["name"], json.dumps(default_content))
            )
            resume_id = cur.lastrowid
    return redirect(url_for("edit_resume", rid=resume_id))

@app.route("/edit/<int:rid>")
def edit_resume(rid):
    if "user" not in session:
        return redirect(url_for("login"))
    with get_db() as conn:
        row = conn.execute(
            "SELECT ur.*, t.html_file, t.name as template_name FROM user_resumes ur JOIN templates t ON ur.template_id = t.id WHERE ur.id=? AND ur.user_email=?",
            (rid, session["user"])
        ).fetchone()
    if not row:
        return "Resume not found", 404
    return render_template("resume.html", resume=dict(row), content=json.loads(row["content"]))

@app.route("/api/user-resumes", methods=["GET"])
def get_user_resumes():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    with get_db() as conn:
        rows = conn.execute(
            """SELECT ur.id, ur.title, ur.updated_at, ur.created_at,
                      ur.content, t.name as template_name, t.category
               FROM user_resumes ur
               JOIN templates t ON ur.template_id = t.id
               WHERE ur.user_email = ?
               ORDER BY ur.updated_at DESC""",
            (session["user"],)
        ).fetchall()

    results = []
    for r in rows:
        row = dict(r)
        # Pull subject fields out of stored JSON content
        try:
            content = json.loads(row.pop("content"))
            row["person_name"]  = content.get("name", "")
            row["person_title"] = content.get("title", "")
            row["skills"]       = content.get("skills", [])
            row["has_experience"] = len(content.get("experience", [])) > 0
            row["has_education"]  = len(content.get("education", [])) > 0
        except Exception:
            row["person_name"]    = ""
            row["person_title"]   = ""
            row["skills"]         = []
            row["has_experience"] = False
            row["has_education"]  = False
        results.append(row)

    return jsonify(results)

@app.route("/api/user-resumes/<int:rid>", methods=["DELETE"])
def delete_user_resume(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    with get_db() as conn:
        conn.execute("DELETE FROM user_resumes WHERE id=? AND user_email=?", (rid, session["user"]))
    return jsonify({"deleted": rid})
@app.route("/api/resumes/<int:rid>", methods=["POST"])
def save_resume(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json()
    with get_db() as conn:
        conn.execute(
            "UPDATE user_resumes SET content=?, title=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_email=?",
            (json.dumps(data["content"]), data.get("title", "My Resume"), rid, session["user"])
        )
    return jsonify({"saved": True})

def get_default_content(html_file):
    defaults = {
        "modern_resume.html": {
            "name": "Your Name",
            "title": "Professional Title",
            "email": "email@example.com",
            "phone": "(555) 000-0000",
            "location": "City, State",
            "linkedin": "linkedin.com/in/yourname",
            "summary": "A motivated professional with experience in...",
            "experience": [
                {"company": "Company Name", "role": "Job Title", "dates": "Jan 2022 – Present", "bullets": ["Led key initiatives", "Improved processes by 20%"]}
            ],
            "education": [
                {"school": "University Name", "degree": "B.S. in Your Major", "dates": "2018 – 2022"}
            ],
            "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"]
        },
        "professional_resume.html": {
            "name": "Your Name",
            "title": "Senior Professional",
            "email": "email@example.com",
            "phone": "(555) 000-0000",
            "location": "City, State",
            "website": "yourwebsite.com",
            "summary": "Results-driven professional with 5+ years of experience...",
            "experience": [
                {"company": "Company Name", "role": "Senior Role", "dates": "2020 – Present", "bullets": ["Managed a team of 10", "Delivered projects on time"]}
            ],
            "education": [
                {"school": "University Name", "degree": "M.S. in Your Field", "dates": "2016 – 2018"}
            ],
            "skills": ["Leadership", "Strategy", "Communication", "Analysis"],
            "certifications": ["Certification 1", "Certification 2"]
        },
        "university_resume.html": {
            "name": "Your Name",
            "major": "Computer Science",
            "university": "University Name",
            "graduation": "May 2025",
            "email": "email@university.edu",
            "phone": "(555) 000-0000",
            "gpa": "3.8",
            "summary": "Motivated student seeking internship opportunities...",
            "experience": [
                {"company": "Company / Lab", "role": "Intern / Research Assistant", "dates": "Summer 2024", "bullets": ["Assisted with research", "Built a web application"]}
            ],
            "education": [
                {"school": "University Name", "degree": "B.S. Computer Science", "dates": "2021 – 2025"}
            ],
            "skills": ["Python", "JavaScript", "SQL", "Git"],
            "projects": [
                {"name": "Project Name", "description": "Built a full-stack app using Flask and React."}
            ]
        }
    }
    return defaults.get(html_file, defaults["modern_resume.html"])


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        try:
            with get_db() as conn:
                conn.execute(
                    "INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
                    (email, email, generate_password_hash(password))
                )
            session["user"] = email
            return redirect(url_for("dashboard"))
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
    return redirect(url_for("login"))

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
 