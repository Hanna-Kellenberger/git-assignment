from flask import render_template, request, redirect, url_for, flash, session
from controllers.login_controller import LoginController

class LoginGUI:
    def __init__(self):
        self.controller = LoginController()

    def get(self):
        return render_template("login.html")

    def post(self):
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()
        success, result = self.controller.handle(email, password)
        if success:
            session["user"] = result.email
            return redirect(url_for("dashboard"))
        flash(result)
        return render_template("login.html")
