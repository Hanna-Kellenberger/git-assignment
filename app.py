import os
from flask import Flask, render_template, redirect, url_for, session, jsonify, request
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "resumaxing_secret")

# ── Import controllers ──
from controllers.login_controller import login_get, login_post, logout
from controllers.signup_controller import signup_get, signup_post
from controllers.forgot_password_controller import (
    forgot_password_get, forgot_password_post,
    reset_password_get, reset_password_post
)
from controllers.resume_controller import (
    get_templates, resume_new, resume_edit,
    get_user_resumes, save_resume,
    toggle_favorite, delete_user_resume, suggest_skills
)

# ── Pages ──
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("dashboard.html")

# ── Auth ──
@app.route("/login", methods=["GET", "POST"])
def login():
    return login_get() if request.method == "GET" else login_post()

@app.route("/signup", methods=["GET", "POST"])
def signup():
    return signup_get() if request.method == "GET" else signup_post()

@app.route("/logout")
def logout_route():
    return logout()

@app.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    return forgot_password_get() if request.method == "GET" else forgot_password_post()

@app.route("/reset-password", methods=["GET", "POST"])
def reset_password():
    return reset_password_get() if request.method == "GET" else reset_password_post()

# ── API ──
@app.route("/api/me")
def me():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    return jsonify({"email": session["user"]})

@app.route("/api/templates")
def api_templates():
    return get_templates()

@app.route("/resume/<int:tid>")
def resume(tid):
    return resume_new(tid)

@app.route("/edit/<int:rid>")
def edit_resume(rid):
    return resume_edit(rid)

@app.route("/api/user-resumes")
def api_user_resumes():
    return get_user_resumes()

@app.route("/api/resumes/<path:rid>", methods=["POST"])
def api_save_resume(rid):
    return save_resume(rid)

@app.route("/api/user-resumes/<path:rid>/favorite", methods=["PATCH"])
def api_toggle_favorite(rid):
    return toggle_favorite(rid)

@app.route("/api/user-resumes/<path:rid>", methods=["DELETE"])
def api_delete_resume(rid):
    return delete_user_resume(rid)

@app.route("/api/suggest-skills", methods=["POST"])
def api_suggest_skills():
    return suggest_skills()

if __name__ == "__main__":
    app.run(debug=True, port=3000)
