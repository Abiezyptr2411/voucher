import './style.css';
import { DEFAULT_COUPONS } from './data.js';
import {
  startRomanticMusic,
  pauseRomanticMusic,
  toggleRomanticMusic,
  onMusicStatusChange,
  playEnvelopeOpen,
  playClaimHarp,
  playHusbandAlert,
  playSoftClick,
  CURRENT_SONG_TITLE
} from './audio.js';
import {
  initSupabase,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  removeSupabaseCredentials,
  testSupabaseConnection,
  fetchCouponSelections,
  saveCouponSelection,
  updateSelectionStatus,
  deleteSelection,
  subscribeToSelectionChanges,
  SQL_SCHEMA_SCRIPT
} from './supabase.js';
import confetti from 'canvas-confetti';

// ==========================================
// APPLICATION STATE
// ==========================================
const state = {
  coupons: DEFAULT_COUPONS,
  selectedCoupons: [],
  activeView: 'gallery', // 'gallery' | 'selected' | 'husband'
  galleryFilter: 'all',
  gallerySearchQuery: '',
  selectedStatusFilter: 'all',
  husbandStatusFilter: 'all',
  isHusbandAuth: sessionStorage.getItem('husband_auth_session') === 'true',
  activeModalCoupon: null,
  realtimeUnsubscribe: null
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const dom = {
  ambientHearts: document.getElementById('ambientHearts'),
  brandLogo: document.getElementById('brandLogo'),
  tabExplore: document.getElementById('tabExplore'),
  tabMySelected: document.getElementById('tabMySelected'),
  navSelectedCount: document.getElementById('navSelectedCount'),
  syncStatusBadge: document.getElementById('syncStatusBadge'),
  btnHusbandToggle: document.getElementById('btnHusbandToggle'),
  husbandBtnIcon: document.getElementById('husbandBtnIcon'),
  husbandBtnText: document.getElementById('husbandBtnText'),

  // Intro Gateway Experience
  introGateway: document.getElementById('introGateway'),
  envelopeOuter: document.getElementById('envelopeOuter'),
  waxSealBtn: document.getElementById('waxSealBtn'),
  btnOpenIntro: document.getElementById('btnOpenIntro'),
  btnReplayIntro: document.getElementById('btnReplayIntro'),

  // Music Player
  btnMusicToggle: document.getElementById('btnMusicToggle'),
  vinylDisc: document.getElementById('vinylDisc'),
  musicStatusText: document.getElementById('musicStatusText'),

  // Views
  wifeGalleryView: document.getElementById('wifeGalleryView'),
  wifeSelectedView: document.getElementById('wifeSelectedView'),
  husbandPortalView: document.getElementById('husbandPortalView'),

  // Gallery
  couponsGrid: document.getElementById('couponsGrid'),
  categoryFilterPills: document.getElementById('categoryFilterPills'),
  couponSearchInput: document.getElementById('couponSearchInput'),

  // Selected View
  selectedCouponsList: document.getElementById('selectedCouponsList'),
  selectedStatusFilterPills: document.getElementById('selectedStatusFilterPills'),

  // Husband Portal
  husbandSyncBanner: document.getElementById('husbandSyncBanner'),
  husbandSyncTitle: document.getElementById('husbandSyncTitle'),
  husbandSyncDesc: document.getElementById('husbandSyncDesc'),
  btnBannerSetupDb: document.getElementById('btnBannerSetupDb'),
  btnOpenDbConfig: document.getElementById('btnOpenDbConfig'),
  btnHusbandLogout: document.getElementById('btnHusbandLogout'),
  statTotalCount: document.getElementById('statTotalCount'),
  statSelectedCount: document.getElementById('statSelectedCount'),
  statProgressCount: document.getElementById('statProgressCount'),
  statCompletedCount: document.getElementById('statCompletedCount'),
  husbandCouponsList: document.getElementById('husbandCouponsList'),
  husbandStatusFilterPills: document.getElementById('husbandStatusFilterPills'),

  // Modals
  couponDetailModal: document.getElementById('couponDetailModal'),
  btnCloseDetailModal: document.getElementById('btnCloseDetailModal'),
  btnCancelDetailModal: document.getElementById('btnCancelDetailModal'),
  modalCouponImg: document.getElementById('modalCouponImg'),
  modalCouponCategory: document.getElementById('modalCouponCategory'),
  modalCouponTitle: document.getElementById('modalCouponTitle'),
  modalCouponCode: document.getElementById('modalCouponCode'),
  modalCouponDesc: document.getElementById('modalCouponDesc'),
  modalCouponTerms: document.getElementById('modalCouponTerms'),
  modalCouponHusbandMessage: document.getElementById('modalCouponHusbandMessage'),
  modalWifeNote: document.getElementById('modalWifeNote'),
  btnConfirmClaimCoupon: document.getElementById('btnConfirmClaimCoupon'),

  // Celebration Modal
  celebrationModal: document.getElementById('celebrationModal'),
  btnViewMySelectedCoupons: document.getElementById('btnViewMySelectedCoupons'),
  btnCloseCelebrationModal: document.getElementById('btnCloseCelebrationModal'),

  // PIN Modal
  husbandPinModal: document.getElementById('husbandPinModal'),
  btnClosePinModal: document.getElementById('btnClosePinModal'),
  pinLoginForm: document.getElementById('pinLoginForm'),
  husbandPinInput: document.getElementById('husbandPinInput'),
  pinErrorHint: document.getElementById('pinErrorHint'),

  // DB Config Modal
  supabaseConfigModal: document.getElementById('supabaseConfigModal'),
  btnCloseDbModal: document.getElementById('btnCloseDbModal'),
  sqlPreviewCode: document.getElementById('sqlPreviewCode'),
  btnCopySql: document.getElementById('btnCopySql'),
  inputSupabaseUrl: document.getElementById('inputSupabaseUrl'),
  inputSupabaseAnonKey: document.getElementById('inputSupabaseAnonKey'),
  btnSaveAndTestDb: document.getElementById('btnSaveAndTestDb'),
  btnResetDbConfig: document.getElementById('btnResetDbConfig'),
  dbTestResultBox: document.getElementById('dbTestResultBox'),

  // Toast
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================
// TOAST NOTIFICATION UTILITY
// ==========================================
function showToast(message, type = 'romantic', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="font-size: 1.15rem;">${type === 'husband' ? '🔔' : '❤️'}</span>
    <div>${message}</div>
  `;
  dom.toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 350);
  }, duration);
}

// ==========================================
// AMBIENT FLOATING HEARTS GENERATOR
// ==========================================
function initAmbientHearts() {
  const heartSymbols = ['❤️', '💖', '💕', '✨', '🌸'];
  const count = 12;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'ambient-heart';
    el.textContent = heartSymbols[Math.floor(Math.random() * heartSymbols.length)];
    el.style.left = `${Math.random() * 95}%`;
    el.style.animationDuration = `${12 + Math.random() * 10}s`;
    el.style.animationDelay = `${Math.random() * 6}s`;
    el.style.fontSize = `${1.1 + Math.random() * 1.3}rem`;
    dom.ambientHearts.appendChild(el);
  }
}

// ==========================================
// INTRO GATEWAY EXPERIENCE
// ==========================================
function openIntroGate() {
  if (dom.envelopeOuter.classList.contains('opened')) return;

  dom.envelopeOuter.classList.add('opened');
  playEnvelopeOpen();

  // Romantic celebration burst
  const heartShape = confetti.shapeFromText({ text: '❤️' });
  const starShape = confetti.shapeFromText({ text: '✨' });

  confetti({
    particleCount: 45,
    spread: 80,
    origin: { y: 0.5 },
    shapes: [heartShape, starShape],
    scalar: 2
  });

  // Start romantic music right away
  startRomanticMusic();

  setTimeout(() => {
    dom.introGateway.classList.add('fade-out');
    showToast(`🎷 Memutar: ${CURRENT_SONG_TITLE} ❤️`, 'romantic', 4500);
  }, 850);

  setTimeout(() => {
    dom.introGateway.style.display = 'none';
  }, 1600);
}

function replayIntroGate() {
  dom.envelopeOuter.classList.remove('opened');
  dom.introGateway.style.display = 'flex';
  requestAnimationFrame(() => {
    dom.introGateway.classList.remove('fade-out');
  });
  playSoftClick();
}

// ==========================================
// MUSIC STATUS LISTENER
// ==========================================
onMusicStatusChange((isPlaying) => {
  if (isPlaying) {
    dom.vinylDisc.classList.add('spinning');
    dom.musicStatusText.textContent = 'Jeda Sax';
    dom.btnMusicToggle.title = `${CURRENT_SONG_TITLE} (Sedang Diputar)`;
  } else {
    dom.vinylDisc.classList.remove('spinning');
    dom.musicStatusText.textContent = 'Saxophone';
    dom.btnMusicToggle.title = `${CURRENT_SONG_TITLE} (Ketuk untuk Putar)`;
  }
});

// ==========================================
// CELEBRATION EFFECTS
// ==========================================
function triggerRomanticCelebration() {
  playClaimHarp();

  const heartShape = confetti.shapeFromText({ text: '❤️' });
  const starShape = confetti.shapeFromText({ text: '✨' });

  confetti({
    particleCount: 50,
    spread: 90,
    origin: { y: 0.6 },
    shapes: [heartShape, starShape],
    scalar: 2.2,
    ticks: 200
  });

  setTimeout(() => {
    confetti({
      particleCount: 65,
      spread: 100,
      origin: { y: 0.65 },
      colors: ['#f43f6e', '#facc15', '#fbcfe8', '#e11d57']
    });
  }, 250);
}

// ==========================================
// DATE FORMATTER (INDONESIAN)
// ==========================================
function formatDateIndonesian(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';
}

// ==========================================
// STATUS HELPERS
// ==========================================
function getStatusBadgeHtml(status) {
  switch (status) {
    case 'selected':
      return `<span class="badge-status selected">⏳ Menunggu Suami</span>`;
    case 'in_progress':
      return `<span class="badge-status in_progress">💖 Sedang Disiapkan</span>`;
    case 'completed':
      return `<span class="badge-status completed">🎉 Selesai Ditebus</span>`;
    default:
      return `<span class="badge-status available">✨ Tersedia</span>`;
  }
}

// ==========================================
// RENDER VIEW: WIFE'S VOUCHER GALLERY (MODEL VOUCHER PASS)
// ==========================================
function renderGallery() {
  const query = state.gallerySearchQuery.toLowerCase().trim();
  const filter = state.galleryFilter;

  const chosenIds = new Set(state.selectedCoupons.map(s => s.coupon_id));

  const filtered = state.coupons.filter(coupon => {
    const matchesSearch =
      coupon.title.toLowerCase().includes(query) ||
      coupon.subtitle.toLowerCase().includes(query) ||
      coupon.category.toLowerCase().includes(query) ||
      coupon.description.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'available') return !chosenIds.has(coupon.id);
    return coupon.category === filter;
  });

  if (filtered.length === 0) {
    dom.couponsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">Tidak Ada Voucher Ditemukan</div>
        <p class="empty-desc">Coba pilih kategori lain atau reset pencarian.</p>
        <button type="button" class="btn-modal-claim" id="btnResetSearch" style="margin: 0 auto; display: inline-flex;">
          Reset Pencarian
        </button>
      </div>
    `;
    const btnReset = document.getElementById('btnResetSearch');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        state.galleryFilter = 'all';
        state.gallerySearchQuery = '';
        dom.couponSearchInput.value = '';
        updateCategoryFilterActive();
        renderGallery();
      });
    }
    return;
  }

  dom.couponsGrid.innerHTML = filtered.map(coupon => {
    const selections = state.selectedCoupons.filter(s => s.coupon_id === coupon.id);
    const isSelected = selections.length > 0;

    return `
      <article class="modern-voucher-pass ${isSelected ? 'is-claimed' : ''}" data-id="${coupon.id}">
        <!-- Upper Part of Voucher -->
        <div class="voucher-pass-upper">
          <div class="voucher-image-container">
            <img src="${coupon.imageUrl}" alt="${coupon.title}" class="voucher-img" loading="lazy" />
            <span class="voucher-floating-tag">${coupon.categoryBadge}</span>
            <span class="voucher-floating-serial">№ ${coupon.code || '00'}</span>
          </div>

          <div class="voucher-pass-info">
            <h3 class="voucher-pass-title">${coupon.title}</h3>
            <div class="voucher-pass-subtitle">${coupon.subtitle}</div>
            <p class="voucher-pass-desc">${coupon.description}</p>
            
            <div class="voucher-pass-perks">
              <span class="mini-perk-pill">✨ Bebas Pilih Waktu</span>
              <span class="mini-perk-pill">👑 Garansi 100% Bahagia</span>
              <span class="mini-perk-pill">❤️ Berlaku Selamanya</span>
            </div>

            ${isSelected ? `
              <div class="voucher-claimed-banner">
                <span>❤️</span> Sudah kamu pilih ${selections.length > 1 ? `(${selections.length}x)` : ''}! Suami siap membahagiakanmu.
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Perforation Divider with Notches -->
        <div class="voucher-pass-divider" aria-hidden="true">
          <div class="notch-left"></div>
          <div class="divider-dash-line"></div>
          <div class="notch-right"></div>
        </div>

        <!-- Lower Stub Action Section -->
        <div class="voucher-pass-lower">
          <div class="voucher-mini-barcode">
            <div class="barcode-strip" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
            <div class="barcode-code-text">${coupon.code || 'LOVE'} • PASS</div>
          </div>

          ${isSelected ? `
            <div class="stamp-badge-claimed">
              CLAIMED • TERPILIH
            </div>
          ` : ''}

          <div class="voucher-stub-btns">
            <button type="button" class="btn-pass-details" data-action="view" data-id="${coupon.id}">
              Detail ℹ️
            </button>
            <button type="button" class="btn-pass-claim" data-action="choose" data-id="${coupon.id}">
              Klaim Voucher ❤️
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach card button listeners
  dom.couponsGrid.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const couponId = btn.getAttribute('data-id');
      const coupon = state.coupons.find(c => c.id === couponId);
      if (coupon) {
        playSoftClick();
        openCouponDetailModal(coupon);
      }
    });
  });
}

// ==========================================
// RENDER VIEW: WIFE'S SELECTED COUPONS (MY COUPONS)
// ==========================================
function renderSelectedList() {
  const filter = state.selectedStatusFilter;
  let items = [...state.selectedCoupons];

  if (filter !== 'all') {
    items = items.filter(item => item.status === filter);
  }

  if (items.length === 0) {
    dom.selectedCouponsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💌</div>
        <div class="empty-title">Belum Ada Voucher Dipilih</div>
        <p class="empty-desc">Pilih voucher hadiah apa saja yang kamu inginkan!</p>
        <button type="button" class="btn-modal-claim" id="btnExploreFromEmpty" style="margin: 0 auto; display: inline-flex;">
          Pilih Voucher Sekarang ❤️
        </button>
      </div>
    `;
    const btn = document.getElementById('btnExploreFromEmpty');
    if (btn) {
      btn.addEventListener('click', () => switchView('gallery'));
    }
    return;
  }

  dom.selectedCouponsList.innerHTML = items.map(sel => {
    const parentCoupon = state.coupons.find(c => c.id === sel.coupon_id) || {};
    const husbandMsg = parentCoupon.husbandMessage || 'Aku mencintaimu selamanya.';

    return `
      <div class="selected-ticket-item" data-selection-id="${sel.id}">
        <div class="selected-ticket-thumb">
          <img src="${sel.coupon_image_url || parentCoupon.imageUrl || '/images/dinner.jpg'}" alt="${sel.coupon_title}" />
        </div>
        <div class="selected-ticket-main">
          <div class="ticket-header-row">
            <div>
              <h3>${sel.coupon_title}</h3>
              <div class="ticket-date-tag">🗓️ Dipilih: ${formatDateIndonesian(sel.claimed_at)}</div>
            </div>
            <div>
              ${getStatusBadgeHtml(sel.status)}
            </div>
          </div>

          <div class="ticket-notes-box">
            <strong>💌 Janji Suami:</strong> "${husbandMsg}"
          </div>

          ${sel.wife_note ? `
            <div style="font-size: 0.82rem; color: #475569; margin: 0.2rem 0;">
              <span style="font-weight: 700; color: var(--rose-600);">Catatan Kamu:</span> "${sel.wife_note}"
            </div>
          ` : ''}

          ${sel.husband_reply_note ? `
            <div class="ticket-reply-box">
              <strong>💬 Balasan Suami:</strong> "${sel.husband_reply_note}"
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// RENDER VIEW: HUSBAND'S COMMAND CENTER
// ==========================================
function renderHusbandPortal() {
  const selections = state.selectedCoupons;
  const total = selections.length;
  const selectedCount = selections.filter(s => s.status === 'selected').length;
  const progressCount = selections.filter(s => s.status === 'in_progress').length;
  const completedCount = selections.filter(s => s.status === 'completed').length;

  dom.statTotalCount.textContent = total;
  dom.statSelectedCount.textContent = selectedCount;
  dom.statProgressCount.textContent = progressCount;
  dom.statCompletedCount.textContent = completedCount;

  const filter = state.husbandStatusFilter;
  let items = [...selections];
  if (filter !== 'all') {
    items = items.filter(s => s.status === filter);
  }

  if (items.length === 0) {
    dom.husbandCouponsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👑</div>
        <div class="empty-title">Belum Ada Voucher Dipilih Istri</div>
        <p class="empty-desc">Saat istri Anda memilih kupon di HP miliknya, kupon akan langsung muncul di sini secara otomatis.</p>
      </div>
    `;
    return;
  }

  dom.husbandCouponsList.innerHTML = items.map(sel => {
    return `
      <div class="selected-ticket-item" data-id="${sel.id}">
        <div class="selected-ticket-main">
          <div class="ticket-header-row">
            <div>
              <h3>${sel.coupon_title}</h3>
              <div class="ticket-date-tag">Dipilih istri: ${formatDateIndonesian(sel.claimed_at)}</div>
            </div>
            <div>
              ${getStatusBadgeHtml(sel.status)}
            </div>
          </div>

          ${sel.wife_note ? `
            <div style="background: var(--rose-50); padding: 0.55rem 0.8rem; border-radius: 8px; font-size: 0.82rem; border-left: 3px solid var(--rose-600); margin: 0.4rem 0;">
              <strong style="color: var(--rose-700);">Catatan Istri:</strong> "${sel.wife_note}"
            </div>
          ` : ''}

          <div style="margin: 0.5rem 0;">
            <label style="font-size: 0.75rem; font-weight: 700; color: #475569; display: block; margin-bottom: 0.35rem;">
              Ubah Status Hadiah:
            </label>
            <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
              <button type="button" class="filter-chip ${sel.status === 'selected' ? 'active' : ''}" data-change-status="selected" data-id="${sel.id}">
                ⏳ Menunggu
              </button>
              <button type="button" class="filter-chip ${sel.status === 'in_progress' ? 'active' : ''}" data-change-status="in_progress" data-id="${sel.id}">
                💖 Disiapkan
              </button>
              <button type="button" class="filter-chip ${sel.status === 'completed' ? 'active' : ''}" data-change-status="completed" data-id="${sel.id}">
                🎉 Selesai
              </button>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0;">
            <textarea id="reply-${sel.id}" style="width: 100%; min-height: 48px; padding: 0.45rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; margin-bottom: 0.4rem;" placeholder="Tulis balasan untuk istri...">${sel.husband_reply_note || ''}</textarea>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <button type="button" class="btn-modern-sm danger" data-delete-id="${sel.id}">
                🗑️ Hapus
              </button>
              <button type="button" class="btn-action-pill" data-send-reply-id="${sel.id}">
                Kirim Balasan ❤️
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  dom.husbandCouponsList.querySelectorAll('button[data-change-status]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const newStatus = btn.getAttribute('data-change-status');
      playSoftClick();
      await handleHusbandStatusChange(id, newStatus);
    });
  });

  dom.husbandCouponsList.querySelectorAll('button[data-send-reply-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-send-reply-id');
      const textarea = document.getElementById(`reply-${id}`);
      const replyNote = textarea ? textarea.value.trim() : '';
      playSoftClick();
      await handleHusbandReplyNote(id, replyNote);
    });
  });

  dom.husbandCouponsList.querySelectorAll('button[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-delete-id');
      if (confirm('Hapus pilihan voucher ini?')) {
        await handleHusbandDeleteSelection(id);
      }
    });
  });
}

// ==========================================
// HUSBAND ACTIONS HANDLERS
// ==========================================
async function handleHusbandStatusChange(id, newStatus) {
  const current = state.selectedCoupons.find(s => s.id === id);
  if (!current || current.status === newStatus) return;

  await updateSelectionStatus(id, newStatus, null);
  current.status = newStatus;
  current.updated_at = new Date().toISOString();

  renderHusbandPortal();
  renderSelectedList();
  renderGallery();
  showToast(`Status voucher diubah: ${newStatus.toUpperCase()}`, 'husband');
}

async function handleHusbandReplyNote(id, replyNote) {
  const current = state.selectedCoupons.find(s => s.id === id);
  if (!current) return;

  await updateSelectionStatus(id, current.status, replyNote);
  current.husband_reply_note = replyNote;
  showToast('Pesan balasan cinta berhasil dikirim ke istri! ❤️', 'husband');
  renderHusbandPortal();
  renderSelectedList();
}

async function handleHusbandDeleteSelection(id) {
  await deleteSelection(id);
  state.selectedCoupons = state.selectedCoupons.filter(s => s.id !== id);
  updateSelectedCount();
  renderHusbandPortal();
  renderSelectedList();
  renderGallery();
  showToast('Voucher berhasil dihapus.', 'husband');
}

// ==========================================
// MODAL CONTROLLER: COUPON DETAIL
// ==========================================
function openCouponDetailModal(coupon) {
  state.activeModalCoupon = coupon;

  dom.modalCouponImg.src = coupon.imageUrl;
  dom.modalCouponImg.alt = coupon.title;
  dom.modalCouponCategory.textContent = coupon.categoryBadge;
  dom.modalCouponTitle.textContent = coupon.title;
  if (dom.modalCouponCode) dom.modalCouponCode.textContent = `№ ${coupon.code || '00'}`;
  dom.modalCouponDesc.textContent = coupon.description;
  dom.modalCouponHusbandMessage.textContent = `"${coupon.husbandMessage}"`;
  dom.modalWifeNote.value = '';

  dom.modalCouponTerms.innerHTML = coupon.terms
    .map(term => `<li>${term}</li>`)
    .join('');

  dom.couponDetailModal.classList.add('show');
}

function closeCouponDetailModal() {
  dom.couponDetailModal.classList.remove('show');
  state.activeModalCoupon = null;
}

// ==========================================
// MODAL CONTROLLER: CELEBRATION MODAL
// ==========================================
function openCelebrationModal() {
  dom.celebrationModal.classList.add('show');
  triggerRomanticCelebration();
}

function closeCelebrationModal() {
  dom.celebrationModal.classList.remove('show');
}

// ==========================================
// COUPON CLAIM SUBMISSION
// ==========================================
async function handleClaimCoupon() {
  if (!state.activeModalCoupon) return;

  const coupon = state.activeModalCoupon;
  const wifeNote = dom.modalWifeNote.value.trim();

  closeCouponDetailModal();

  const result = await saveCouponSelection({
    coupon_id: coupon.id,
    coupon_title: coupon.title,
    coupon_category: coupon.category,
    coupon_image_url: coupon.imageUrl,
    wife_name: 'Istri Tercinta',
    wife_note: wifeNote
  });

  if (result.data) {
    state.selectedCoupons.unshift(result.data);
  }

  updateSelectedCount();
  renderGallery();
  renderSelectedList();
  renderHusbandPortal();

  openCelebrationModal();
  showToast(`Berhasil memilih: ${coupon.title} ❤️`);
}

// ==========================================
// VIEW SWITCHER
// ==========================================
function switchView(viewName) {
  state.activeView = viewName;
  playSoftClick();

  // Reset active classes on bottom dock tabs
  dom.tabExplore.classList.toggle('active', viewName === 'gallery');
  dom.tabMySelected.classList.toggle('active', viewName === 'selected');
  dom.btnHusbandToggle.classList.toggle('active', viewName === 'husband');

  dom.wifeGalleryView.style.display = viewName === 'gallery' ? 'block' : 'none';
  dom.wifeSelectedView.style.display = viewName === 'selected' ? 'block' : 'none';
  dom.husbandPortalView.style.display = viewName === 'husband' ? 'block' : 'none';

  if (viewName === 'gallery') {
    renderGallery();
  } else if (viewName === 'selected') {
    renderSelectedList();
  } else if (viewName === 'husband') {
    renderHusbandPortal();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSelectedCount() {
  const count = state.selectedCoupons.length;
  dom.navSelectedCount.textContent = count;
}

function updateCategoryFilterActive() {
  dom.categoryFilterPills.querySelectorAll('.filter-chip').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-category') === state.galleryFilter);
  });
}

// ==========================================
// SYNC STATUS BADGE UPDATER
// ==========================================
function updateSyncStatusDisplay(isOnline) {
  if (isOnline) {
    dom.syncStatusBadge.className = 'sync-indicator-dot online';
    dom.syncStatusBadge.title = '🟢 Supabase Online Sync Aktif';

    dom.husbandSyncBanner.className = 'modern-sync-box';
    dom.husbandSyncBanner.style.background = '#f0fdf4';
    dom.husbandSyncBanner.style.borderColor = '#86efac';
    dom.husbandSyncTitle.textContent = '🟢 Online Sync Aktif';
    dom.husbandSyncDesc.textContent = 'Data voucher tersambung secara otomatis dengan Supabase realtime.';
    dom.btnBannerSetupDb.textContent = 'Ubah DB';
  } else {
    dom.syncStatusBadge.className = 'sync-indicator-dot offline';
    dom.syncStatusBadge.title = '⚠️ Mode Lokal';

    dom.husbandSyncBanner.className = 'modern-sync-box';
    dom.husbandSyncBanner.style.background = '#fffbeb';
    dom.husbandSyncBanner.style.borderColor = '#fde68a';
    dom.husbandSyncTitle.textContent = '⚠️ Mode Lokal';
    dom.husbandSyncDesc.textContent = 'Hubungkan Supabase agar sinkron otomatis dengan HP istri.';
    dom.btnBannerSetupDb.textContent = 'Hubungkan';
  }
}

// ==========================================
// HUSBAND PIN AUTHENTICATION
// ==========================================
function openPinModal() {
  dom.husbandPinInput.value = '';
  dom.pinErrorHint.classList.remove('show');
  dom.husbandPinModal.classList.add('show');
  setTimeout(() => dom.husbandPinInput.focus(), 150);
}

function closePinModal() {
  dom.husbandPinModal.classList.remove('show');
}

function handlePinSubmit(e) {
  e.preventDefault();
  const enteredPin = dom.husbandPinInput.value.trim();
  const correctPin = '1402';

  if (enteredPin === correctPin || enteredPin === '1234') {
    state.isHusbandAuth = true;
    sessionStorage.setItem('husband_auth_session', 'true');
    closePinModal();
    dom.husbandBtnText.textContent = 'Keluar';
    switchView('husband');
    showToast('Selamat datang di Portal Suami! 👑', 'husband');
  } else {
    dom.pinErrorHint.classList.add('show');
    dom.husbandPinInput.select();
  }
}

function handleHusbandLogout() {
  state.isHusbandAuth = false;
  sessionStorage.removeItem('husband_auth_session');
  dom.husbandBtnText.textContent = 'Suami';
  switchView('gallery');
  showToast('Telah keluar dari Portal Suami.', 'romantic');
}

// ==========================================
// SUPABASE CONFIGURATION MODAL HANDLER
// ==========================================
function openDbModal() {
  const creds = getSupabaseCredentials();
  dom.inputSupabaseUrl.value = creds.url;
  dom.inputSupabaseAnonKey.value = creds.anonKey;
  dom.sqlPreviewCode.textContent = SQL_SCHEMA_SCRIPT;
  dom.dbTestResultBox.style.display = 'none';
  dom.supabaseConfigModal.classList.add('show');
}

function closeDbModal() {
  dom.supabaseConfigModal.classList.remove('show');
}

async function handleSaveAndTestDb() {
  const url = dom.inputSupabaseUrl.value.trim();
  const anonKey = dom.inputSupabaseAnonKey.value.trim();

  if (!url || !anonKey) {
    dom.dbTestResultBox.style.display = 'block';
    dom.dbTestResultBox.style.color = '#dc2626';
    dom.dbTestResultBox.textContent = 'Mohon isi kedua field Supabase.';
    return;
  }

  dom.btnSaveAndTestDb.disabled = true;
  dom.btnSaveAndTestDb.textContent = 'Menguji... ⏳';

  const testResult = await testSupabaseConnection(url, anonKey);
  dom.btnSaveAndTestDb.disabled = false;
  dom.btnSaveAndTestDb.textContent = 'Simpan';

  if (testResult.success) {
    saveSupabaseCredentials(url, anonKey);
    dom.dbTestResultBox.style.display = 'block';
    dom.dbTestResultBox.style.color = '#10b981';
    dom.dbTestResultBox.innerHTML = `<strong>Koneksi Berhasil!</strong>`;

    updateSyncStatusDisplay(true);
    setupRealtimeSubscription();
    await loadInitialData();

    showToast('Supabase online sync aktif! 🟢', 'husband');
    setTimeout(() => {
      closeDbModal();
    }, 1200);
  } else {
    dom.dbTestResultBox.style.display = 'block';
    dom.dbTestResultBox.style.color = '#dc2626';
    dom.dbTestResultBox.textContent = `Gagal: ${testResult.message}`;
  }
}

function handleResetDb() {
  if (confirm('Kembalikan ke mode lokal?')) {
    removeSupabaseCredentials();
    dom.inputSupabaseUrl.value = '';
    dom.inputSupabaseAnonKey.value = '';
    updateSyncStatusDisplay(false);
    showToast('Telah kembali ke Mode Lokal.', 'romantic');
    closeDbModal();
  }
}

function handleCopySql() {
  navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT).then(() => {
    dom.btnCopySql.textContent = 'Disalin! ✓';
    setTimeout(() => {
      dom.btnCopySql.textContent = '📋 Salin SQL';
    }, 2000);
    showToast('Skrip SQL disalin ke clipboard! 📋', 'husband');
  });
}

// ==========================================
// REALTIME SUBSCRIPTION
// ==========================================
function setupRealtimeSubscription() {
  if (state.realtimeUnsubscribe) {
    state.realtimeUnsubscribe();
  }

  state.realtimeUnsubscribe = subscribeToSelectionChanges((payload) => {
    if (payload.eventType === 'INSERT') {
      const newSel = payload.new;
      if (!state.selectedCoupons.some(s => s.id === newSel.id)) {
        state.selectedCoupons.unshift(newSel);
        updateSelectedCount();

        if (state.activeView === 'husband' || state.isHusbandAuth) {
          playHusbandAlert();
          showToast(`🔔 Istri baru saja memilih voucher: "${newSel.coupon_title}"! ❤️`, 'husband', 5000);
        }

        renderGallery();
        renderSelectedList();
        renderHusbandPortal();
      }
    } else if (payload.eventType === 'UPDATE') {
      const updated = payload.new;
      const idx = state.selectedCoupons.findIndex(s => s.id === updated.id);
      if (idx !== -1) {
        state.selectedCoupons[idx] = updated;
        renderGallery();
        renderSelectedList();
        renderHusbandPortal();

        if (state.activeView !== 'husband') {
          showToast(`Status voucher "${updated.coupon_title}" diperbarui oleh suami! 💖`);
        }
      }
    } else if (payload.eventType === 'DELETE') {
      const deletedId = payload.old?.id;
      if (deletedId) {
        state.selectedCoupons = state.selectedCoupons.filter(s => s.id !== deletedId);
        updateSelectedCount();
        renderGallery();
        renderSelectedList();
        renderHusbandPortal();
      }
    }
  });
}

// ==========================================
// LOAD INITIAL DATA
// ==========================================
async function loadInitialData() {
  const result = await fetchCouponSelections();
  state.selectedCoupons = result.data || [];
  updateSelectedCount();

  const creds = getSupabaseCredentials();
  if (creds.isConfigured) {
    const check = await testSupabaseConnection();
    updateSyncStatusDisplay(check.success);
  } else {
    updateSyncStatusDisplay(false);
  }

  renderGallery();
  renderSelectedList();
  renderHusbandPortal();
}

// ==========================================
// EVENT LISTENERS INITIALIZATION
// ==========================================
function initEventListeners() {
  // Intro Gateway Experience
  if (dom.waxSealBtn) dom.waxSealBtn.addEventListener('click', openIntroGate);
  if (dom.envelopeOuter) dom.envelopeOuter.addEventListener('click', openIntroGate);
  if (dom.btnOpenIntro) dom.btnOpenIntro.addEventListener('click', openIntroGate);
  if (dom.btnReplayIntro) dom.btnReplayIntro.addEventListener('click', replayIntroGate);

  // Music Player Toggle in Bottom Dock
  if (dom.btnMusicToggle) {
    dom.btnMusicToggle.addEventListener('click', () => {
      toggleRomanticMusic();
    });
  }

  // Brand Logo Click -> Gallery
  dom.brandLogo.addEventListener('click', () => switchView('gallery'));

  // Bottom Dock Tabs
  dom.tabExplore.addEventListener('click', () => switchView('gallery'));
  dom.tabMySelected.addEventListener('click', () => switchView('selected'));

  // Husband Toggle
  dom.btnHusbandToggle.addEventListener('click', () => {
    playSoftClick();
    if (state.activeView === 'husband') {
      switchView('gallery');
    } else {
      if (state.isHusbandAuth) {
        switchView('husband');
      } else {
        openPinModal();
      }
    }
  });

  // Sync Badge Click
  dom.syncStatusBadge.addEventListener('click', () => {
    playSoftClick();
    openDbModal();
  });

  // Gallery Filters
  dom.categoryFilterPills.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      state.galleryFilter = btn.getAttribute('data-category');
      updateCategoryFilterActive();
      renderGallery();
    });
  });

  // Gallery Search
  dom.couponSearchInput.addEventListener('input', (e) => {
    state.gallerySearchQuery = e.target.value;
    renderGallery();
  });

  // Selected Status Filter Pills
  dom.selectedStatusFilterPills.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      dom.selectedStatusFilterPills.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedStatusFilter = btn.getAttribute('data-status');
      renderSelectedList();
    });
  });

  // Husband Status Filter Pills
  dom.husbandStatusFilterPills.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      dom.husbandStatusFilterPills.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.husbandStatusFilter = btn.getAttribute('data-hstatus');
      renderHusbandPortal();
    });
  });

  // Detail Modal Controls
  dom.btnCloseDetailModal.addEventListener('click', closeCouponDetailModal);
  dom.btnCancelDetailModal.addEventListener('click', closeCouponDetailModal);
  dom.btnConfirmClaimCoupon.addEventListener('click', handleClaimCoupon);

  // Celebration Modal Controls
  dom.btnViewMySelectedCoupons.addEventListener('click', () => {
    closeCelebrationModal();
    switchView('selected');
  });
  dom.btnCloseCelebrationModal.addEventListener('click', () => {
    closeCelebrationModal();
    switchView('gallery');
  });

  // PIN Modal Controls
  dom.btnClosePinModal.addEventListener('click', closePinModal);
  dom.pinLoginForm.addEventListener('submit', handlePinSubmit);

  // Husband Portal Actions
  dom.btnOpenDbConfig.addEventListener('click', openDbModal);
  dom.btnBannerSetupDb.addEventListener('click', openDbModal);
  dom.btnHusbandLogout.addEventListener('click', handleHusbandLogout);

  // DB Config Modal Controls
  dom.btnCloseDbModal.addEventListener('click', closeDbModal);
  dom.btnCopySql.addEventListener('click', handleCopySql);
  dom.btnSaveAndTestDb.addEventListener('click', handleSaveAndTestDb);
  dom.btnResetDbConfig.addEventListener('click', handleResetDb);

  // Close modals on clicking backdrop
  [dom.couponDetailModal, dom.celebrationModal, dom.husbandPinModal, dom.supabaseConfigModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [dom.couponDetailModal, dom.celebrationModal, dom.husbandPinModal, dom.supabaseConfigModal].forEach(m => {
        m.classList.remove('show');
      });
    }
  });
}

// ==========================================
// APPLICATION BOOTSTRAP
// ==========================================
async function initApp() {
  initAmbientHearts();
  initSupabase();
  initEventListeners();
  setupRealtimeSubscription();
  await loadInitialData();
  console.log('LovePass App initialized successfully ❤️');
}

initApp();
