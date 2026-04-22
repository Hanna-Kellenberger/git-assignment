from flask import render_template, request, redirect, url_for, flash
from controllers.supabase_client import auth_forgot_password, auth_update_password
from controllers.login_controller import validate_password

def forgot_password_get():
    return render_template("forgot_password.html")

def forgot_password_post():
    email = request.form.get("email", "").strip()
    if not email:
        flash("Please enter your email.")
        return render_template("forgot_password.html")
    auth_forgot_password(email)
    flash("If an account exists for that email, a reset link has been sent.")
    return render_template("forgot_password.html")

def reset_password_get():
    access_token = request.args.get("access_token", "")
    return render_template("reset_password.html", access_token=access_token)

def reset_password_post():
    access_token = request.form.get("access_token", "")
    new_password = request.form.get("password", "").strip()

    valid, error = validate_password(new_password)
    if not valid:
        flash(error)
        return render_template("reset_password.html", access_token=access_token)

    result = auth_update_password(access_token, new_password)
    if result.get("id") or result.get("email"):
        flash("Password updated successfully. Please log in.")
        return redirect(url_for("login"))

    flash("Reset failed. The link may have expired.")
    return render_template("reset_password.html", access_token=access_token)
