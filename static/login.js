const root = document.getElementById('root');

function render(error = '', loading = false) {
    root.innerHTML = `
        <div class="auth-page">
            <div class="auth-left">
                <img src="/static/assets/logo.svg" alt="Resumaxing" class="auth-logo" />
            </div>
            <div class="auth-card">
                <h2>Login to your account</h2>
                ${error ? `<p class="flash-msg">${error}</p>` : ''}
                <form id="loginForm">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="emailInput" name="email" placeholder="Enter your email" required />
                    </div>
                    <div class="form-group">
                        <div class="label-row">
                            <label>Password</label>
                            <a href="/forgot-password" class="forgot">Forgot Password ?</a>
                        </div>
                        <div class="input-wrap">
                            <input type="password" id="passwordInput" name="password" placeholder="Enter your password" required />
                            <span class="eye" id="eyeToggle">👁</span>
                        </div>
                    </div>
                    <button type="submit" class="btn-primary" ${loading ? 'disabled' : ''}>
                        ${loading ? 'Logging in...' : 'Login now'}
                    </button>
                </form>
                <p class="switch-auth">Don't Have An Account? <a href="/signup">Sign Up</a></p>
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

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        const res = await fetch('/login', {
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
            render(msg ? msg.textContent : 'Login failed.');
        }
    });
}

render();
