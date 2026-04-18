from models.user import User

class LoginController:
    def handle(self, email, password):
        user, error = User.login(email, password)
        if not user:
            return False, error
        return True, user
