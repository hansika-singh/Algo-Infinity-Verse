/**
 * 2fa-security.js
 * Handles the logic for enabling 2FA, OTP input, generating backup codes, and the mock login flow.
 */

document.addEventListener("DOMContentLoaded", () => {
    init2FAApp();
});

// App State
const state = {
    is2FAEnabled: false,
    generatedRecoveryCodes: []
};

// DOM Elements Mapping
const els = {
    // Views
    dashboardView: document.getElementById('dashboardView'),
    loginView: document.getElementById('loginView'),
    
    // Nav
    navLoginBtn: document.getElementById('navLoginBtn'),

    // Dashboard Elements
    statusBadge: document.getElementById('statusBadge'),
    btnEnable2FA: document.getElementById('btnEnable2FA'),
    btnDisable2FA: document.getElementById('btnDisable2FA'),
    
    // Setup Wizard
    setupWizard: document.getElementById('setupWizard'),
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    btnNextStep1: document.getElementById('btnNextStep1'),
    btnCancelSetup: document.getElementById('btnCancelSetup'),
    btnVerifySetup: document.getElementById('btnVerifySetup'),
    setupErrorMsg: document.getElementById('setupErrorMsg'),
    recoveryCodesGrid: document.getElementById('recoveryCodesGrid'),
    btnCopyCodes: document.getElementById('btnCopyCodes'),
    btnCompleteSetup: document.getElementById('btnCompleteSetup'),

    // Login Flow Elements
    loginStage1: document.getElementById('loginStage1'),
    loginStage2: document.getElementById('loginStage2'),
    loginStageRecovery: document.getElementById('loginStageRecovery'),
    loginStageSuccess: document.getElementById('loginStageSuccess'),
    
    btnMockLogin: document.getElementById('btnMockLogin'),
    btnBackToSettings: document.getElementById('btnBackToSettings'),
    btnVerifyLogin: document.getElementById('btnVerifyLogin'),
    loginErrorMsg: document.getElementById('loginErrorMsg'),
    
    btnUseRecovery: document.getElementById('btnUseRecovery'),
    btnBackToOTP: document.getElementById('btnBackToOTP'),
    btnVerifyRecovery: document.getElementById('btnVerifyRecovery'),
    recoveryCodeInput: document.getElementById('recoveryCodeInput'),
    recoveryErrorMsg: document.getElementById('recoveryErrorMsg'),
    
    btnReturnDashboard: document.getElementById('btnReturnDashboard')
};

function init2FAApp() {
    setupEventListeners();
    setupOtpInputBehavior('.setup-otp');
    setupOtpInputBehavior('.login-otp');
}

function setupEventListeners() {
    // === Navigation ===
    els.navLoginBtn.addEventListener('click', () => switchView('login'));
    els.btnBackToSettings.addEventListener('click', () => switchView('dashboard'));
    els.btnReturnDashboard.addEventListener('click', () => {
        switchView('dashboard');
        resetLoginFlow();
    });

    // === Dashboard Actions ===
    els.btnEnable2FA.addEventListener('click', startSetupWizard);
    els.btnDisable2FA.addEventListener('click', disable2FA);

    // === Setup Wizard Flow ===
    els.btnCancelSetup.addEventListener('click', hideSetupWizard);
    els.btnNextStep1.addEventListener('click', () => {
        els.step1.classList.add('hidden');
        els.step2.classList.remove('hidden');
        focusFirstOtp('.setup-otp');
    });

    els.btnVerifySetup.addEventListener('click', () => {
        const code = getOtpValue('.setup-otp');
        if (code.length === 6) { // Accept any 6 digits for this simulation
            els.setupErrorMsg.classList.add('hidden');
            generateAndShowRecoveryCodes();
            els.step2.classList.add('hidden');
            els.step3.classList.remove('hidden');
        } else {
            els.setupErrorMsg.classList.remove('hidden');
        }
    });

    els.btnCopyCodes.addEventListener('click', () => {
        const text = state.generatedRecoveryCodes.join('\n');
        navigator.clipboard.writeText(text).then(() => {
            const originalText = els.btnCopyCodes.innerHTML;
            els.btnCopyCodes.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => els.btnCopyCodes.innerHTML = originalText, 2000);
        });
    });

    els.btnCompleteSetup.addEventListener('click', enable2FA);

    // === Login Flow ===
    els.btnMockLogin.addEventListener('click', () => {
        els.loginStage1.classList.add('hidden');
        if (state.is2FAEnabled) {
            els.loginStage2.classList.remove('hidden');
            focusFirstOtp('.login-otp');
        } else {
            // If 2FA is off, login immediately
            els.loginStageSuccess.classList.remove('hidden');
        }
    });

    // Verify OTP in Login
    els.btnVerifyLogin.addEventListener('click', () => {
        const code = getOtpValue('.login-otp');
        if (code.length === 6) { 
            els.loginErrorMsg.classList.add('hidden');
            els.loginStage2.classList.add('hidden');
            els.loginStageSuccess.classList.remove('hidden');
        } else {
            els.loginErrorMsg.classList.remove('hidden');
        }
    });

    // Navigate to Recovery Code login
    els.btnUseRecovery.addEventListener('click', (e) => {
        e.preventDefault();
        els.loginStage2.classList.add('hidden');
        els.loginStageRecovery.classList.remove('hidden');
        els.recoveryCodeInput.value = '';
        els.recoveryCodeInput.focus();
    });

    els.btnBackToOTP.addEventListener('click', (e) => {
        e.preventDefault();
        els.loginStageRecovery.classList.add('hidden');
        els.loginStage2.classList.remove('hidden');
    });

    // Verify Recovery Code
    els.btnVerifyRecovery.addEventListener('click', () => {
        const inputCode = els.recoveryCodeInput.value.replace(/\s+/g, '').toUpperCase();
        // Check if code exists in generated list
        const codeIndex = state.generatedRecoveryCodes.findIndex(c => c.replace('-', '') === inputCode.replace('-', ''));
        
        if (codeIndex !== -1) {
            // Valid code. In a real app, this code is now consumed/burned.
            state.generatedRecoveryCodes.splice(codeIndex, 1); 
            els.recoveryErrorMsg.classList.add('hidden');
            els.loginStageRecovery.classList.add('hidden');
            els.loginStageSuccess.classList.remove('hidden');
        } else {
            els.recoveryErrorMsg.classList.remove('hidden');
        }
    });
}

// === Logic Functions ===

function switchView(viewName) {
    if (viewName === 'dashboard') {
        els.loginView.classList.add('hidden');
        els.dashboardView.classList.remove('hidden');
        els.navLoginBtn.classList.remove('active');
        document.querySelector('.nav-links .active').classList.add('active'); // Keep security active
    } else {
        els.dashboardView.classList.add('hidden');
        els.loginView.classList.remove('hidden');
        
        // Reset Nav
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        els.navLoginBtn.classList.add('active');
        
        resetLoginFlow();
    }
}

function startSetupWizard() {
    els.btnEnable2FA.classList.add('hidden');
    els.setupWizard.classList.remove('hidden');
    // Reset steps
    els.step1.classList.remove('hidden');
    els.step2.classList.add('hidden');
    els.step3.classList.add('hidden');
    clearOtpInputs('.setup-otp');
    els.setupErrorMsg.classList.add('hidden');
}

function hideSetupWizard() {
    els.setupWizard.classList.add('hidden');
    els.btnEnable2FA.classList.remove('hidden');
}

function enable2FA() {
    state.is2FAEnabled = true;
    hideSetupWizard();
    els.btnEnable2FA.classList.add('hidden');
    els.btnDisable2FA.classList.remove('hidden');
    
    // Update Badge
    els.statusBadge.classList.remove('disabled');
    els.statusBadge.classList.add('enabled');
    els.statusBadge.innerHTML = '<i class="fas fa-check-circle"></i> Enabled & Protected';
}

function disable2FA() {
    if (confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) {
        state.is2FAEnabled = false;
        state.generatedRecoveryCodes = [];
        
        els.btnDisable2FA.classList.add('hidden');
        els.btnEnable2FA.classList.remove('hidden');
        
        // Update Badge
        els.statusBadge.classList.remove('enabled');
        els.statusBadge.classList.add('disabled');
        els.statusBadge.innerHTML = '<i class="fas fa-times-circle"></i> Currently Disabled';
    }
}

function generateAndShowRecoveryCodes() {
    state.generatedRecoveryCodes = [];
    els.recoveryCodesGrid.innerHTML = '';
    
    // Generate 10 random codes format: XXXX-XXXX
    for (let i = 0; i < 10; i++) {
        const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        const code = `${part1}-${part2}`;
        state.generatedRecoveryCodes.push(code);
        
        const div = document.createElement('div');
        div.className = 'recovery-code';
        div.textContent = code;
        els.recoveryCodesGrid.appendChild(div);
    }
}

function resetLoginFlow() {
    els.loginStage1.classList.remove('hidden');
    els.loginStage2.classList.add('hidden');
    els.loginStageRecovery.classList.add('hidden');
    els.loginStageSuccess.classList.add('hidden');
    clearOtpInputs('.login-otp');
    els.loginErrorMsg.classList.add('hidden');
    els.recoveryErrorMsg.classList.add('hidden');
    els.recoveryCodeInput.value = '';
}

// === OTP Input UX Logic ===
// Creates the behavior where typing auto-focuses the next box, and backspace focuses the previous box.
function setupOtpInputBehavior(containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const inputs = container.querySelectorAll('.otp-box');
    
    inputs.forEach((input, index) => {
        // Prevent non-numeric pasting
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, inputs.length);
            for (let i = 0; i < pastedData.length; i++) {
                inputs[i].value = pastedData[i];
            }
            if (pastedData.length > 0) {
                inputs[Math.min(pastedData.length, inputs.length - 1)].focus();
            }
        });

        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                // Number pressed, move to next
                if (index < inputs.length - 1 && input.value !== '') {
                    inputs[index + 1].focus();
                }
            } else if (e.key === 'Backspace') {
                // Backspace pressed, move to previous
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });
        
        // Ensure only numbers are kept if typed very fast
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '');
        });
    });
}

function getOtpValue(containerSelector) {
    const inputs = document.querySelectorAll(`${containerSelector} .otp-box`);
    let code = '';
    inputs.forEach(input => code += input.value);
    return code;
}

function clearOtpInputs(containerSelector) {
    const inputs = document.querySelectorAll(`${containerSelector} .otp-box`);
    inputs.forEach(input => input.value = '');
}

function focusFirstOtp(containerSelector) {
    const input = document.querySelector(`${containerSelector} .otp-box`);
    if (input) input.focus();
}
