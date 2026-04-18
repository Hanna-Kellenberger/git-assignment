from models.user import User

class SignupController:
    def handle(self, email, password):
        valid, error = User.validate_password(password)
        if not valid:
            return False, error
        user, error = User.create(email, password)
        if not user:
            return False, error
        return True, None
