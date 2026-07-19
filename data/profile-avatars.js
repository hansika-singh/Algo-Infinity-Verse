// Profile Avatars Data — initial-based colored circle avatars
window.profileAvatars = [
  { initial: 'A', bg: '#7c3aed' },
  { initial: 'B', bg: '#3b82f6' },
  { initial: 'C', bg: '#10b981' },
  { initial: 'D', bg: '#f59e0b' },
  { initial: 'E', bg: '#ef4444' },
  { initial: 'F', bg: '#ec4899' },
  { initial: 'G', bg: '#8b5cf6' },
  { initial: 'H', bg: '#14b8a6' },
  { initial: 'I', bg: '#f97316' },
  { initial: 'J', bg: '#06b6d4' },
  { initial: 'K', bg: '#a855f7' },
  { initial: 'L', bg: '#84cc16' },
  { initial: 'M', bg: '#e11d48' },
  { initial: 'N', bg: '#0ea5e9' },
  { initial: 'O', bg: '#d946ef' },
];

function getInitialAvatar(name) {
  const first = (name || 'A').charAt(0).toUpperCase();
  const found = window.profileAvatars.find(a => a.initial === first);
  return found || window.profileAvatars[0];
}

const AVATAR_THEMES = {
  default: null,
  ocean: ['#0ea5e9', '#06b6d4', '#14b8a6', '#3b82f6', '#0284c7'],
  sunset: ['#f97316', '#ef4444', '#ec4899', '#f59e0b', '#e11d48'],
  midnight: ['#7c3aed', '#6d28d9', '#4f46e5', '#4338ca', '#312e81'],
  forest: ['#10b981', '#059669', '#047857', '#16a34a', '#15803d'],
  royal: ['#a855f7', '#7c3aed', '#f59e0b', '#d946ef', '#8b5cf6'],
};

const AVATAR_BORDER_STYLES = {
  none: '',
  gold: '3px solid #f59e0b',
  'premium-glow': '3px solid #8b5cf6',
  rainbow: '3px solid transparent',
  'neon-cyan': '3px solid #06b6d4',
  'neon-pink': '3px solid #ec4899',
};

function getAvatarThemeBg(theme, initial) {
  if (!theme || theme === 'default') return null;
  const palette = AVATAR_THEMES[theme];
  if (!palette) return null;
  const index = (initial.charCodeAt(0) - 65) % palette.length;
  return palette[index >= 0 ? index : 0];
}

function renderProfileAvatar(el, av) {
  if (!el) return;
  const userProgress = window.userProgress || {};
  const customization = userProgress.avatarCustomization || { border: 'none', theme: 'default' };

  if (typeof av === 'string' && av.startsWith('data:image')) {
    const borderStyle = AVATAR_BORDER_STYLES[customization.border] || '';
    el.innerHTML = `<span style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;overflow:hidden;${borderStyle ? 'border:' + borderStyle + ';' : ''}"><img src="${av}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"></span>`;
    el.style.fontSize = '0';
    return;
  }
  const initial = (av && av.initial) ? av.initial : 'L';
  const themeBg = getAvatarThemeBg(customization.theme, initial);
  const bg = themeBg || ((av && av.bg) ? av.bg : '#7c3aed');
  const borderStyle = AVATAR_BORDER_STYLES[customization.border] || '';
  const borderCss = borderStyle ? `border:${borderStyle};` : '';
  const extraClass = customization.border === 'rainbow' ? ' avatar-border-rainbow' : '';
  el.innerHTML = `<span class="avatar-inner${extraClass}" style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;background:${bg};color:#fff;font-size:1.3rem;font-weight:600;font-family:'Poppins',sans-serif;${borderCss}">${initial}</span>`;
  el.style.fontSize = '0';
}

window.getInitialAvatar = getInitialAvatar;
window.renderProfileAvatar = renderProfileAvatar;
window.getAvatarThemeBg = getAvatarThemeBg;
window.AVATAR_THEMES = AVATAR_THEMES;
window.AVATAR_BORDER_STYLES = AVATAR_BORDER_STYLES;
