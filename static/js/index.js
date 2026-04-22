const hash = window.location.hash;
if (hash.includes('access_token') && hash.includes('type=recovery')) {
    window.location.href = '/reset-password' + hash;
}
if (hash.includes('error=access_denied')) {
    const params = new URLSearchParams(hash.substring(1));
    const msg = params.get('error_description') || 'Link expired.';
    document.addEventListener('DOMContentLoaded', () => {
        const root = document.getElementById('root');
        if (root) root.insertAdjacentHTML('afterbegin', `<p style="color:red;text-align:center;padding:10px">${msg.replace(/\+/g,' ')} <a href="/forgot-password">Request a new link</a></p>`);
    });
}

const root = document.getElementById('root');

root.innerHTML = `
  <div class="hero">
    <div class="logo-wrap">
      <img src="/static/assets/logo.svg" alt="Resumaxing" class="hero-logo" />
      <p class="tagline">Start your resumaxing journey with us</p>
    </div>
    <a href="/signup"><button class="get-started">Get Started</button></a>
  </div>
`;
