import re
from flask import render_template, request, url_for, session, jsonify
from controllers.supabase_client import auth_signup
from controllers.login_controller import validate_password

def signup_get():
    return render_template("signup.html")

def signup_post():
    data = request.get_json()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    valid, error = validate_password(password)
    if not valid:
        return jsonify({"error": error}), 400

    result = auth_signup(email, password)
    user_data = result.get("user") or result
    uid = user_data.get("id") if isinstance(user_data, dict) else None

    if uid:
        session["user"] = email
        return jsonify({"redirect": url_for("dashboard")})

    msg = (result.get("msg") or result.get("message") or
           result.get("error_description") or result.get("error") or
           "Account could not be created.")
    if "already registered" in str(msg).lower():
        return jsonify({"error": "Account already exists. Please log in."}), 400
    return jsonify({"error": str(msg)}), 400
