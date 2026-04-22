import re
from flask import render_template, request, redirect, url_for, session, jsonify
from controllers.supabase_client import auth_login

def validate_password(password):
    if len(password) < 8 or len(password) > 18:
        return False, "Password must be 8-18 characters with 1 capital letter and 1 special character"
    if not re.search(r'[A-Z]', password):
        return False, "Password must include at least 1 capital letter"
    if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
        return False, "Password must include at least 1 special character"
    return True, None

def login_get():
    return render_template("login.html")

def login_post():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    result = auth_login(email, password)
    if result.get("access_token"):
        user = result.get("user", {})
        session["user"] = user.get("email", email)
        return jsonify({"redirect": url_for("dashboard")})
    return jsonify({"error": "Email or password is invalid, try again"}), 401

def logout():
    session.pop("user", None)
    return redirect(url_for("login"))
