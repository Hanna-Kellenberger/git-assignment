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
git clone https://github.com/Hanna-Kellenberger/git-assignment.git
cd git-assignment
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
