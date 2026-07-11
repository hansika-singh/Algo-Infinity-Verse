(function () {
  document.documentElement.classList.add('auth-loading');
  const privateHashes = new Set(['#dashboard', '#profile']);
  let currentSession = null;
  let authReady = false;

  function isAuthPage() {
    return (
      location.pathname === '/login' ||
      location.pathname.endsWith('/login.html') ||
      location.pathname === '/signup' ||
      location.pathname.endsWith('/signup.html')
    );
  }

  function authUrl(path) {
    if (location.protocol === 'file:') return path.endsWith('.html') ? path : `${path}.html`;
    return path;
  }

  function nextUrl() {
    return `${location.pathname}${location.search}${location.hash}`;
  }

  async function getSession() {
    if (location.protocol === 'file:') return { authenticated: false, user: null };

    try {
      const response = await fetch('/api/session', {
        credentials: 'include',
      });
      if (!response.ok) return { authenticated: false, user: null };
      return response.json();
    } catch {
      return { authenticated: false, user: null };
    }
  }

  function loginRedirect() {
    location.href = `${authUrl('/login')}?next=${encodeURIComponent(nextUrl())}`;
  }

  function guardPrivateHash() {
    if (!authReady) return;

    if (privateHashes.has(location.hash) && !currentSession?.authenticated) {
      loginRedirect();
    }
  }

  function updateProfileNames(user) {
    if (!user) {
      ['profileName', 'profileSectionName', 'dashboardProfileName', 'profileNameInput'].forEach(
        (id) => {
          const element = document.getElementById(id);
          if (!element) return;

          if (element.tagName === 'INPUT') element.value = '';
          else element.textContent = 'Learner';
        }
      );

      document
        .querySelectorAll('[data-auth-user-name]')
        .forEach((el) => (el.textContent = 'Learner'));

      document.querySelectorAll('[data-auth-user-email]').forEach((el) => (el.textContent = ''));

      document.querySelectorAll('[data-auth-avatar]').forEach((el) => {
        el.style.display = 'none';
      });
      return;
    }

    ['profileName', 'profileSectionName', 'dashboardProfileName', 'profileNameInput'].forEach(
      (id) => {
        const element = document.getElementById(id);
        if (!element) return;

        if (element.tagName === 'INPUT') element.value = user.name;
        else {
          element.textContent = user.name;
        }
      }
    );

    document
      .querySelectorAll('[data-auth-user-name]')
      .forEach((el) => (el.textContent = user.name));

    document
      .querySelectorAll('[data-auth-user-email]')
      .forEach((el) => (el.textContent = user.email));

    document.querySelectorAll('[data-auth-avatar]').forEach((el) => {
      if (user && user.avatar) {
        el.src = user.avatar;
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'none';
      }
    });

    const supportName = document.querySelector(".support-form input[placeholder='Name']");
    const supportEmail = document.querySelector(".support-form input[placeholder='Email']");

    if (supportName && !supportName.value) supportName.value = user.name;
    if (supportEmail && !supportEmail.value) supportEmail.value = user.email;
  }

  function renderAuthNav() {
    function inject() {
      document.querySelectorAll('.nav-links').forEach((navLinks) => {
        let slot = navLinks.querySelector('.auth-nav-item');

        if (!slot) {
          slot = document.createElement('li');
          slot.className = 'auth-nav-item';
          navLinks.appendChild(slot);
        }

        if (currentSession?.authenticated) {
          slot.innerHTML = '';

          const chip = document.createElement('span');
          chip.className = 'nav-user-chip';
          chip.title = currentSession.user.email;
          const nameEl = document.createElement('span');
          nameEl.textContent = currentSession.user.name;
          if (currentSession.user.avatar) {
            const avatarEl = document.createElement('img');
            avatarEl.className = 'nav-avatar';
            avatarEl.alt = '';
            avatarEl.setAttribute('data-auth-avatar', '');
            avatarEl.src = currentSession.user.avatar;
            chip.append(avatarEl, nameEl);
          } else {
            const iconEl = document.createElement('i');
            iconEl.className = 'fas fa-user-circle';
            chip.append(iconEl, nameEl);
          }
          chip.querySelector('span').textContent = currentSession.user.name;

          const btn = document.createElement('button');
          btn.className = 'nav-auth-link';
          btn.type = 'button';
          btn.setAttribute('data-auth-logout', '');
          btn.innerHTML = `<i class="fas fa-right-from-bracket"></i> Logout`;

          slot.append(chip, btn);
        } else {
          slot.innerHTML = `
            <a class="nav-auth-link" href="${authUrl('/login')}">
              <i class="fas fa-right-to-bracket"></i>
              Login
            </a>
            <button class="nav-auth-link nav-auth-guest" data-auth-guest type="button">
              <i class="fas fa-user-astronaut"></i>
              Continue as Guest
            </button>
            <a class="nav-auth-link nav-auth-primary" href="${authUrl('/signup')}">
              Sign Up
            </a>
          `;
        }
      });
    }

    if (document.querySelector('.nav-links')) {
      inject();
    } else {
      const observer = new MutationObserver(() => {
        if (document.querySelector('.nav-links')) {
          observer.disconnect();
          inject();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  function wireLogout() {
    document.addEventListener('click', async (event) => {
      const logoutButton = event.target.closest('[data-auth-logout]');
      if (!logoutButton) return;

      event.preventDefault();
      if (!confirm('Are you sure you want to logout?')) return;
      logoutButton.disabled = true;

      if (location.protocol !== 'file:') {
        try {
          const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include',
          });

          if (!response.ok) throw new Error('Logout failed.');

          if (window.__supabaseClient) {
            try {
              await window.__supabaseClient.signOutUser();
            } catch (e) {
              void 0;
            }
          }
        } catch (error) {
          void 0;
          logoutButton.disabled = false;
          return;
        }
      }

      location.href = authUrl('/login');
    }); // ✅ closes addEventListener
  } // ✅ closes wireLogout

  function wireGoogleButton() {
    document.addEventListener('click', async (event) => {
      const googleBtn = event.target.closest('[data-auth-google]');
      if (!googleBtn) return;
      event.preventDefault();
      await handleGoogleSignIn(googleBtn);
    });
  }

  function wireGuestButton() {
    document.addEventListener('click', async (event) => {
      const guestBtn = event.target.closest('[data-auth-guest]');
      if (!guestBtn) return;
      event.preventDefault();
      guestBtn.disabled = true;
      guestBtn.dataset.loading = 'true';
      guestBtn.innerHTML = '<span class="btn-spinner"></span><span>Entering as guest...</span>';
      try {
        const response = await fetch('/api/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          currentSession = { authenticated: true, user: payload.user };
          window.algoAuth = currentSession;
          document.documentElement.classList.remove('auth-unverified', 'auth-loading');
          document.documentElement.classList.add('auth-verified');
          renderAuthNav();
          updateProfileNames(currentSession.user);
          location.href = getNextDestination();
        } else {
          const text = JSON.stringify(payload);
          void 0;
          throw new Error('Guest login failed: ' + (payload.error || text || response.status));
        }
      } catch (error) {
        void 0;
      } finally {
        guestBtn.disabled = false;
        delete guestBtn.dataset.loading;
        guestBtn.innerHTML = '<i class="fas fa-user-astronaut"></i><span>Continue as Guest</span>';
      }
    });
  }

  function setFormMessage(form, message, type) {
    const messageBox = form.querySelector('[data-auth-message]');
    if (!messageBox) return;

    messageBox.textContent = message;
    messageBox.className = `auth-message ${type || ''}`.trim();
  }

  function getNextDestination() {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');

    if (next && next.startsWith('/') && !next.startsWith('//')) {
      return next;
    }
    return '/';
  }

  async function handleGoogleSignIn(button) {
    if (!window.__supabaseClient) {
      setFormMessage(
        document.querySelector('[data-auth-form]'),
        'Google sign-in is not available right now.',
        'error'
      );
      return;
    }

    const form = document.querySelector('[data-auth-form]');

    if (button) {
      button.disabled = true;
      button.dataset.loading = 'true';
      button.innerHTML = '<span class="btn-spinner"></span><span>Signing in with Google...</span>';
    }

    try {
      // Begin the OAuth redirect flow. Supabase redirects the browser to
      // Google; on success we return to the same auth page (with `next`
      // preserved) where the session is exchanged with our backend.
      await window.__supabaseClient.signInWithGoogle(getOAuthReturnTo());
    } catch (error) {
      if (form) setFormMessage(form, 'Sign-in failed. Please try again.', 'error');
    } finally {
      if (button) {
        button.disabled = false;
        delete button.dataset.loading;
        button.innerHTML = `<svg class="google-btn-icon" viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg><span>Sign in with Google</span>`;
      }
    }
  }

  function getOAuthReturnTo() {
    const params = new URLSearchParams(location.search);
    const next = params.get('next');
    const url = new URL(location.pathname, window.location.origin);
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      url.searchParams.set('next', next);
    }
    return url.toString();
  }

  function wireAuthForm() {
    const form = document.querySelector('[data-auth-form]');
    if (!form) return;

    const mode = form.dataset.authForm;
    const passwordInput = form.querySelector("input[name='password']");
    const strengthBar = form.querySelector('[data-password-strength]');

    const validators = {
      name: (val) => (val.trim().length >= 2 ? '' : 'Name must be at least 2 characters.'),
      email: (val) =>
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim())
          ? ''
          : 'Please enter a valid email address.',
      password: (val) => {
        if (mode === 'login') return val.length > 0 ? '' : 'Password is required.';
        if (val.length < 8) return 'Password must be at least 8 characters.';
        if (!/[A-Z]/.test(val)) return 'Must include an uppercase letter.';
        if (!/[a-z]/.test(val)) return 'Must include a lowercase letter.';
        if (!/\d/.test(val)) return 'Must include a number.';
        if (!/[^A-Za-z0-9]/.test(val)) return 'Must include a special character.';
        return '';
      },
      confirmPassword: (val) => {
        if (mode === 'login') return '';
        return val === passwordInput?.value ? '' : 'Passwords do not match.';
      },
    };

    function showError(input, message) {
      const container = input.closest('.form-group') || input.parentElement;
      let errorEl = container.querySelector('.inline-error');

      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'inline-error';
        errorEl.style.color = '#ef4444';
        errorEl.style.fontSize = '0.8rem';
        errorEl.style.marginTop = '0.3rem';
        container.appendChild(errorEl);
      }

      errorEl.textContent = message;
      input.style.borderColor = message ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
    }

    form.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', () => {
        if (validators[input.name]) {
          showError(input, validators[input.name](input.value));
        }

        if (input.name === 'password' && strengthBar) {
          strengthBar.dataset.score = String(passwordStrength(input.value));

          const confirmInput = form.querySelector("input[name='confirmPassword']");

          if (confirmInput && confirmInput.value) {
            showError(confirmInput, validators.confirmPassword(confirmInput.value));
          }
        }
      });

      input.addEventListener('blur', () => {
        if (validators[input.name]) {
          showError(input, validators[input.name](input.value));
        }
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      let isValid = true;
      const formData = new FormData(form);
      const dataObj = Object.fromEntries(formData.entries());

      form.querySelectorAll('input').forEach((input) => {
        if (validators[input.name]) {
          const errorMsg = validators[input.name](input.value);
          showError(input, errorMsg);
          if (errorMsg) isValid = false;
        }
      });

      if (!isValid) {
        setFormMessage(form, 'Please fix the errors above before submitting.', 'error');
        return;
      }

      // Loading state ON
      const submitButton = form.querySelector("button[type='submit']");
      if (!submitButton) return; // Guard: ensure submit button exists
      submitButton.disabled = true;
      submitButton.dataset.loading = 'true';
      submitButton.innerHTML = `
  <span class="btn-spinner"></span>
  <span>${mode === 'login' ? 'Logging in...' : 'Signing up...'}</span>
`;
      setFormMessage(form, 'Working...', 'info');

      try {
        // --- 1. FETCH CSRF TOKEN FIRST ---
        const csrfResponse = await fetch('/api/csrf-token', { credentials: 'include' });
        if (!csrfResponse.ok) throw new Error('Failed to initialize secure session.');
        const { csrfToken } = await csrfResponse.json();
        // ---------------------------------

        // --- 2. INJECT TOKEN INTO HEADERS ---
        const response = await fetch(`/api/${mode}`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken, // <-- New Header Added
          },
          body: JSON.stringify(dataObj),
        });

        const payload = await response.json();
        if (payload.requiresVerification) {
          const emailEnc = encodeURIComponent(payload.email || '');
          location.href = `/verify-email?email=${emailEnc}`;
          return;
        }
        if (!response.ok) throw new Error(payload.error || 'Authentication failed.');

        setFormMessage(form, 'Success. Redirecting...', 'success');
        location.href = getNextDestination();
      } catch (error) {
        setFormMessage(form, error.message, 'error');
      } finally {
        submitButton.disabled = false;
        delete submitButton.dataset.loading;
        // Restore button text
        submitButton.innerHTML =
          mode === 'login'
            ? `<i class="fas fa-right-to-bracket"></i><span>Log In</span>`
            : `<i class="fas fa-user-plus"></i><span>Sign Up</span>`;
      }
    });
  }

  function renderFileModeError() {
    const form = document.querySelector('[data-auth-form]');
    const container = form?.closest('main') || document.body;

    const box = document.createElement('div');
    box.style.margin = '16px 0';
    box.style.padding = '12px 14px';
    box.style.border = '1px solid #ef4444';
    box.style.borderRadius = '10px';
    box.style.background = 'rgba(239,68,68,0.08)';
    box.style.color = '#ef4444';
    box.style.fontWeight = '600';
    box.setAttribute('role', 'alert');

    box.textContent =
      'Authentication requires running the server. Open this app at  (run: npm start or node server.js).';

    container.prepend(box);

    if (form) {
      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.disabled = true;
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (location.protocol === 'file:') {
      renderFileModeError();
      currentSession = {
        authenticated: false,
        user: null,
      };
      document.documentElement.classList.remove('auth-verified', 'auth-loading');
      document.documentElement.classList.add('auth-unverified');
      authReady = true;
      window.algoAuth = currentSession;

      renderAuthNav();
      wireLogout();
      wireGoogleButton();
      wireAuthForm();
      wireDeactivateAccount();
      wireChangePassword();
      wireDeleteAccount();
      updateProfileNames(currentSession.user);
      guardPrivateHash();

      window.addEventListener('hashchange', guardPrivateHash);
      return;
    }

    currentSession = await getSession();

    if (!currentSession.authenticated && window.__supabaseClient) {
      try {
        const redirectResult = await window.__supabaseClient.getSessionToken();
        const accessToken = redirectResult?.accessToken;

        if (accessToken) {
          const response = await fetch('/api/auth/supabase', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken }),
          });
          if (response.ok) {
            const payload = await response.json();
            currentSession = { authenticated: true, user: payload.user };
            window.algoAuth = currentSession;
            document.documentElement.classList.remove('auth-unverified', 'auth-loading');
            document.documentElement.classList.add('auth-verified');
            renderAuthNav();
            updateProfileNames(currentSession.user);
          } else {
            const errorBody = await response.text().catch(() => 'Unknown error');
            console.error('[auth] Supabase bridge failed:', response.status, errorBody);
          }
        } else {
          console.debug('[auth] No Supabase access token in session');
        }
      } catch (error) {
        if (error.message !== 'Supabase not configured')
          console.error('[auth] Supabase bridge error:', error);
      }
    }

    authReady = true;
    window.algoAuth = currentSession;

    if (currentSession.authenticated) {
      document.documentElement.classList.remove('auth-unverified', 'auth-loading');
      document.documentElement.classList.add('auth-verified');
    } else {
      document.documentElement.classList.remove('auth-verified', 'auth-loading');
      document.documentElement.classList.add('auth-unverified');
    }

    if (currentSession.authenticated && isAuthPage()) {
      location.href = getNextDestination();
      return;
    }

    renderAuthNav();
    wireLogout();
    wireGoogleButton();
    wireGuestButton();
    wireAuthForm();
    wireDeactivateAccount();
    wireChangePassword();
    wireDeleteAccount();
    updateProfileNames(currentSession.user);

    window.addEventListener('hashchange', guardPrivateHash);
    guardPrivateHash();
  });
})();

/**
 * Shows an in-page confirmation modal for a destructive account action,
 * replacing the native confirm()/prompt() dialogs this codebase avoids.
 * Resolves with { confirmed, password } — password is only collected when
 * requirePassword is true, and is null otherwise or on cancel.
 */
function showAccountActionModal({ title, message, confirmText, requirePassword = false }) {
  return new Promise((resolve) => {
    let settled = false;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 480px;">
        <div class="modal-header">
          <h3></h3>
          <button type="button" class="modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p></p>
          ${
            requirePassword
              ? `
            <div class="password-field">
              <label for="accountActionPassword">Confirm your password</label>
              <input type="password" id="accountActionPassword" placeholder="Enter your password" autocomplete="current-password" />
              <small id="accountActionPasswordError" class="field-error"></small>
            </div>
          `
              : ''
          }
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="accountActionCancel">Cancel</button>
          <button type="button" class="btn btn-danger" id="accountActionConfirm"></button>
        </div>
      </div>
    `;
    modal.querySelector('.modal-header h3').textContent = title;
    modal.querySelector('.modal-body p').textContent = message;
    modal.querySelector('#accountActionConfirm').textContent = confirmText;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('#accountActionCancel');
    const confirmBtn = modal.querySelector('#accountActionConfirm');
    const passwordInput = modal.querySelector('#accountActionPassword');
    const passwordError = modal.querySelector('#accountActionPasswordError');

    function settle(result) {
      if (settled) return;
      settled = true;
      document.removeEventListener('keydown', onKeydown);
      modal.remove();
      resolve(result);
    }

    function onKeydown(e) {
      if (e.key === 'Escape') settle({ confirmed: false, password: null });
    }

    document.addEventListener('keydown', onKeydown);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) settle({ confirmed: false, password: null });
    });
    closeBtn.addEventListener('click', () => settle({ confirmed: false, password: null }));
    cancelBtn.addEventListener('click', () => settle({ confirmed: false, password: null }));

    confirmBtn.addEventListener('click', () => {
      if (requirePassword) {
        const password = passwordInput.value;
        if (!password) {
          passwordError.textContent = 'Password is required.';
          passwordInput.focus();
          return;
        }
        settle({ confirmed: true, password });
        return;
      }
      settle({ confirmed: true, password: null });
    });

    setTimeout(() => (passwordInput || confirmBtn).focus(), 50);
  });
}

function wireDeactivateAccount() {
  const btn = document.getElementById('deactivateAccountBtn');

  if (!btn) return;

  btn.addEventListener('click', async () => {
    const { confirmed } = await showAccountActionModal({
      title: 'Deactivate Account',
      message:
        'Are you sure you want to deactivate your account? You can reactivate it by logging in again.',
      confirmText: 'Deactivate',
    });

    if (!confirmed) return;

    try {
      const response = await fetch('/api/deactivate-account', {
        method: 'POST',
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate account.');
      }

      void 0;

      window.location.href = '/login';
    } catch (error) {
      void 0;
    }
  });
}

function wireDeleteAccount() {
  const btn = document.getElementById('deleteAccountBtn');

  if (!btn) return;

  btn.addEventListener('click', async () => {
    const { confirmed, password } = await showAccountActionModal({
      title: 'Delete Account',
      message:
        'This will permanently delete your account and all associated data. This action cannot be undone. Enter your password to confirm.',
      confirmText: 'Delete Account',
      requirePassword: true,
    });

    if (!confirmed) return;
    if (!password) return;

    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
        }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      void 0;

      window.location.href = '/login';
    } catch (error) {
      void 0;
    }
  });
}

function passwordStrength(password) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

function wireChangePassword() {
  document.querySelectorAll('.password-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);

      input.type = input.type === 'password' ? 'text' : 'password';

      btn.innerHTML =
        input.type === 'password'
          ? '<i class="fas fa-eye"></i>'
          : '<i class="fas fa-eye-slash"></i>';
    });
  });
  const passwordInput = document.getElementById('newPassword');

  const strengthBar = document.getElementById('passwordStrengthBar');

  const strengthText = document.getElementById('passwordStrengthText');

  if (passwordInput && strengthBar && strengthText) {
    passwordInput.addEventListener('input', () => {
      const score = passwordStrength(passwordInput.value);

      strengthBar.style.width = `${score * 20}%`;

      const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];

      strengthText.textContent = labels[score];

      if (score <= 1) {
        strengthBar.style.background = '#ef4444';
      } else if (score <= 3) {
        strengthBar.style.background = '#f59e0b';
      } else {
        strengthBar.style.background = '#22c55e';
      }
    });
  }
  const confirmPassword = document.getElementById('confirmNewPassword');

  if (confirmPassword) {
    confirmPassword.addEventListener('input', () => {
      const error = document.getElementById('confirmPasswordError');

      if (confirmPassword.value && confirmPassword.value !== passwordInput.value) {
        error.textContent = 'Passwords do not match';
      } else {
        error.textContent = '';
      }
    });
  }
  const modal = document.getElementById('changePasswordModal');

  const openBtn = document.getElementById('changePasswordBtn');

  if (!modal || !openBtn) return;

  const closeBtn = document.getElementById('changePasswordClose');

  const cancelBtn = document.getElementById('cancelPasswordChange');

  const saveBtn = document.getElementById('savePasswordBtn');

  const message = document.getElementById('changePasswordMessage');

  function closeModal() {
    modal.classList.remove('active');
  }

  openBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  closeBtn?.addEventListener('click', closeModal);

  cancelBtn?.addEventListener('click', closeModal);

  saveBtn?.addEventListener('click', async () => {
    const currentPassword = document.getElementById('currentPassword').value;

    const newPassword = document.getElementById('newPassword').value;

    const confirmPassword = document.getElementById('confirmNewPassword').value;

    message.textContent = '';

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      message.className = 'password-message success';

      message.textContent = 'Password changed successfully. Redirecting...';

      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      message.className = 'password-message error';

      message.textContent = error.message;
    }
  });
}
