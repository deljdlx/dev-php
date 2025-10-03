export default class ThemeService {
  constructor(storage, themeKey = 'kanban.theme') {
    this.storage = storage;
    this.THEME_KEY = themeKey;
    this._applyTheme = (theme) => {
      const target = document.body;
      if (theme === 'light') target.setAttribute('data-theme', 'light');
      else target.removeAttribute('data-theme');
      const btn = document.getElementById('toggleTheme');
      if (btn) btn.textContent = theme === 'light' ? 'Mode sombre' : 'Mode clair';
    };
  }

  init() {
    try {
      const saved = this.storage.getItem(this.THEME_KEY);
      this._applyTheme(saved === 'light' ? 'light' : 'dark');
    } catch {
      this._applyTheme('dark');
    }
    document.getElementById('toggleTheme')?.addEventListener('click', () => {
      const isLight = document.body.getAttribute('data-theme') === 'light';
      const next = isLight ? 'dark' : 'light';
      try { this.storage.setItem(this.THEME_KEY, next); } catch {}
      this._applyTheme(next);
    });
  }
}
