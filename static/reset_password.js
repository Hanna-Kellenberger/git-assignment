const root = document.getElementById('root');
const flashEl = document.getElementById('flash');
const flashMsg = flashEl ? flashEl.dataset.message : '';

const token = ACCESS_TOKEN || new URLSearchParams(window.location.hash.substring(1)).get('access_token') || '';

root.innerHTML = `
    <div class="auth-page">
        <div class="auth-left">
            <img src="/static/assets/logo.svg" alt="Resumaxing" class="auth-logo" />
        </div>
        <div class="auth-card">
            <h2>Set new password</h2>
            ${flashMsg ? `<p class="flash-msg">${flashMsg}</p>` : ''}
            <form method="POST" action="/reset-password">
                <input type="hidden" name="access_token" value="${token}" />
                <div class="form-group">
                    <label>New Password</label>
                    <div class="input-wrap">
                        <input type="password" id="passwordInput" name="password" placeholder="Enter new password" required />
                        <span class="eye" id="eyeToggle">👁</span>
                    </div>
                </div>
                <button type="submit" class="btn-primary">Update password</button>
            </form>
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
