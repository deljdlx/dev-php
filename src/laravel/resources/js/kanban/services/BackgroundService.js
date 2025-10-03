export default class BackgroundService {
  constructor(storage, bgKey = 'kanban.bgImage') {
    this.storage = storage;
    this.BG_IMG_KEY = bgKey;
    this._bgHandlers = null;
  }

  init() {
    let dragDepth = 0;
    const isFromModal = (target) => !!(target && (target.closest?.('.modal') || target.closest?.('.modal-dropzone')));

    const enter = (e) => {
      if (e.dataTransfer && !Array.from(e.dataTransfer.types || []).includes('Files')) return;
      dragDepth++;
      document.body.classList.add('bg-drag-active');
      e.preventDefault();
    };
    const over = (e) => { if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; e.preventDefault(); };
    const leave = (e) => { dragDepth = Math.max(0, dragDepth - 1); if (dragDepth === 0) document.body.classList.remove('bg-drag-active'); e.preventDefault(); };
    const drop = async (e) => {
      e.preventDefault();
      dragDepth = 0; document.body.classList.remove('bg-drag-active');
      if (isFromModal(e.target)) return;
      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length) return;
      const jsonFile = files.find(f => /json/i.test(f.type || '') || /.json$/i.test(f.name || ''));
      if (jsonFile) {
        try { const txt = await jsonFile.text(); const data = JSON.parse(txt); this.onImport?.(data); } catch (err) { alert('Import JSON échoué: ' + (err?.message || err)); }
        return;
      }
      const img = files.find(f => (f.type || '').startsWith('image/'));
      if (img) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            this.setBackgroundImage(dataUrl);
            try { this.storage.setItem(this.BG_IMG_KEY, dataUrl); } catch {}
          };
          reader.readAsDataURL(img);
        } catch {}
      }
    };

    if (this._bgHandlers) {
      const { enter: a, over: b, leave: c, drop: d } = this._bgHandlers;
      window.removeEventListener('dragenter', a);
      window.removeEventListener('dragover', b);
      window.removeEventListener('dragleave', c);
      window.removeEventListener('drop', d);
    }
    this._bgHandlers = { enter, over, leave, drop };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);

    try {
      const cached = this.storage.getItem(this.BG_IMG_KEY);
      if (cached) this.setBackgroundImage(cached);
    } catch {}
  }

  setBackgroundImage(url) {
    if (!url) return;
    const b = document.body;
    b.style.backgroundImage = `url('${url}')`;
    b.classList.add('has-custom-bg');
  }
}
