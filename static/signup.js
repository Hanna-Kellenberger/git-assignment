const root = document.getElementById('root');

let showPassword = false;

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
                        <input type="email" name="email" placeholder="Enter your email" required />
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <div class="input-wrap">
                            <input type="${showPassword ? 'text' : 'password'}" name="password" placeholder="Enter your password" required />
                            <span class="eye" id="eyeToggle">${showPassword ? '🙈' : '👁'}</span>
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
        showPassword = !showPassword;
        render(error, loading);
    });

    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        render('', true);
        const res = await fetch('/signup', {
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
            render(data.error || 'Signup failed.');
        }
    });
}

render();
