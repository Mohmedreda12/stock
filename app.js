`use strict`;
/* ====== تخزين بسيط ====== */
const store = {
  get(k, d){ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
/* تنسيق التاريخ حسب اللغة */
const fmt = ts => new Date(ts).toLocaleString(
  (typeof getLang === 'function' && getLang()==='ar') ? 'ar-EG' : 'en-GB'
);

/* ألوان ثابتة (EN) */
const COLORS = [
  "Black","Light Tan","Medium Blue","Navy Blue","Sky Blue","Royal Blue",
  "Gray","Light Gray","Dark Gray","Orange","White","Yellow","Green","Blue"
];

/* مفتاح مركّب للعناصر بالمخزن */
const keyOf = r => `${r.code}|${r.size}|${r.category}|${r.fabric}|${r.color}`;

/* ====== دوال ترجمة مساعدة ====== */
function t(path){
  if (typeof I18N === 'undefined') { console.error('I18N غير معرّف: حمّل i18n.js قبل app.js'); return path; }
  const lang = (typeof getLang === 'function') ? getLang() : 'ar';
  const obj = I18N[lang] || I18N.ar;
  return path.split('.').reduce((a,k)=>{
    const m = k.match(/(\w+)\[(\d+)\]/);
    if (m) return (a?.[m[1]] || [])[+m[2]];
    return a?.[k];
  }, obj);
}

/* لبعض الصفحات اللي بتستخدم data-i18n */
// تعريف محمي: لو متعرّفة قبل كده ما يُعادش تعريفها
window.applyStaticTexts = window.applyStaticTexts || function (root = document) {
  // استخدم applyTranslations لو موجودة في i18n.js
  if (typeof applyTranslations === 'function') { applyTranslations(root); return; }

  root.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.dataset.i18n;
    if (k && t(k) != null) el.textContent = t(k);
  });
};
/* ====== بناء خيارات (صنف/قماش/مقاس/لون) ====== */
function buildOptions(){
  const cats   = t('cat_vals') || [];
  const fabs   = t('fab_vals') || [];
  const alphas = t('sizes_alpha') || [];

  const catSel = document.getElementById('category');
  if (catSel){
    catSel.innerHTML = `
      <option value="">—</option>
      ${cats.map(v => `<option>${v}</option>`).join('')}
    `;
  }

  const colorSel = document.getElementById('color');
  if (colorSel){
    colorSel.innerHTML = `
      <option value="">—</option>
      ${COLORS.map(c => `<option>${c}</option>`).join('')}
    `;
  }

  const fabSel = document.getElementById('fabric');
  if (fabSel){
    fabSel.innerHTML = `
      <option value="">—</option>
      ${fabs.map(v => `<option>${v}</option>`).join('')}
    `;
  }

  const sAlpha = document.getElementById('sizeAlpha');
  if (sAlpha){
    sAlpha.innerHTML = alphas.map(v => `<option>${v}</option>`).join('');
  }

  const sNum = document.getElementById('sizeNum');
  if (sNum){
    sNum.innerHTML = Array.from({length:59},(_,i)=> i+2)
      .map(n => `<option>${n}</option>`).join('');
  }
}


/* ====== الشريط العلوي الموحد ====== */
window.renderTopbar = function renderTopbar(active = ''){
  const lang = (typeof getLang === 'function') ? getLang() : 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir  = (lang === 'ar') ? 'rtl' : 'ltr';

  const L = (k, fb='') => (typeof I18N!=='undefined' && I18N[lang] && I18N[lang][k]!=null) ? I18N[lang][k] : fb;

  // طلبك: نعرض "إدخال/إخراج" بدل نص القاموس الطويل
  const IN_SHORT  = (lang === 'ar') ? 'إدخال'  : 'Inbound';
  const OUT_SHORT = (lang === 'ar') ? 'إخراج'  : 'Outbound';

  const top = document.getElementById('topbar');
  if (!top) return;

top.innerHTML = `
  <div class="topbar">
    <div class="brand" onclick="location.href='index.html'">
      <span data-i18n="brand">${L('brand','مصممون الخليج')}</span>
    </div>
    <div class="top-actions">
      <button id="langBtn" class="chip" aria-label="Toggle language">AR/EN</button>
      <button id="menuBtn" class="hamburger" aria-label="القائمة" aria-haspopup="true" aria-expanded="false">
        <span></span><span></span><span></span><span></span><span></span>
      </button>
    </div>
  </div>

  <!-- القائمة الجانبية -->
  <nav id="quickMenu" class="quick-menu" hidden>
    <a href="index.html"  data-page="home"   data-i18n="home">الرئيسية</a>
    <a href="in.html"     data-page="in"     data-i18n="in">إدخال</a>
    <a href="out.html"    data-page="out"    data-i18n="out">إخراج</a>
    <a href="stock.html"  data-page="stock"  data-i18n="stock">المخزن</a>
    <a href="logs.html"   data-page="logs"   data-i18n="logs">السجل</a>
    <a href="models.html" data-page="models" data-i18n="models">الموديلات</a>
    <button id="logoutBtn" class="menu-disabled" style="cursor:pointer" data-i18n="logout">
    تسجيل الخروج</button>

  </nav>
`;
try { (window.applyTranslations || window.applyStaticTexts)?.(top); } catch {}
  // فتح/غلق قائمة الهامبرجر
  const menuBtn = document.getElementById('menuBtn');
  const quick   = document.getElementById('quickMenu');

// ===== زر الخروج =====
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn){
  logoutBtn.classList.remove('menu-disabled'); // يخليه شكله زي باقي الأزرار
  logoutBtn.addEventListener('click', ()=>{
    window.logout(); // هنا تحذف بيانات تسجيل الدخول
    location.replace('login.html'); // يوجهك على صفحة تسجيل الدخول
  });
}



  menuBtn.addEventListener('click', () => {
    const open = !quick.hasAttribute('hidden');
    if (open) { quick.setAttribute('hidden',''); menuBtn.setAttribute('aria-expanded','false'); }
    else { quick.removeAttribute('hidden'); menuBtn.setAttribute('aria-expanded','true'); }
  });
  document.addEventListener('click', (e) => {
    if (!quick.contains(e.target) && e.target !== menuBtn) {
      quick.setAttribute('hidden',''); menuBtn.setAttribute('aria-expanded','false');
    }
  });

  // تبديل اللغة بدون Reload
  const langBtn = document.getElementById('langBtn');
  langBtn.addEventListener('click', () => {
    const next = (typeof getLang==='function' && getLang()==='ar') ? 'en' : 'ar';
    if (typeof setLang === 'function') setLang(next);
    // حدّث النصوص داخل الصفحة والشريط فورًا
    applyStaticTexts(document);
    renderTopbar(active);
  });
};

/* (اختياري) لو عندك .nav قديم */
function wireTopbar(active){
  document.querySelectorAll('.nav a').forEach(a=>{
    a.classList.toggle('active', a.dataset.page===active);
  });
}



// ===== رسائل وسط الشاشة بدل alert =====
function showMsg(message, type = 'info', timeout = 2400) {
  // إنشاء العنصر لو مش موجود
  let host = document.getElementById('toastHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toastHost';
    // يخلي اتجاه النص حسب اللغة الحالية
    host.dir = (typeof getLang === 'function' && getLang() === 'ar') ? 'rtl' : 'ltr';
    document.body.appendChild(host);
  }

  const box = document.createElement('div');
  box.className = `toast ${type}`; // النوع: success | error | info
  // أيقونة بسيطة حسب النوع
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ';
  box.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;

  host.appendChild(box);

  // حركة الظهور
  requestAnimationFrame(() => box.classList.add('show'));

  // الإغلاق التلقائي
  const remove = () => {
    box.classList.remove('show');
    box.addEventListener('transitionend', () => box.remove(), { once: true });
  };
  const t = setTimeout(remove, timeout);

  // إغلاق عند الضغط
  box.addEventListener('click', () => { clearTimeout(t); remove(); });
}

/* ====== صفحة IN/OUT ====== */
function wireFormPage(mode){
  const title = document.getElementById('formTitle');
  const badge = document.getElementById('modeBadge');

  // نعرض العنوان حسب اللغة لكن بإيجاز
  const lang = (typeof getLang === 'function') ? getLang() : 'ar';
  title.textContent = (mode==='in')
    ? (lang==='ar' ? 'إدخال'  : 'Inbound')
    : (lang==='ar' ? 'إخراج'  : 'Outbound');

  badge.textContent = t(mode==='in'?'badge_in':'badge_out');
  badge.className = `badge ${mode==='in'?'in':'out'}`;

  // تبديل نوع المقاس
  document.querySelectorAll('input[name="sizeType"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      const isNum = r.value==='num';
      document.getElementById('sizeFieldNum').style.display   = isNum ? 'block' : 'none';
      document.getElementById('sizeFieldAlpha').style.display = isNum ? 'none'  : 'block';
    });
  });

  // إرسال
  document.getElementById('submitBtn').addEventListener('click', ()=>{
    const code = document.getElementById('code').value.trim();
    const qty  = Math.trunc(Number(document.getElementById('qty').value || 0));
    const sizeType = (document.querySelector('input[name="sizeType"]:checked')||{}).value || 'num';
    const size = sizeType==='num' ? document.getElementById('sizeNum').value
                                  : document.getElementById('sizeAlpha').value;
    const category = (document.getElementById('category')||{}).value || '';
    const fabric   = (document.getElementById('fabric')||{}).value   || '';
    const color    = (document.getElementById('color')||{}).value    || '';

    if (!code){ showMsg(t('err_code') || 'ادخل العنصر'); return; }
if (!Number.isFinite(qty) || qty <= 0) {
  showMsg(t('err_qty') || 'كمية غير صالحة');
  return;
}
    if (!size){ showMsg(t('err_size') || 'اختر المقاس'); return; }
    if (!category){ showMsg(t('err_cat') || 'اختر الصنف'); return; }
    if (!fabric){ showMsg(t('err_fab') || 'اختر القماش'); return; }
    if (!color){ showMsg('اختر اللون / choose color'); return; }

    const inv  = store.get('inventory', {});
    const logs = store.get('logs', []);
    const rec  = { code, size, category, fabric, color };
    const key  = keyOf(rec);

    inv[key] = inv[key] || { ...rec, qty: 0 };

    if (mode==='in'){
      inv[key].qty += qty;
    } else {
      if (!inv[key] || inv[key].qty < qty){ showMsg('Not enough qty / الكمية غير كافية'); return; }
      inv[key].qty -= qty;
      if (inv[key].qty === 0) delete inv[key];
    }

    store.set('inventory', inv);
    logs.unshift({ ts: Date.now(), action: mode==='in'?'IN':'OUT', qty, ...rec });
    store.set('logs', logs);

    showMsg(t('done') || 'تم بنجاح');
    document.getElementById('qty').value = '';
  });

  // تفريغ
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    ['code','qty'].forEach(id=>document.getElementById(id).value='');
  });
}

/* ====== صفحة: المخزن ====== */
function wireStockPage(){
  const ALL = t('all') || 'الكل';
  const filters = { category: ALL, fabric: ALL, size: ALL, q: '' };

  const catHost  = document.getElementById('filterCategory');
  const fabHost  = document.getElementById('filterFabric');
  const sizeHost = document.getElementById('filterSize');

  const catBadge  = document.getElementById('catBadge');
  const fabBadge  = document.getElementById('fabBadge');
  const sizeBadge = document.getElementById('sizeBadge');

  function mkBtns(arr, k, host){
    if(!host) return;
    const src = Array.isArray(arr) ? arr : [];
    host.innerHTML = [ALL, ...src]
      .map(v => `<button class="fbtn" data-k="${k}" data-v="${v}">${v}</button>`)
      .join('');
    host.querySelector('.fbtn')?.classList.add('active');
  }

  mkBtns(t('cat_vals') || [], 'category', catHost);
  mkBtns(t('fab_vals') || [], 'fabric',   fabHost);
  mkBtns([...(t('sizes_alpha')||[]), ...Array.from({length:59},(_,i)=>String(i+2))],
         'size', sizeHost);

  [catHost, fabHost, sizeHost].forEach(host=>{
    if(!host) return;
    host.addEventListener('click', e=>{
      const btn = e.target.closest('.fbtn');
      if(!btn || !host.contains(btn)) return;

      host.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');

      const k = btn.dataset.k, v = btn.dataset.v;
      if(k) filters[k] = v;

      const badgeMap = {category:catBadge, fabric:fabBadge, size:sizeBadge};
      const badge = badgeMap[k];
      if(badge){
        if(v===ALL){ badge.hidden = true; badge.textContent=''; }
        else{ badge.hidden = false; badge.textContent = v; }
      }

      const d = host.closest('details.acc');
      if(d && window.matchMedia('(max-width: 860px)').matches) d.open = false;

      render();
    });
  });

  document.getElementById('search')?.addEventListener('input', e=>{
    filters.q = (e.target.value || '').trim();
    render();
  });

  const accs = Array.from(document.querySelectorAll('.filters details.acc'));
  function closeAll(except){ accs.forEach(d=>{ if(d!==except) d.open=false; }); }

  accs.forEach(d=>{
    const s = d.querySelector('summary');
    if(!s) return;
    s.addEventListener('click', (ev)=>{
      ev.preventDefault();
      const willOpen = !d.open;
      closeAll(); d.open = willOpen;
      if(willOpen && window.matchMedia('(max-width: 860px)').matches){
        d.scrollIntoView({behavior:'smooth', block:'nearest'});
      }
    });
  });

  document.addEventListener('click', (e)=>{
    if(e.target.closest('.filters details.acc')) return;
    closeAll();
  });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAll(); });

  function syncAccordionLayout(){
    const wide = window.matchMedia('(min-width: 860px)').matches;
    accs.forEach(d => d.open = wide);
  }
  syncAccordionLayout();
  window.addEventListener('resize', syncAccordionLayout);

  function render(){
    const list = document.getElementById('stockList');
    const inv  = store.get('inventory', {});
    const items = Object.values(inv)
      .filter(r => filters.category===ALL || r.category===filters.category)
      .filter(r => filters.fabric===ALL   || r.fabric===filters.fabric)
      .filter(r => filters.size===ALL     || String(r.size)===String(filters.size))
      .filter(r => !filters.q || (r.code||'').toLowerCase().includes(filters.q.toLowerCase()));

    if(!list) return;
    if(!items.length){
      list.innerHTML = `<div class="meta" style="padding:12px 0">${t('empty')||'لا توجد بيانات'}</div>`;
      return;
    }
    list.innerHTML = items.map(r=>`
      <div class="row" style="justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid var(--border)">
        <div>
          <div style="font-weight:700">${r.code||''}</div>
          <div class="meta">
            ${(t('size')||'المقاس')}: ${r.size} •
            ${(t('category')||'الصنف')}: ${r.category} •
            ${(t('fabric')||'القماش')}: ${r.fabric}
          </div>
        </div>
        <div style="font-weight:800">${r.qty}</div>
      </div>
    `).join('');
  }

  render();
}


/* ====== صفحة: السجل ====== */
function wireLogsPage(){
  const body = document.getElementById('logsBody');

  function render(){
    const logs = store.get('logs', []);
    if (!logs.length){
      body.innerHTML = `<tr><td class="meta" colspan="8" style="padding:14px 8px">${t('no_logs') || 'لا يوجد سجل'}</td></tr>`;
      return;
    }
    body.innerHTML = logs.map(l=>`
      <tr>
        <td>${fmt(l.ts)}</td>
        <td><span class="badge ${l.action==='IN'?'in':'out'}">${l.action}</span></td>
        <td>${l.code}</td>
        <td>${l.size}</td>
        <td>${l.category}</td>
        <td>${l.fabric}</td>
        <td>${l.color || '-'}</td>
        <td style="font-weight:700">${l.qty}</td>
      </tr>
    `).join('');
  }

  document.getElementById('clearLogs')?.addEventListener('click', ()=>{
    if (confirm('Clear all logs? / مسح كل السجل؟')){
      store.set('logs', []);
      render();
    }
  });

  render();
}


// ===== Auth helpers (بسيطة على المتصفح — ليست أمان إنتاجي) =====

window.AUTH_KEY = 'auth_v1';
window.USERS = {
  gulf: '882025'    
};

window.isAuthed = function isAuthed(){
  try {
    const x = JSON.parse(localStorage.getItem(AUTH_KEY));
    return !!(x && x.user && x.ts);
  } catch { return false; }
};

window.logout = function logout(){
  localStorage.removeItem(AUTH_KEY);
};
document.addEventListener('DOMContentLoaded', () => {
  // يجيب الحقول
  const uid = document.getElementById('uid');
  const pwd = document.getElementById('pwd');

  // يفرغ القيم أول ما الصفحة تفتح
  if (uid) uid.value = '';
  if (pwd) pwd.value = '';
});

window.login = async function login(user, pass){
  // تحقق بسيط: قارن مع USERS
  if (!user || !pass) return false;
  const ok = (USERS[user] && USERS[user] === pass);
  if (ok){
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user, ts: Date.now() }));
    return true;
  }
  return false;
};

// حارس عام: يمنع فتح الصفحات بدون تسجيل
window.guard = function guard(){
  const page = document.body?.dataset?.page || '';
  if (page !== 'login' && !window.isAuthed()){
    location.replace('login.html');
    return false;
  }
  return true;
};


/* ====== Boot ====== */
(function boot(){
  try{


    // امنع الوصول لو مش مسجل
if (!window.guard()) return;
    // اضبط اللغة حسب المخزن وطبّق النصوص
    if (typeof setLang === 'function') setLang(getLang());
    applyStaticTexts(document);

    // خيارات الفورم (لو العناصر موجودة)
    buildOptions();

    // ارسم الشريط وعيّن الصفحة النشطة
    const page = document.body.dataset.page || 'home';
    renderTopbar(page);
    wireTopbar(page);

    // صفحات محددة
    if (page === 'in' || page === 'out') wireFormPage(page);
    if (page === 'stock') wireStockPage();
    if (page === 'logs') wireLogsPage();
    if (page === 'home') wireHomePage();
if (page === 'models') wireModelsPage();
    // لو اللغة تغيّرت من أي مكان، أعد تطبيق النصوص وأعد رسم الشريط
    document.addEventListener('lang:changed', 
      ()=>{ applyStaticTexts(document); renderTopbar(page); });

  } catch (err){
    console.error('Boot error:', err);
    showMsg('حدث خطأ في تحميل الصفحة. راجع Console.');
  }
// دالة مخصصة للصفحة الرئيسية
function wireHomePage() {
  console.log('Home page is ready');
  // هنا ممكن تضيف أي أكواد خاصة بالصفحة الرئيسية
}

// دالة مخصصة لصفحة الموديلات
function wireModelsPage() {
  console.log('Models page is ready');
  // هنا تقدر تضيف كود خاص لو محتاج
}

})();
