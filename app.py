import os
import json
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from dotenv import load_dotenv
from supabase_client import supabase
from templates_data import TEMPLATES, TEMPLATE_TYPE_MAP, get_default_content

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
# Templates API — tries Supabase first, falls back to hardcoded list
# ---------------------------------------------------------------------------

@app.route("/api/templates", methods=["GET"])
def get_templates():
    try:
        result = supabase.table("templates").select("*").execute()
        if result.data:
            return jsonify(result.data)
    except Exception:
        pass
    return jsonify(TEMPLATES)

# ---------------------------------------------------------------------------
# Resume routes
# ---------------------------------------------------------------------------

def find_template(tid):
    """Find template by id from Supabase or fallback list."""
    try:
        result = supabase.table("templates").select("*").eq("id", tid).execute()
        if result.data:
            return result.data[0]
    except Exception:
        pass
    return next((t for t in TEMPLATES if t["id"] == tid), None)

@app.route("/resume/<int:tid>")
def resume(tid):
    """Always opens a fresh copy of the template — never loads saved data."""
    if "user" not in session:
        return redirect(url_for("login"))
    template = find_template(tid)
    if not template:
        return "Template not found", 404
    template_type = TEMPLATE_TYPE_MAP.get(template["html_file"], "modern")
    content = get_default_content(template["html_file"])
    # id="new-{tid}" signals the JS/save route this is a new resume
    fake_resume = {"id": f"new-{tid}", "title": template["name"], "template_id": tid}
    return render_template("resume.html", resume=fake_resume, content=content, template_type=template_type)

@app.route("/edit/<int:rid>")
def edit_resume(rid):
    """Opens a saved user resume for editing."""
    if "user" not in session:
        return redirect(url_for("login"))
    try:
        result = supabase.table("user_resume") \
            .select("*") \
            .eq("id", rid) \
            .eq("user_email", session["user"]) \
            .execute()
        if not result.data:
            return "Resume not found", 404
        row = result.data[0]
        content = json.loads(row["content"]) if isinstance(row["content"], str) else row["content"]
        content["_resumeTitle"] = row.get("title", "")
        template = find_template(row["template_id"])
        template_type = TEMPLATE_TYPE_MAP.get(template["html_file"], "modern") if template else "modern"
        return render_template("resume.html", resume=row, content=content, template_type=template_type)
    except Exception as e:
        return str(e), 500

# ---------------------------------------------------------------------------
# User resumes API
# ---------------------------------------------------------------------------

@app.route("/api/user-resumes", methods=["GET"])
def get_user_resumes():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    try:
        result = supabase.table("user_resume") \
            .select("*") \
            .eq("user_email", session["user"]) \
            .order("updated_at", desc=True) \
            .execute()
        return jsonify(result.data)
    except Exception:
        return jsonify([]), 200

@app.route("/api/resumes/<path:rid>", methods=["POST"])
def save_resume(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json()
    from datetime import datetime, timezone
    payload = {
        "user_email": session["user"],
        "template_id": data.get("template_id"),
        "title": data.get("title", "My Resume"),
        "content": json.dumps(data["content"]),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    try:
        if str(rid).startswith("new-"):
            # Fresh template copy — always insert a new row
            result = supabase.table("user_resume").insert(payload).execute()
            new_id = result.data[0]["id"] if result.data else None
            return jsonify({"saved": True, "id": new_id})
        else:
            # Editing existing resume — update by id
            supabase.table("user_resume").update(payload).eq("id", int(rid)).eq("user_email", session["user"]).execute()
            return jsonify({"saved": True, "id": int(rid)})
    except Exception as e:
        print("Save error:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/user-resumes/<int:rid>/favorite", methods=["PATCH"])
def toggle_resume_favorite(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    try:
        current = supabase.table("user_resume").select("is_favorite").eq("id", rid).eq("user_email", session["user"]).execute()
        if not current.data:
            return jsonify({"error": "not found"}), 404
        new_val = not current.data[0]["is_favorite"]
        supabase.table("user_resume").update({"is_favorite": new_val}).eq("id", rid).execute()
        return jsonify({"is_favorite": new_val})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user-resumes/<int:rid>", methods=["DELETE"])
def delete_user_resume(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    try:
        supabase.table("user_resume").delete().eq("id", rid).eq("user_email", session["user"]).execute()
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"deleted": rid})

@app.route("/api/suggest-skills", methods=["POST"])
def suggest_skills():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    body = request.get_json()
    title = body.get("title", "")
    summary = body.get("summary", "")
    existing = body.get("skills", [])

    prompt = (
        f"You are a resume expert. Based on the following information, suggest 8-10 relevant skills "
        f"the person should add to their resume. Return ONLY a JSON array of skill strings, nothing else.\n\n"
        f"Job Title: {title}\n"
        f"Summary: {summary}\n"
        f"Current Skills: {', '.join(existing) if existing else 'none'}\n\n"
        f"Respond with only a JSON array like: [\"Skill 1\", \"Skill 2\", ...]"
    )

    try:
        import urllib.error
        import ollama_client

        try:
            text = ollama_client.generate(prompt)
        except urllib.error.URLError:
            return jsonify({"error": "Ollama is not running. Start it with: ollama serve"}), 503
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 503

        start = text.find("[")
        end = text.rfind("]") + 1
        if start == -1 or end == 0:
            return jsonify({"error": "No suggestions returned"}), 500
        suggestions = json.loads(text[start:end])
        existing_lower = [s.lower() for s in existing]
        suggestions = [s for s in suggestions if s.lower() not in existing_lower]
        return jsonify({"suggestions": suggestions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
