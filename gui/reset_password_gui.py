from flask import render_template, request, flash, redirect, url_for
from supabase_client import auth_update_password
from models.user import User

class ResetPasswordGUI:
    def get(self):
        access_token = request.args.get("access_token", "")
        return render_template("reset_password.html", access_token=access_token)

    def post(self):
        access_token = request.form.get("access_token", "")
        new_password = request.form.get("password", "").strip()

        valid, error = User.validate_password(new_password)
        if not valid:
            flash(error)
            return render_template("reset_password.html", access_token=access_token)

        result = auth_update_password(access_token, new_password)
        if result.get("id") or result.get("email"):
            flash("Password updated successfully. Please log in.")
            return redirect(url_for("login"))

        flash("Reset failed. The link may have expired. Please try again.")
        return render_template("reset_password.html", access_token=access_token)
