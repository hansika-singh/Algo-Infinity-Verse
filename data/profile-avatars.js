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

function avatarHtml(av, size) {
  const s = size || 42;
  if (typeof av === 'string' && av.startsWith('data:image')) {
    return `<img src="${av}" alt="Avatar" style="width:${s}px;height:${s}px;border-radius:50%;object-fit:cover;">`;
  }
  const initial = typeof av === 'object' ? av.initial : (av || 'A');
  const bg = typeof av === 'object' ? av.bg : '#7c3aed';
  return `<span style="display:inline-flex;align-items:center;justify-content:center;width:${s}px;height:${s}px;border-radius:50%;background:${bg};color:#fff;font-size:${s*0.5}px;font-weight:600;font-family:'Poppins',sans-serif;flex-shrink:0;">${initial}</span>`;
}

window.getInitialAvatar = getInitialAvatar;
window.avatarHtml = avatarHtml;
