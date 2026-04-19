from flask import render_template, request, flash
from supabase_client import auth_forgot_password

class ForgotPasswordGUI:
    def get(self):
        return render_template("forgot_password.html")

    def post(self):
        email = request.form.get("email", "").strip()
        if not email:
            flash("Please enter your email.")
            return render_template("forgot_password.html")
        status = auth_forgot_password(email)
        flash("If an account exists for that email, a reset link has been sent.")
        return render_template("forgot_password.html")
