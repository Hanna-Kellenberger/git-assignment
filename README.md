Class: 3354.002
<br>Professor: Srimathi Srinivasan

<h2>Team Details:</h2>
Team #7
<br>Team Name: Resumaxing
<br><h4>Team names:</h4>

- Hanna Kellenberger
- Deepshikha Machireddy
- Ivan Leong​
- Josias Acha

<h4>Statement of Work: </h4>
This project’s main objective is to design a website that allows users to autonomously build a resume using just a few inputs. An optional objective that goes hand in hand with the main objective is to collect keywords from job descriptions and match resumes. The main goal is to create a working and feasible website that can be used without failure or any major bugs. 


---

## Setup Instructions

### Prerequisites
- Python 3.10+
- [Ollama](https://ollama.com) (for AI skill suggestions)

---

### 1. Clone the repo
```bash
git clone https://github.com/Hannak1001/Resumaxing.git
cd Resumaxing
```

### 2. Create and activate a virtual environment
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment variables
Create a `.env` file in the root of the project:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
FLASK_SECRET_KEY=your_secret_key
```

### 5. Set up Ollama (AI Skill Suggestions)

Ollama runs AI models locally on your machine — no API key required.

**Install Ollama:**
- macOS / Linux: `curl -fsSL https://ollama.com/install.sh | sh`
- Windows: Download the installer from [ollama.com](https://ollama.com)

**Start Ollama:**
```bash
ollama serve
```

**Pull a model** (run this once):
```bash
ollama pull llama3.2
```
> Any model works. `llama3.2` (~2GB) is a good default. The app automatically detects whichever model you have installed.

**Verify it's working:**
```bash
curl http://localhost:11434/api/tags
```
You should see a JSON response listing your downloaded models.

> If you skip this step, the app still works — the "Suggest Skills" button will just show an error message until Ollama is running.

### 6. Run the app
```bash
python app.py
```

Visit `http://localhost:5000` in your browser.



---

## Supabase Setup

Create a new Supabase project at [supabase.com](https://supabase.com), then set up the following tables.

### Table: `templates`

Stores the resume template definitions.

| Column | Type | Notes |
|---|---|---|
| `id` | int8 | Primary key, auto-increment |
| `name` | text | e.g. "Modern Resume" |
| `html_file` | text | e.g. "modern_resume.html" |
| `category` | text | e.g. "Resume Template" |

**Seed data** — insert these 3 rows manually via the Supabase Table Editor:

| name | html_file | category |
|---|---|---|
| Modern Resume | modern_resume.html | Resume Template |
| Professional Resume | professional_resume.html | Resume Template |
| University Resume | university_resume.html | Resume Template |

---

### Table: `user_resume`

Stores each user's saved resumes.

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | int8 | auto-increment | Primary key |
| `user_email` | text | — | The logged-in user's email |
| `template_id` | int4 | — | References `templates.id` |
| `title` | text | — | Resume title set by user |
| `content` | text | — | JSON string of resume data |
| `is_favorite` | bool | `false` | Starred by user |
| `created_at` | timestamptz | `now()` | Auto-set on insert |
| `updated_at` | timestamptz | `now()` | Update manually on save |

---

### Row Level Security (RLS)

Enable RLS on `user_resume` and add the following policies so the app can read, insert, update, and delete rows:

```sql
-- Allow all operations (the app uses the anon key server-side via Flask)
CREATE POLICY "Allow insert" ON user_resume FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select" ON user_resume FOR SELECT USING (true);
CREATE POLICY "Allow update" ON user_resume FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete" ON user_resume FOR DELETE USING (true);
```

> Run these in the Supabase **SQL Editor** (Database → SQL Editor → New query).

---

### Authentication

Enable **Email/Password** sign-in under **Authentication → Providers → Email**.

The app uses Supabase Auth for signup and login — no additional configuration needed beyond enabling the provider.
