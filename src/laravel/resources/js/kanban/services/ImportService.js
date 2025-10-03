export default class ImportService {
  constructor(view, onImport) {
    this.view = view;
    this.onImport = onImport; // async (data) => {}
  }

  open() {
    if (!this.view?.popup) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <form class="ticket-form" id="import-form">
        <div class="tf-grid">
          <div class="tf-field">
            <label class="tf-label">Fichier JSON</label>
            <input class="tf-input" type="file" id="import-file" accept="application/json,.json" />
          </div>
          <div class="tf-field">
            <div id="import-drop" class="modal-dropzone">Glissez-déposez votre fichier JSON ici</div>
          </div>
          <div class="tf-field">
            <label class="tf-label">Ou collez le JSON</label>
            <textarea class="tf-input" id="import-text" rows="8" placeholder="{\n  \"board\": { ... },\n  \"columns\": [ ... ]\n}"></textarea>
          </div>
          <div class="tf-actions">
            <button type="submit" class="btn">Importer</button>
          </div>
        </div>
      </form>
    `;
    const form = wrap.querySelector('#import-form');
    const fileInput = wrap.querySelector('#import-file');
    const textInput = wrap.querySelector('#import-text');
    const drop = wrap.querySelector('#import-drop');

    const parsePayload = async () => {
      if (fileInput.files && fileInput.files[0]) {
        const txt = await fileInput.files[0].text();
        return JSON.parse(txt);
      }
      if (textInput.value.trim()) return JSON.parse(textInput.value);
      throw new Error('Aucune donnée fournie');
    };

    if (drop) {
      const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
      ['dragenter','dragover','dragleave','drop'].forEach(evt => drop.addEventListener(evt, prevent));
      drop.addEventListener('dragover', () => drop.classList.add('is-dragover'));
      drop.addEventListener('dragleave', () => drop.classList.remove('is-dragover'));
      drop.addEventListener('drop', async (e) => {
        drop.classList.remove('is-dragover');
        try {
          const file = e.dataTransfer?.files?.[0];
          if (!file) return;
          if (!/json|.json$/i.test(file.type || file.name)) throw new Error('Type de fichier non supporté');
          const txt = await file.text();
          textInput.value = txt;
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
        } catch (err) { alert('Lecture du fichier échouée: ' + (err?.message || err)); }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await parsePayload();
        await this.onImport?.(data);
        this.view.popup.close();
      } catch (err) { alert('Import échoué: ' + (err?.message || err)); }
    }, { once: true });

    this.view.popup.open({ title: 'Importer un board JSON', content: wrap });
  }
}
