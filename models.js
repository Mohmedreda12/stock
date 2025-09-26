'use strict';

/* ملف مستقل لصفحة الموديلات فقط */
(function () {
  // اشتغل فقط لو الصفحة هي models (عشان ما يحصلش تضارب مع باقي الصفحات)
  const page = document.body?.dataset?.page || '';
  if (page !== 'models') return;

  /* ===== أدوات صغيرة ===== */
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  const uid = () => 'm' + Math.random().toString(36).slice(2) + Date.now().toString(36);

  const getLang = () => localStorage.getItem('lang') || 'ar';
  const STR = {
    ar: { add:'إضافة موديل', edit:'تعديل', del:'حذف', cancel:'إلغاء', empty:'لا توجد موديلات بعد. اضغط “إضافة موديل”.', search:'ابحث…', needImg:'اختر صورة أولًا', deleted:'تم الحذف', done:'تمت العملية بنجاح.' },
    en: { add:'Add Model',   edit:'Edit',   del:'Delete', cancel:'Cancel', empty:'No models yet. Click "Add Model".', search:'Search…', needImg:'Pick an image first', deleted:'Deleted', done:'Done successfully.' }
  };
  const t = (k) => (typeof window.t === 'function' ? window.t(k) : (STR[getLang()]||{})[k] || k);
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const readDataURL = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  /* ===== الحالة ===== */
  let models = store.get('models', []); // [{id,src,cap,ts}]
  let filterQ = '';
  let editingId = null;
  let longTarget = null;

  /* ===== عناصر DOM ===== */
  const grid      = document.getElementById('grid');
  const empty     = document.getElementById('empty');
  const addBtn    = document.getElementById('addBtn');
  const q         = document.getElementById('q');

  const editDlg   = document.getElementById('editDlg');
  const fileInput = document.getElementById('file');
  const drop      = document.getElementById('drop');
  const prev      = document.getElementById('prev');
  const caption   = document.getElementById('caption');
  const saveBtn   = document.getElementById('saveBtn');

  const viewer    = document.getElementById('viewer');
  const viewerImg = document.getElementById('viewerImg');
  const viewerCap = document.getElementById('viewerCap');

  const ctx       = document.getElementById('ctx');
  const ctxEdit   = document.getElementById('ctxEdit');
  const ctxDelete = document.getElementById('ctxDelete');
  const ctxCancel = document.getElementById('ctxCancel');

  /* ===== الرسم ===== */
  function render() {
    const list = models
      .filter(m => !filterQ || (m.cap || '').toLowerCase().includes(filterQ.toLowerCase()))
      .sort((a, b) => b.ts - a.ts);

    empty.hidden = list.length > 0;
    empty.textContent = t('empty');

    grid.innerHTML = list.map(m => `
      <article class="card" data-id="${m.id}">
        <div class="media"><img src="${m.src}" alt=""></div>
        <div class="caption">${m.cap ? escapeHtml(m.cap) : ''}</div>
      </article>
    `).join('');
  

  // باقي الكود هيكمل هنا ... (الإضافة/التعديل، العرض، القائمة، البحث . // Click = عرض صورة — Long press = قائمة
    grid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', onCardClick);
      addLongPress(card, onLongPress);
    });
  }

  /* ===== إضافة/تعديل ===== */
  addBtn.textContent = t('add');
  addBtn.addEventListener('click', () => {
    editingId = null;
    caption.value = '';
    prev.innerHTML = '';
    prev.hidden = true;
    editDlg.showModal();
  });

  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const cap = caption.value.trim();

    // إضافة جديدة تتطلب صورة
    if (!editingId && !fileInput.files[0]) {
      if (typeof window.showMsg === 'function') window.showMsg(t('needImg'), 'error');
      else alert(t('needImg'));
      return;
    }

    const finish = (src) => {
      if (editingId) {
        const m = models.find(x => x.id === editingId);
        if (!m) return;
        if (src) m.src = src;
        m.cap = cap;
        m.ts = Date.now();
      } else {
        models.unshift({ id: uid(), src, cap, ts: Date.now() });
      }
      store.set('models', models);
      fileInput.value = '';
      prev.innerHTML = '';
      prev.hidden = true;
      editDlg.close();
      render();
      if (typeof window.showMsg === 'function') window.showMsg(t('done'), 'success');
    };

    if (fileInput.files[0]) readDataURL(fileInput.files[0]).then(finish);
    else finish(null);
  });

  // اختيار الملف بالضغط/السحب
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('drag');
    const f = e.dataTransfer.files[0];
    if (f) { fileInput.files = e.dataTransfer.files; previewFile(f); }
  });
  fileInput.addEventListener('change', () => {
    const f = fileInput.files[0];
    if (f) previewFile(f);
  });
  function previewFile(f) {
    readDataURL(f).then(src => {
      prev.hidden = false;
      prev.innerHTML = `<img src="${src}" alt="">`;
    });
  }

  /* ===== عارض الصورة ===== */
  function onCardClick(e) {
    const id = e.currentTarget.dataset.id;
    const m = models.find(x => x.id === id);
    if (!m) return;
    viewerImg.src = m.src;
    viewerCap.textContent = m.cap || '';
    viewer.showModal();
  }
  viewer.addEventListener('click', e => { if (e.target === viewer) viewer.close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') viewer.close(); });

  /* ===== الضغط المطوّل ===== */
  function addLongPress(el, handler) {
    let tId; let startX = 0, startY = 0;
    const start = (ev) => {
      const p = 'touches' in ev ? ev.touches[0] : ev;
      startX = p.clientX; startY = p.clientY;
      clearTimeout(tId);
      tId = setTimeout(() => handler(ev, el, startX, startY), 600);
    };
    const cancel = (ev) => {
      const p = 'changedTouches' in ev ? ev.changedTouches[0] : ev;
      if (p && Math.hypot(p.clientX - startX, p.clientY - startY) > 8) clearTimeout(tId);
      clearTimeout(tId);
    };
    el.addEventListener('mousedown', start);
    el.addEventListener('mouseup', cancel);
    el.addEventListener('mouseleave', cancel);
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchend', cancel);
  }
  function onLongPress(_ev, el) {
    longTarget = el;
    ctx.style.display = 'grid';
  }
  ctxCancel.addEventListener('click', () => ctx.style.display = 'none');
  ctx.addEventListener('click', e => { if (e.target === ctx) ctx.style.display = 'none'; });

  ctxEdit.textContent = t('edit');
  ctxDelete.textContent = t('del');

  ctxEdit.addEventListener('click', () => {
    if (!longTarget) return;
    const id = longTarget.dataset.id;
    const m = models.find(x => x.id === id);
    if (!m) return;
    editingId = id;
    caption.value = m.cap || '';
    prev.hidden = false;
    prev.innerHTML = `<img src="${m.src}" alt="">`;
    fileInput.value = '';
    ctx.style.display = 'none';
    editDlg.showModal();
  });

  ctxDelete.addEventListener('click', () => {
    if (!longTarget) return;
    const id = longTarget.dataset.id;
    if (confirm(t('del') + '؟')) {
      models = models.filter(x => x.id !== id);
      store.set('models', models);
      render();
      if (typeof window.showMsg === 'function') window.showMsg(t('deleted'), 'success');
    }
    ctx.style.display = 'none';
  });

  /* ===== البحث ===== */
  q.placeholder = t('search');
  q.addEventListener('input', () => { filterQ = q.value.trim(); render(); });

  /* ===== Boot ===== */
  try { if (typeof renderTopbar === 'function') renderTopbar('models'); } catch {}
  try { if (typeof wireTopbar   === 'function') wireTopbar('models');   } catch {}

  render();
  document.addEventListener('lang:changed', () => render());
})();
