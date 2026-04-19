import json
import urllib.request
import urllib.error

OLLAMA_BASE = "http://localhost:11434"

def get_available_model():
    """Returns the first available Ollama model, or raises if none found."""
    req = urllib.request.Request(f"{OLLAMA_BASE}/api/tags")
    with urllib.request.urlopen(req, timeout=5) as r:
        tags = json.loads(r.read())
        models = [m["name"] for m in tags.get("models", [])]
    if not models:
        raise RuntimeError("No Ollama models found. Run: ollama pull llama3.2")
    return models[0]

def generate(prompt, timeout=60):
    """Send a prompt to Ollama and return the response text."""
    model = get_available_model()
    print(f"Using Ollama model: {model}")
    payload = json.dumps({
        "model": model,
        "prompt": prompt,
        "stream": False
    }).encode()
    req = urllib.request.Request(
        f"{OLLAMA_BASE}/api/generate",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        result = json.loads(resp.read())
        return result.get("response", "")
