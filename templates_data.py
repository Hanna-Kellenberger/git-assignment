# Default field values shared across all resume types
DEFAULT_FIELDS = {
    "name":     "Your Name",
    "title":    "Professional Title",
    "email":    "email@example.com",
    "phone":    "(555) 000-0000",
    "location": "City, State",
    "linkedin": "linkedin.com/in/yourname",
    "summary":  "A motivated professional with experience in...",
    "gpa":      "3.8",
    "experience": [
        {
            "role":    "Job Title",
            "company": "Company Name",
            "dates":   "Jan 2022 – Present",
            "bullets": ["Led key initiatives", "Improved processes by 20%"]
        }
    ],
    "education": [
        {
            "degree": "B.S. in Your Major",
            "school": "University Name",
            "dates":  "2018 – 2022"
        }
    ],
    "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
    "projects": [
        {
            "name":        "Project Name",
            "description": "Built a full-stack web application."
        }
    ],
    "certifications": ["Certification 1", "Certification 2"]
}

# Template definitions — mirrors the Supabase templates table
TEMPLATES = [
    {"id": 1, "name": "Modern Resume",       "html_file": "modern_resume.html",       "category": "Resume Template", "is_favorite": True},
    {"id": 2, "name": "Professional Resume", "html_file": "professional_resume.html", "category": "Resume Template", "is_favorite": False},
    {"id": 3, "name": "University Resume",   "html_file": "university_resume.html",   "category": "Resume Template", "is_favorite": False},
]

# Maps html_file -> template_type key used by the editor
TEMPLATE_TYPE_MAP = {
    "modern_resume.html":       "modern",
    "professional_resume.html": "professional",
    "university_resume.html":   "university",
}

def get_default_content(html_file):
    """Return default content for a given template html_file."""
    import copy
    return copy.deepcopy(DEFAULT_FIELDS)
