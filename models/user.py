import re
from supabase_client import auth_signup, auth_login

class User:
    def __init__(self, email, user_id=None):
        self.id = user_id
        self.email = email

    @staticmethod
    def validate_password(password):
        if len(password) < 8 or len(password) > 18:
            return False, "Please try another password that is 8-18 characters, has 1 capital letter and 1 special character"
        if not re.search(r'[A-Z]', password):
            return False, "Please try another password that is 8-18 characters, has 1 capital letter and 1 special character"
        if not re.search(r'[!@#$%^&*(),.?\":{}|<>]', password):
            return False, "Please try another password that is 8-18 characters, has 1 capital letter and 1 special character"
        return True, None

    @staticmethod
    def create(email, password):
        result = auth_signup(email, password)
        print("SIGNUP RESPONSE:", result)
        user_data = result.get("user") or result
        uid = user_data.get("id") if isinstance(user_data, dict) else None
        if uid:
            return User(email=email, user_id=uid), None
        msg = result.get("msg") or result.get("message") or result.get("error_description") or result.get("error") or "Account could not be created."
        if "already registered" in str(msg).lower():
            return None, "Account already exists. Please log in."
        return None, str(msg)

    @staticmethod
    def login(email, password):
        result = auth_login(email, password)
        print("LOGIN RESPONSE:", result)
        if result.get("access_token"):
            user = result.get("user", {})
            return User(email=user.get("email"), user_id=user.get("id")), None
        return None, "Email or password is invalid, try again"
