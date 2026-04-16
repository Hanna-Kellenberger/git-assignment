import os
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from dotenv import load_dotenv
from supabase_client import supabase

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "resumaxing_secret")

# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("dashboard.html")

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

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

@app.route("/logout")
def logout():
    supabase.auth.sign_out()
    session.pop("user", None)
    return redirect(url_for("login"))

# ---------------------------------------------------------------------------
# Templates API
# ---------------------------------------------------------------------------

@app.route("/api/templates", methods=["GET"])
def get_templates():
    try:
        result = supabase.table("templates").select("*").order("created_at", desc=True).execute()
        return jsonify(result.data)
    except Exception:
        return jsonify([]), 200

if __name__ == "__main__":
    app.run(debug=True)
