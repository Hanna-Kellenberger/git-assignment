import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

  
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(url, key)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def auth_signup(email, password):
    res = requests.post(
        f"{SUPABASE_URL}/auth/v1/signup",
        json={"email": email, "password": password},
        headers=HEADERS
    )
    return res.json()

def auth_login(email, password):
    res = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": email, "password": password},
        headers=HEADERS
    )
    return res.json()

def db_select(table, filters=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}?select=*"
    if filters:
        for k, v in filters.items():
            url += f"&{k}=eq.{v}"
    res = requests.get(url, headers=HEADERS)
    return res.json()

def db_insert(table, data):
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        json=data,
        headers={**HEADERS, "Prefer": "return=representation"}
    )
    return res.json()

def db_update(table, row_id, data):
    res = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}",
        json=data,
        headers={**HEADERS, "Prefer": "return=representation"}
    )
    return res.json()

def db_delete(table, row_id):
    res = requests.delete(
        f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}",
        headers=HEADERS
    )
    return res.status_code
