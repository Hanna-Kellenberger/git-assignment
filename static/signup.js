const root = document.getElementById('root');

function render(error = '', loading = false) {
    root.innerHTML = `
        <div class="auth-page">
            <div class="auth-left">
                <img src="/static/assets/logo.svg" alt="Resumaxing" class="auth-logo" />
            </div>
            <div class="auth-card">
                <h2>Create an account</h2>
                ${error ? `<p class="flash-msg">${error}</p>` : ''}
                <form id="signupForm">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="emailInput" name="email" placeholder="Enter your email" required />
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <div class="input-wrap">
                            <input type="password" id="passwordInput" name="password" placeholder="Enter your password" required />
                            <span class="eye" id="eyeToggle">👁</span>
                        </div>
                    </div>
                    <button type="submit" class="btn-primary" ${loading ? 'disabled' : ''}>
                        ${loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>
                <p class="switch-auth">Already Have An Account? <a href="/login">Log in</a></p>
            </div>
        </div>
    `;

    document.getElementById('eyeToggle').addEventListener('click', () => {
        const input = document.getElementById('passwordInput');
        const eye = document.getElementById('eyeToggle');
        if (input.type === 'password') {
            input.type = 'text';
            eye.textContent = '🙈';
        } else {
            input.type = 'password';
            eye.textContent = '👁';
        }
    });

    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        const res = await fetch('/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ email, password })
        });
        if (res.redirected) {
            window.location.href = res.url;
        } else {
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const msg = doc.querySelector('.flash-msg');
            render(msg ? msg.textContent : 'Signup failed.');
        }
    });
}

render();
