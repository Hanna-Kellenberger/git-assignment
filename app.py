import os
import json
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from dotenv import load_dotenv
from supabase_client import supabase

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "resumaxing_secret")

# ---------------------------------------------------------------------------
# Hardcoded templates (no DB needed)
# ---------------------------------------------------------------------------

TEMPLATES = [
    {"id": 1, "name": "Modern Resume",       "html_file": "modern_resume.html",       "category": "Resume Template", "is_favorite": True},
    {"id": 2, "name": "Professional Resume", "html_file": "professional_resume.html", "category": "Resume Template", "is_favorite": False},
    {"id": 3, "name": "University Resume",   "html_file": "university_resume.html",   "category": "Resume Template", "is_favorite": False},
]

DEFAULT_CONTENT = {
    "modern_resume.html": {
        "name": "Your Name", "title": "Professional Title",
        "email": "email@example.com", "phone": "(555) 000-0000",
        "location": "City, State", "linkedin": "linkedin.com/in/yourname",
        "summary": "A motivated professional with experience in...",
        "experience": [{"role": "Job Title", "company": "Company Name", "dates": "Jan 2022 – Present", "bullets": ["Led key initiatives", "Improved processes by 20%"]}],
        "education": [{"degree": "B.S. in Your Major", "school": "University Name", "dates": "2018 – 2022"}],
        "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"]
    },
    "professional_resume.html": {
        "name": "Your Name", "title": "Senior Professional",
        "email": "email@example.com", "phone": "(555) 000-0000",
        "location": "City, State", "linkedin": "yourwebsite.com",
        "summary": "Results-driven professional with 5+ years of experience...",
        "experience": [{"role": "Senior Role", "company": "Company Name", "dates": "2020 – Present", "bullets": ["Managed a team of 10", "Delivered projects on time"]}],
        "education": [{"degree": "M.S. in Your Field", "school": "University Name", "dates": "2016 – 2018"}],
        "skills": ["Leadership", "Strategy", "Communication", "Analysis"]
    },
    "university_resume.html": {
        "name": "Your Name", "title": "Computer Science Student",
        "email": "email@university.edu", "phone": "(555) 000-0000",
        "location": "City, State", "linkedin": "linkedin.com/in/yourname",
        "summary": "Motivated student seeking internship opportunities...",
        "experience": [{"role": "Intern", "company": "Company / Lab", "dates": "Summer 2024", "bullets": ["Assisted with research", "Built a web application"]}],
        "education": [{"degree": "B.S. Computer Science", "school": "University Name", "dates": "2021 – 2025"}],
        "skills": ["Python", "JavaScript", "SQL", "Git"]
    }
}

# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "GET":
        return render_template("signup.html")
    data = request.get_json()
    try:
        res = supabase.auth.sign_up({
            "email": data.get("email"),
            "password": data.get("password")
        })
        if res.user:
            session["user"] = res.user.email
            return jsonify({"redirect": url_for("dashboard")})
        return jsonify({"error": "Signup failed. Please try again."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html")
    data = request.get_json()
    try:
        res = supabase.auth.sign_in_with_password({
            "email": data.get("email"),
            "password": data.get("password")
        })
        if res.user:
            session["user"] = res.user.email
            return jsonify({"redirect": url_for("dashboard")})
        return jsonify({"error": "Invalid email or password."}), 401
    except Exception as e:
        return jsonify({"error": "Invalid email or password."}), 401

@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    from gui.forgot_password_gui import ForgotPasswordGUI
    gui = ForgotPasswordGUI()
    if request.method == "POST":
        return gui.post()
    return gui.get()

@app.route("/reset-password", methods=["GET", "POST"])
def reset_password():
    from gui.reset_password_gui import ResetPasswordGUI
    gui = ResetPasswordGUI()
    if request.method == "POST":
        return gui.post()
    return gui.get()


def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

# ---------------------------------------------------------------------------
# Templates API
# ---------------------------------------------------------------------------

@app.route("/api/templates", methods=["GET"])
def get_templates():
<<<<<<< Updated upstream
    return jsonify(TEMPLATES)
=======
    return jsonify(db_select("templates"))
>>>>>>> Stashed changes

# ---------------------------------------------------------------------------
# Resume routes
# ---------------------------------------------------------------------------

@app.route("/resume/<int:tid>")
def resume(tid):
    if "user" not in session:
        return redirect(url_for("login"))
    template = next((t for t in TEMPLATES if t["id"] == tid), None)
    if not template:
        return "Template not found", 404

    # Look for existing user resume in Supabase
    try:
        result = supabase.table("user_resumes") \
            .select("*") \
            .eq("user_email", session["user"]) \
            .eq("template_id", tid) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        if result.data:
            row = result.data[0]
            content = json.loads(row["content"]) if isinstance(row["content"], str) else row["content"]
            return render_template("resume.html", resume=row, content=content)
    except Exception:
        pass

    # No existing resume — use default content
    content = DEFAULT_CONTENT.get(template["html_file"], DEFAULT_CONTENT["modern_resume.html"])
    fake_resume = {"id": f"new-{tid}", "title": template["name"]}
    return render_template("resume.html", resume=fake_resume, content=content)

@app.route("/api/user-resumes", methods=["GET"])
def get_user_resumes():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    try:
        result = supabase.table("user_resumes").select("*").eq("user_email", session["user"]).execute()
        return jsonify(result.data)
    except Exception:
        return jsonify([]), 200

@app.route("/api/resumes/<rid>", methods=["POST"])
def save_resume(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json()
    try:
        supabase.table("user_resumes").upsert({
            "user_email": session["user"],
            "template_id": data.get("template_id"),
            "title": data.get("title", "My Resume"),
            "content": json.dumps(data["content"])
        }).execute()
    except Exception:
        pass
    return jsonify({"saved": True})

if __name__ == "__main__":
    app.run(debug=True, port=3000)
