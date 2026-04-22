import json
from datetime import datetime, timezone
from flask import render_template, request, redirect, url_for, session, jsonify
from controllers.supabase_client import db_select, db_insert, db_update, db_delete
from controllers.templates_data import TEMPLATES, TEMPLATE_TYPE_MAP, get_default_content

def find_template(tid):
    return next((t for t in TEMPLATES if t["id"] == tid), None)

def get_templates():
    return jsonify(TEMPLATES)

def resume_new(tid):
    if "user" not in session:
        return redirect(url_for("login"))
    template = find_template(tid)
    if not template:
        return "Template not found", 404
    template_type = TEMPLATE_TYPE_MAP.get(template["html_file"], "modern")
    content = get_default_content(template["html_file"])
    fake_resume = {"id": f"new-{tid}", "title": template["name"], "template_id": tid}
    return render_template("resume.html", resume=fake_resume, content=content, template_type=template_type)

def resume_edit(rid):
    if "user" not in session:
        return redirect(url_for("login"))
    try:
        rows = db_select("user_resume", {"id": rid, "user_email": session["user"]})
        if not rows:
            return "Resume not found", 404
        row = rows[0]
        content = json.loads(row["content"]) if isinstance(row["content"], str) else row["content"]
        content["_resumeTitle"] = row.get("title", "")
        template = find_template(row["template_id"])
        template_type = TEMPLATE_TYPE_MAP.get(template["html_file"], "modern") if template else "modern"
        return render_template("resume.html", resume=row, content=content, template_type=template_type)
    except Exception as e:
        return str(e), 500

def get_user_resumes():
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    try:
        rows = db_select("user_resume", {"user_email": session["user"]})
        return jsonify(rows)
    except Exception:
        return jsonify([]), 200

def save_resume(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    data = request.get_json()
    payload = {
        "user_email": session["user"],
        "template_id": data.get("template_id"),
        "title": data.get("title", "My Resume"),
        "content": json.dumps(data["content"]),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    try:
        if str(rid).startswith("new-"):
            result = db_insert("user_resume", payload)
            new_id = result[0]["id"] if result else None
            return jsonify({"saved": True, "id": new_id})
        else:
            db_update("user_resume", int(rid), payload)
            return jsonify({"saved": True, "id": int(rid)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def toggle_favorite(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    try:
        rows = db_select("user_resume", {"id": rid, "user_email": session["user"]})
        if not rows:
            return jsonify({"error": "not found"}), 404
        new_val = not rows[0]["is_favorite"]
        db_update("user_resume", rid, {"is_favorite": new_val})
        return jsonify({"is_favorite": new_val})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def delete_user_resume(rid):
    if "user" not in session:
        return jsonify({"error": "unauthorized"}), 401
    try:
        db_delete("user_resume", rid)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"deleted": rid})

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
        f"Job Title: {title}\nSummary: {summary}\nCurrent Skills: {', '.join(existing) if existing else 'none'}\n\n"
        f"Respond with only a JSON array like: [\"Skill 1\", \"Skill 2\", ...]"
    )
    try:
        import urllib.error
        from controllers import ollama_client
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
