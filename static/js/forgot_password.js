const root = document.getElementById('root');
const flashEl = document.getElementById('flash');
const flashMsg = flashEl ? flashEl.dataset.message : '';

root.innerHTML = `
    <div class="auth-page">
        <div class="auth-left">
            <img src="/static/assets/logo.svg" alt="Resumaxing" class="auth-logo" />
        </div>
        <div class="auth-card">
            <h2>Reset your password</h2>
            ${flashMsg ? `<p class="flash-msg">${flashMsg}</p>` : ''}
            <form method="POST" action="/forgot-password">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" placeholder="Enter your email" required />
                </div>
                <button type="submit" class="btn-primary">Send reset link</button>
            </form>
            <p class="switch-auth">Remember your password? <a href="/login">Log in</a></p>
        </div>
    </div>
`;
