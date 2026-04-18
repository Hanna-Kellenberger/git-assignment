import os
from dotenv import load_dotenv
from flask import Flask, redirect, url_for, session, jsonify, request, render_template
from supabase_client import db_select, db_insert, db_update, db_delete
from gui.index_gui import IndexGUI
from gui.signup_gui import SignupGUI
from gui.login_gui import LoginGUI

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "resumaxing_secret")

@app.route("/")
def index():
    return IndexGUI().get()

@app.route("/signup", methods=["GET", "POST"])
def signup():
    gui = SignupGUI()
    if request.method == "POST":
        return gui.post()
    return gui.get()

@app.route("/login", methods=["GET", "POST"])
def login():
    gui = LoginGUI()
    if request.method == "POST":
        return gui.post()
    return gui.get()

@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect(url_for("login"))

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template("dashboard.html")

@app.route("/api/templates", methods=["GET"])
def get_templates():
    result = db_select("templates")
    return jsonify(result)

@app.route("/api/templates", methods=["POST"])
def create_template():
    data = request.get_json()
    name = data.get("name", "").strip()
    html_file = data.get("html_file", "").strip()
    category = data.get("category", "Resume Template").strip()
    if not name or not html_file:
        return jsonify({"error": "name and html_file are required"}), 400
    result = db_insert("templates", {"name": name, "html_file": html_file, "category": category})
    return jsonify(result[0] if result else {}), 201

@app.route("/api/templates/<int:tid>", methods=["PUT"])
def update_template(tid):
    data = request.get_json()
    result = db_update("templates", tid, {
        "name": data["name"],
        "html_file": data["html_file"],
        "category": data.get("category", "Resume Template"),
        "is_favorite": data.get("is_favorite", False)
    })
    return jsonify(result[0] if result else {})

@app.route("/api/templates/<int:tid>/favorite", methods=["PATCH"])
def toggle_favorite(tid):
    rows = db_select("templates", {"id": tid})
    if not rows:
        return jsonify({"error": "not found"}), 404
    new_val = not rows[0]["is_favorite"]
    db_update("templates", tid, {"is_favorite": new_val})
    return jsonify({"is_favorite": new_val})

@app.route("/api/templates/<int:tid>", methods=["DELETE"])
def delete_template(tid):
    db_delete("templates", tid)
    return jsonify({"deleted": tid})

@app.route("/resume/<int:tid>")
def resume(tid):
    if "user" not in session:
        return redirect(url_for("login"))
    rows = db_select("templates", {"id": tid})
    if not rows:
        return "Template not found", 404
    return render_template("resume.html", template=rows[0])

if __name__ == "__main__":
    app.run(debug=True)
