const root = document.getElementById('root');

let showPassword = false;

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
                        <input type="email" name="email" placeholder="Enter your email" required />
                    </div>
                    <div class="form-group">
                        <div class="label-row">
                            <label>Password</label>
                            <a href="#" class="forgot">Forgot Password ?</a>
                        </div>
                        <div class="input-wrap">
                            <input type="${showPassword ? 'text' : 'password'}" name="password" placeholder="Enter your password" required />
                            <span class="eye" id="eyeToggle">${showPassword ? '🙈' : '👁'}</span>
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
        showPassword = !showPassword;
        render(error, loading);
    });

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        render('', true);
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: form.email.value,
                password: form.password.value
            })
        });
        const data = await res.json();
        if (data.redirect) {
            window.location.href = data.redirect;
        } else {
            render(data.error || 'Login failed.');
        }
    });
}

render();
