from flask import render_template, request, redirect, url_for, flash
from controllers.signup_controller import SignupController

class SignupGUI:
    def __init__(self):
        self.controller = SignupController()

    def get(self):
        return render_template("signup.html")

    def post(self):
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()
        success, error = self.controller.handle(email, password)
        if success:
            return redirect(url_for("login"))
        flash(error)
        return render_template("signup.html")
