const root = document.getElementById('root');
const flash = document.getElementById('flash').dataset.message;

root.innerHTML = `
  <div class="auth-page">
    <div class="auth-left">
      <img src="/static/assets/logo.svg" alt="Resumaxing" class="auth-logo" />
    </div>
    <div class="auth-card">
      <h2>Login to your account</h2>
      ${flash ? `<p class="flash-msg">${flash}</p>` : ''}
      <form method="POST" action="/login">
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
            <input type="password" name="password" id="loginPass" placeholder="Enter your password" required />
            <span class="eye" id="loginEye">👁</span>
          </div>
        </div>
        <button type="submit" class="btn-primary">Login now</button>
      </form>
      <p class="switch-auth">Don't Have An Account? <a href="/signup">Sign Up</a></p>
    </div>
  </div>
`;

document.getElementById('loginEye').addEventListener('click', function () {
  const input = document.getElementById('loginPass');
  if (input.type === 'password') {
    input.type = 'text';
    this.textContent = '🙈';
  } else {
    input.type = 'password';
    this.textContent = '👁';
  }
});
