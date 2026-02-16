const STATE = {
  folders: [],
  databases: [],
  favoriteFolderIds: new Set(),
  favoriteDatabaseIds: new Set(),
  selectedFolderId: null,
  selectedDatabaseId: null,
  selectedDatabase: null,
  filters: [],
  records: [],
  totalRecords: 0,
  totalDatabaseRecords: 0,
  page: 1,
  pageSize: 50,
  search: '',
  activeViewId: null,
  sorts: [],
  chartInstances: {},
  tagColors: [],
  language: 'en',
  appSettings: null,
  selectedRecordIds: [],
  expandedFolderIds: new Set(),
};

const I18N = {
  es: {
    allDatabases: 'Todas las bases de datos',
    records: 'registros',
    previous: 'Anterior',
    next: 'Siguiente',
    pageOf: 'Página {page} de {totalPages} · {total} registros',
    deleteRecordConfirm: '¿Eliminar registro?',
    addRow: 'Nueva fila',
    globalSettings: 'Ajustes generales',
    generalTab: 'General',
    interfaceTab: 'Interfaz',
    backupTab: 'Backup',
    dangerTab: 'Danger Zone',
    languageLabel: 'Idioma',
    languageSpanish: 'Español',
    languageEnglish: 'Inglés',
    save: 'Guardar',
    close: 'Cancelar',
    tableView: 'Tabla',
    galleryView: 'Galería',
    analysisView: 'Análisis',
    deleteAttachmentConfirm: '¿Eliminar este adjunto? Esta acción no se puede deshacer.',
    deleteAttachment: 'Eliminar adjunto',
    downloadFile: '¿Deseas descargar este archivo?',
    exportDb: 'Exportar base de datos',
    importDb: 'Restaurar backup',
    exportFull: 'Base de datos completa',
    exportView: 'Vista actual (con filtros)',
    includeFiles: 'Incluir archivos adjuntos',
    restoreInfo: 'Selecciona un archivo .json o .zip exportado previamente para restaurar la base de datos con todas sus filas, propiedades y archivos.',
    restoreSuccess: 'Base de datos restaurada correctamente.',
    portfolioBackupInfo: 'Descarga un ZIP con toda la aplicación (datos y archivos) o restaura un ZIP completo para recuperar todo el portfolio.',
    portfolioRestoreWarning: 'La restauración completa reemplaza TODO el portfolio actual (bases, carpetas, ajustes y archivos).',
    downloadFullBackup: 'Descargar backup completo',
    restoreFullBackup: 'Restaurar backup completo',
    chooseZipFile: 'Archivo ZIP de backup',
    restoringPortfolio: 'Restaurando portfolio…',
    portfolioRestoreSuccess: 'Portfolio restaurado correctamente.',
    dangerZoneTitle: 'Eliminar todos los datos',
    dangerZoneDescription: 'Esta acción borra permanentemente toda la información guardada: bases de datos, carpetas, archivos adjuntos y configuración.',
    deleteAllData: 'Eliminar todos los datos',
    deletingAllData: 'Eliminando datos…',
    deleteAllDataConfirm: '¿Seguro que quieres eliminar TODO? Esta acción no se puede deshacer.',
    deleteAllDataSuccess: 'Todos los datos fueron eliminados correctamente.',
  },
  en: {
    allDatabases: 'All databases',
    records: 'records',
    previous: 'Previous',
    next: 'Next',
    pageOf: 'Page {page} of {totalPages} · {total} records',
    deleteRecordConfirm: 'Delete record?',
    addRow: 'New row',
    globalSettings: 'Global settings',
    generalTab: 'General',
    interfaceTab: 'Interface',
    backupTab: 'Backup',
    dangerTab: 'Danger Zone',
    languageLabel: 'Language',
    languageSpanish: 'Spanish',
    languageEnglish: 'English',
    save: 'Save',
    close: 'Cancel',
    tableView: 'Table',
    galleryView: 'Gallery',
    analysisView: 'Analysis',
    deleteAttachmentConfirm: 'Delete this attachment? This action cannot be undone.',
    deleteAttachment: 'Delete attachment',
    downloadFile: 'Do you want to download this file?',
    exportDb: 'Export database',
    importDb: 'Restore backup',
    exportFull: 'Full database',
    exportView: 'Current view (with filters)',
    includeFiles: 'Include attached files',
    restoreInfo: 'Select a previously exported .json or .zip file to restore the database with all its rows, properties and files.',
    restoreSuccess: 'Database restored successfully.',
    portfolioBackupInfo: 'Download a ZIP with the full application (data and files) or restore a full ZIP to recover the entire portfolio.',
    portfolioRestoreWarning: 'Full restore replaces the entire current portfolio (databases, folders, settings and files).',
    downloadFullBackup: 'Download full backup',
    restoreFullBackup: 'Restore full backup',
    chooseZipFile: 'Backup ZIP file',
    restoringPortfolio: 'Restoring portfolio…',
    portfolioRestoreSuccess: 'Portfolio restored successfully.',
    dangerZoneTitle: 'Delete all data',
    dangerZoneDescription: 'This action permanently deletes all saved information: databases, folders, attached files and app settings.',
    deleteAllData: 'Delete all data',
    deletingAllData: 'Deleting data…',
    deleteAllDataConfirm: 'Are you sure you want to delete EVERYTHING? This action cannot be undone.',
    deleteAllDataSuccess: 'All data was deleted successfully.',
  },
};

const PROPERTY_TYPES = [
  { value: 'text', labelEs: 'Texto libre', labelEn: 'Free text' },
  { value: 'singleSelect', labelEs: 'Selección única', labelEn: 'Single select' },
  { value: 'multiSelect', labelEs: 'Selección múltiple', labelEn: 'Multi select' },
  { value: 'autoId', labelEs: 'ID autogenerado', labelEn: 'Auto-generated ID' },
  { value: 'url', labelEs: 'URL', labelEn: 'URL' },
  { value: 'checkbox', labelEs: 'Casilla (booleano)', labelEn: 'Checkbox (boolean)' },
  { value: 'date', labelEs: 'Fecha', labelEn: 'Date' },
  { value: 'time', labelEs: 'Hora', labelEn: 'Time' },
  { value: 'attachment', labelEs: 'Adjuntos', labelEn: 'Attachments' },
  { value: 'relation', labelEs: 'Relación', labelEn: 'Relation' },
  { value: 'rollup', labelEs: 'Rollup', labelEn: 'Rollup' },
];

const BASIC_TAG_COLOR_PALETTE = [
  { name: 'yellow', labelEs: 'Amarillo', labelEn: 'Yellow', hex: '#fdecc8' },
  { name: 'orange', labelEs: 'Naranja', labelEn: 'Orange', hex: '#fadec9' },
  { name: 'pink', labelEs: 'Rosa', labelEn: 'Pink', hex: '#f5e0e9' },
  { name: 'red', labelEs: 'Rojo', labelEn: 'Red', hex: '#ffe2dd' },
  { name: 'violet', labelEs: 'Violeta', labelEn: 'Violet', hex: '#e8deee' },
  { name: 'green', labelEs: 'Verde', labelEn: 'Green', hex: '#dbeddb' },
  { name: 'blue', labelEs: 'Azul', labelEn: 'Blue', hex: '#d3e5ef' },
  { name: 'gray', labelEs: 'Gris', labelEn: 'Gray', hex: '#e3e2e0' },
  { name: 'black', labelEs: 'Negro', labelEn: 'Black', hex: '#1f1f1f' },
];

const COLOR_HEX_BY_NAME = {
  blue: '#d3e5ef',
  green: '#dbeddb',
  red: '#ffe2dd',
  yellow: '#fdecc8',
  orange: '#fadec9',
  purple: '#e8deee',
  violet: '#e8deee',
  pink: '#f5e0e9',
  teal: '#d3e5e0',
  gray: '#e3e2e0',
  brown: '#eee0da',
  black: '#1f1f1f',
};

const FILTER_OPERATORS = [
  { value: 'contains', labelEs: 'Contiene', labelEn: 'Contains' },
  { value: 'notContains', labelEs: 'No contiene', labelEn: 'Does not contain' },
  { value: 'equals', labelEs: 'Es igual a', labelEn: 'Equals' },
  { value: 'notEquals', labelEs: 'Es distinto de', labelEn: 'Does not equal' },
  { value: 'isEmpty', labelEs: 'Está vacío', labelEn: 'Is empty' },
  { value: 'isNotEmpty', labelEs: 'No está vacío', labelEn: 'Is not empty' },
  { value: 'before', labelEs: 'Antes de', labelEn: 'Before' },
  { value: 'after', labelEs: 'Después de', labelEn: 'After' },
  { value: 'checked', labelEs: 'Marcado', labelEn: 'Checked' },
  { value: 'unchecked', labelEs: 'No marcado', labelEn: 'Unchecked' },
];

const PROPERTY_MENU_STATE = {
  menu: null,
  propertyId: null,
};

const VIEW_MENU_STATE = {
  menu: null,
  viewId: null,
};

const SELECT_VALUE_MENU_STATE = {
  menu: null,
  anchorEl: null,
  propertyId: null,
};

const SELECT_OPTION_MENU_STATE = {
  menu: null,
};

const SIDEBAR_ITEM_MENU_STATE = {
  menu: null,
};

const SIDEBAR_FAVORITES_STORAGE_KEY = 'dubydb.sidebarFavorites.v1';

function t(key, vars = {}) {
  const lang = I18N[STATE.language] ? STATE.language : 'en';
  const text = I18N[lang][key] || I18N.en[key] || key;
  return text.replace(/\{(\w+)\}/g, (_m, name) => String(vars[name] ?? ''));
}

function tr(esText, enText) {
  return STATE.language === 'en' ? enText : esText;
}

function typeLabel(item) {
  return STATE.language === 'en' ? item.labelEn : item.labelEs;
}

function filterLabel(item) {
  return STATE.language === 'en' ? item.labelEn : item.labelEs;
}

function colorLabel(item) {
  return STATE.language === 'en' ? item.labelEn : item.labelEs;
}

function icon(name) {
  const map = {
    folder: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H3V6Zm18 5v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7h18Z"/></svg>',
    table: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 4h18v16H3V4Zm2 2v3h14V6H5Zm14 5H5v3h14v-3Zm0 5H5v2h14v-2Z"/></svg>',
    gallery: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm1 2v12h14V6H5Zm2 2h4v4H7V8Zm6 1h4v2h-4V9Zm0 4h4v2h-4v-2ZM7 14h4v2H7v-2Z"/></svg>',
    analysis: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 19h16v2H2V3h2v16Zm2-2V9h3v8H6Zm5 0V5h3v12h-3Zm5 0v-6h3v6h-3Z"/></svg>',
    trash: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v9h-2V9Zm4 0h2v9h-2V9ZM6 9h2v9H6V9Zm1 12h10a2 2 0 0 0 2-2V8H5v11a2 2 0 0 0 2 2Z"/></svg>',
    edit: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.06 9.02 15.48 10.44 5.75 20.17H4.33V18.75l9.73-9.73ZM17.66 3c-.37 0-.73.15-1 .41l-1.83 1.83 2.83 2.83 1.83-1.83a1.41 1.41 0 0 0 0-2L18.66 3.4c-.27-.26-.63-.4-1-.4Z"/></svg>',
    swap: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m16 3 4 4-4 4V8H9V6h7V3ZM8 13v3h7v2H8v3l-4-4 4-4Z"/></svg>',
    filter: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5h18v2l-7 7v5l-4 2v-7L3 7V5Z"/></svg>',
    sort: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 4h2v12h3l-4 4-4-4h3V4Zm6 2h8v2h-8V6Zm0 5h6v2h-6v-2Zm0 5h4v2h-4v-2Z"/></svg>',
    hide: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 5c5.5 0 9.58 3.61 11 7-1.42 3.39-5.5 7-11 7S2.42 15.39 1 12c1.42-3.39 5.5-7 11-7Zm0 2C8.13 7 5.06 9.32 3.3 12 5.06 14.68 8.13 17 12 17s6.94-2.32 8.7-5C18.94 9.32 15.87 7 12 7Zm0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg>',
    fit: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 4h7v2H7.41L10 8.59 8.59 10 6 7.41V11H4V4Zm16 0v7h-2V7.41L15.41 10 14 8.59 16.59 6H13V4h7ZM4 13h2v3.59L8.59 14 10 15.41 7.41 18H11v2H4v-7Zm16 0v7h-7v-2h3.59L14 15.41 15.41 14 18 16.59V13h2Z"/></svg>',
    copy: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1Zm4 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h12v14Z"/></svg>',
    star: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z"/></svg>',
    download: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 20h14v-2H5v2Zm7-16v8.17l3.59-3.58L17 10l-5 5-5-5 1.41-1.41L11 12.17V4h1Z"/></svg>',
    close: '<svg class="svg-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="m18.3 5.71-1.41-1.42L12 9.17 7.11 4.29 5.7 5.71 10.59 10.6 5.7 15.49l1.41 1.42L12 12.03l4.89 4.88 1.41-1.42-4.89-4.89 4.89-4.89Z"/></svg>',
    document: '<svg class="attachment-doc-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM8 13h8v1.5H8V13Zm0 3h8v1.5H8V16Z"/></svg>',
    audio: '<svg class="attachment-doc-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3.23v17.54a3 3 0 1 1-2-2.83V6.5L8 7.83v7.94a3 3 0 1 1-2-2.83V6.39l8-3.16Z"/></svg>',
    video: '<svg class="attachment-doc-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2.18l3.55-2.37A1 1 0 0 1 22 6.64v10.72a1 1 0 0 1-1.45.83L17 15.82V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Zm14 4.22v3.56l3 2v-7.56l-3 2Z"/></svg>',
  };
  return map[name] || '';
}

function attachmentFileName(url) {
  const clean = String(url || '').split('?')[0].split('#')[0];
  const name = clean.split('/').pop() || 'archivo';
  try {
    return decodeURIComponent(name);
  } catch {
    return name;
  }
}

function isImageAttachment(url) {
  return /\.(png|jpg|jpeg|gif|webp|svg|bmp|avif)$/i.test(String(url || '').split('?')[0]);
}

function attachmentFileKind(url) {
  const clean = String(url || '').split('?')[0].toLowerCase();
  if (/\.(mp3|wav|ogg|m4a|flac|aac|opus|amr)$/i.test(clean)) return 'audio';
  if (/\.(mp4|mov|m4v|avi|mkv|webm|wmv|mpeg|mpg)$/i.test(clean)) return 'video';
  return 'document';
}

function attachmentIconForUrl(url) {
  return icon(attachmentFileKind(url));
}

function confirmAttachmentDownload(url) {
  if (!url) return;
  openConfirmMini({
    message: t('downloadFile'),
    confirmText: 'Descargar',
    onConfirm: () => {
      window.open(url, '_blank', 'noopener,noreferrer');
    },
  });
}

function openImagePreviewModal(url, fileName = '') {
  if (!url) return;

  const modal = document.getElementById('modal');
  const safeName = fileName || attachmentFileName(url);
  modal.style.width = 'min(960px, 96vw)';
  modal.innerHTML = `
    <form method="dialog" class="image-preview-form">
      <div class="image-preview-body">
        <div class="image-preview-frame">
          <img src="${escapeHtml(url)}" alt="${escapeHtml(safeName)}" />
        </div>
      </div>
      <div class="image-preview-actions">
        <button type="button" class="btn" id="imagePreviewClose">${icon('close')}<span>${escapeHtml(tr('Cerrar', 'Close'))}</span></button>
        <button type="button" class="btn btn-primary" id="imagePreviewDownload">${icon('download')}<span>${escapeHtml(tr('Descargar', 'Download'))}</span></button>
      </div>
    </form>
  `;

  modal.showModal();

  const closeBtn = modal.querySelector('#imagePreviewClose');
  const downloadBtn = modal.querySelector('#imagePreviewDownload');

  closeBtn?.addEventListener('click', () => {
    modal.close();
  });

  downloadBtn?.addEventListener('click', () => {
    modal.close();
    confirmAttachmentDownload(url);
  });

  const onModalClick = (event) => {
    if (event.target === modal) {
      modal.close();
    }
  };
  modal.addEventListener('click', onModalClick);
  modal.addEventListener('close', () => {
    modal.removeEventListener('click', onModalClick);
  }, { once: true });
}

function shouldIgnoreRowBackgroundClick(target) {
  if (!(target instanceof Element)) return false;
  if (target.closest('.select-col')) return true;
  if (target.closest('input, select, textarea, button, a, label')) return true;
  if (target.closest('.inline-tag-trigger, .attachment-dropzone, .attachment-preview-btn, .attachment-delete-btn, .table-trash-btn')) return true;
  return false;
}

/* ── Minimalist confirmation modal (no popups) ── */
function openConfirmMini({ message, confirmText = 'Confirmar', cancelText, onConfirm, danger = false }) {
  const modal = document.getElementById('modal');
  const cancelLabel = cancelText || t('close');
  modal.style.width = '380px';
  modal.innerHTML = `
    <form method="dialog" class="confirm-mini-form">
      <p class="confirm-mini-msg">${escapeHtml(message)}</p>
      <div class="confirm-mini-actions">
        <button type="button" class="btn" id="confirmMiniCancel">${escapeHtml(cancelLabel)}</button>
        <button type="submit" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" value="default" autofocus>${escapeHtml(confirmText)}</button>
      </div>
    </form>
  `;
  modal.showModal();
  modal.querySelector('#confirmMiniCancel')?.addEventListener('click', () => {
    modal.close();
  });
  modal.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    modal.close();
    if (onConfirm) onConfirm();
  });
}

async function deleteAttachmentByUrl(url) {
  await api('/api/attachments-by-url', { method: 'DELETE', body: { url } });
  await loadRecords();
  await refreshBootstrap();
}

function confirmDeleteAttachment(url) {
  openConfirmMini({
    message: t('deleteAttachmentConfirm'),
    confirmText: t('deleteAttachment'),
    danger: true,
    onConfirm: () => deleteAttachmentByUrl(url),
  });
}

async function copyTextToClipboard(text) {
  const value = String(text ?? '');
  if (!value) return false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_error) {
      // fallback below
    }
  }

  const temp = document.createElement('textarea');
  temp.value = value;
  temp.setAttribute('readonly', 'readonly');
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  temp.style.pointerEvents = 'none';
  document.body.appendChild(temp);
  temp.focus();
  temp.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (_error) {
    copied = false;
  }

  temp.remove();
  return copied;
}

async function copyWithVisualFeedback(button, text, labels = {}) {
  if (!button) return false;

  const idle = labels.idle || button.dataset.copyIdle || button.textContent || tr('Copiar', 'Copy');
  const copiedLabel = labels.copied || tr('Copiado', 'Copied');
  const errorLabel = labels.error || tr('No se pudo copiar', 'Could not copy');

  button.dataset.copyIdle = idle;
  button.disabled = true;

  if (button._copyTimer) {
    clearTimeout(button._copyTimer);
    button._copyTimer = null;
  }

  const ok = await copyTextToClipboard(text);
  button.classList.toggle('is-saved', ok);
  button.textContent = ok ? copiedLabel : errorLabel;

  button._copyTimer = setTimeout(() => {
    button.classList.remove('is-saved');
    button.textContent = idle;
    button.disabled = false;
    button._copyTimer = null;
  }, 1400);

  return ok;
}

function normalizeOptionSortMode(value) {
  const mode = String(value || 'manual').toLowerCase();
  if (mode === 'asc' || mode === 'desc') return mode;
  return 'manual';
}

function sortSelectOptions(options, mode = 'manual') {
  const list = Array.isArray(options) ? [...options] : [];
  const normalized = normalizeOptionSortMode(mode);
  if (normalized === 'manual') return list;

  return list.sort((a, b) => {
    const av = String(a?.label || '');
    const bv = String(b?.label || '');
    const cmp = av.localeCompare(bv, 'es', { sensitivity: 'base' });
    return normalized === 'asc' ? cmp : -cmp;
  });
}

function findSelectOption(options, label) {
  const needle = String(label || '').trim().toLowerCase();
  if (!needle) return null;
  return (Array.isArray(options) ? options : []).find(item => String(item?.label || '').trim().toLowerCase() === needle) || null;
}

function getNextTagColor(indexSeed = 0) {
  if (!STATE.tagColors.length) return 'gray';
  return STATE.tagColors[indexSeed % STATE.tagColors.length] || 'gray';
}

function closeSelectOptionMenu() {
  if (!SELECT_OPTION_MENU_STATE.menu) return;
  SELECT_OPTION_MENU_STATE.menu.remove();
  SELECT_OPTION_MENU_STATE.menu = null;
}

function closeSelectValueMenu() {
  closeSelectOptionMenu();
  if (!SELECT_VALUE_MENU_STATE.menu) return;
  SELECT_VALUE_MENU_STATE.menu.remove();
  SELECT_VALUE_MENU_STATE.menu = null;
  SELECT_VALUE_MENU_STATE.anchorEl = null;
  SELECT_VALUE_MENU_STATE.propertyId = null;
}

function closeAllFloatingMenus(except = null) {
  if (except !== 'property') closePropertyHeaderMenu();
  if (except !== 'view') closeViewHeaderMenu();
  if (except !== 'select') closeSelectValueMenu();
  if (except !== 'sidebar-item') closeSidebarItemMenu();
}

function closeSidebarItemMenu() {
  if (!SIDEBAR_ITEM_MENU_STATE.menu) return;
  SIDEBAR_ITEM_MENU_STATE.menu.remove();
  SIDEBAR_ITEM_MENU_STATE.menu = null;
}

function loadSidebarFavorites() {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_FAVORITES_STORAGE_KEY);
    const parsed = JSON.parse(raw || '{}');
    const folderIds = Array.isArray(parsed.folderIds) ? parsed.folderIds : [];
    const databaseIds = Array.isArray(parsed.databaseIds) ? parsed.databaseIds : [];

    STATE.favoriteFolderIds = new Set(folderIds.map(Number).filter(Boolean));
    STATE.favoriteDatabaseIds = new Set(databaseIds.map(Number).filter(Boolean));
  } catch (_error) {
    STATE.favoriteFolderIds = new Set();
    STATE.favoriteDatabaseIds = new Set();
  }
}

function saveSidebarFavorites() {
  const payload = {
    folderIds: [...STATE.favoriteFolderIds],
    databaseIds: [...STATE.favoriteDatabaseIds],
  };
  window.localStorage.setItem(SIDEBAR_FAVORITES_STORAGE_KEY, JSON.stringify(payload));
}

function syncSidebarFavoritesWithData() {
  const folderIds = new Set(STATE.folders.map(folder => Number(folder.id)));
  const databaseIds = new Set(STATE.databases.map(database => Number(database.id)));

  STATE.favoriteFolderIds = new Set([...STATE.favoriteFolderIds].filter(id => folderIds.has(id)));
  STATE.favoriteDatabaseIds = new Set([...STATE.favoriteDatabaseIds].filter(id => databaseIds.has(id)));
  saveSidebarFavorites();
}

function isFolderFavorite(folderId) {
  return STATE.favoriteFolderIds.has(Number(folderId));
}

function isDatabaseFavorite(databaseId) {
  return STATE.favoriteDatabaseIds.has(Number(databaseId));
}

function toggleSidebarFavorite(kind, entityId) {
  const id = Number(entityId || 0);
  if (!id) return;

  if (kind === 'folder') {
    if (STATE.favoriteFolderIds.has(id)) STATE.favoriteFolderIds.delete(id);
    else STATE.favoriteFolderIds.add(id);
  }

  if (kind === 'database') {
    if (STATE.favoriteDatabaseIds.has(id)) STATE.favoriteDatabaseIds.delete(id);
    else STATE.favoriteDatabaseIds.add(id);
  }

  saveSidebarFavorites();
  renderSidebar();
}

function positionFloatingMenu(menu, anchorEl, { gap = 6, margin = 8, align = 'left', prefer = 'bottom' } = {}) {
  if (!menu || !anchorEl) return;

  const rect = anchorEl.getBoundingClientRect();
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;

  const maxLeft = Math.max(margin, window.innerWidth - menuWidth - margin);
  let left = align === 'right' ? rect.right - menuWidth : rect.left;
  left = Math.max(margin, Math.min(left, maxLeft));

  const belowTop = rect.bottom + gap;
  const aboveTop = rect.top - menuHeight - gap;
  const availableBelow = window.innerHeight - rect.bottom - margin;
  const availableAbove = rect.top - margin;
  const canPlaceBelow = availableBelow >= menuHeight;
  const canPlaceAbove = availableAbove >= menuHeight;

  let top;
  if (prefer === 'top') {
    top = canPlaceAbove ? aboveTop : belowTop;
  } else if (canPlaceBelow || (!canPlaceAbove && availableBelow >= availableAbove)) {
    top = belowTop;
  } else {
    top = aboveTop;
  }

  const maxTop = Math.max(margin, window.innerHeight - menuHeight - margin);
  top = Math.max(margin, Math.min(top, maxTop));

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function normalizeHexColor(color, fallback = '#e3e2e0') {
  const value = String(color || '').trim();
  if (!/^#[0-9a-f]{6}$/i.test(value)) return fallback;
  return value.toLowerCase();
}

function hexToRgb(color) {
  const clean = normalizeHexColor(color).slice(1);
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function nearestTagColorName(color) {
  const source = hexToRgb(color);
  let bestName = 'gray';
  let bestDistance = Number.POSITIVE_INFINITY;

  BASIC_TAG_COLOR_PALETTE.forEach(item => {
    const target = hexToRgb(item.hex);
    const distance = ((source.r - target.r) ** 2) + ((source.g - target.g) ** 2) + ((source.b - target.b) ** 2);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = item.name;
    }
  });

  return bestName;
}

document.addEventListener('DOMContentLoaded', init);

function normalizeTheme(theme) {
  return ['white', 'dark', 'sepia'].includes(String(theme || '').toLowerCase())
    ? String(theme).toLowerCase()
    : 'sepia';
}

async function persistUiSettings(patch = {}) {
  const currentUi = STATE.appSettings?.ui && typeof STATE.appSettings.ui === 'object'
    ? STATE.appSettings.ui
    : {};

  const incoming = {
    ui: {
      ...currentUi,
      ...patch,
    },
  };

  const saved = await api('/api/settings', { method: 'PUT', body: incoming });
  STATE.appSettings = saved;
  STATE.language = saved?.ui?.language === 'es' ? 'es' : 'en';
  return saved;
}

async function init() {
  bindGlobalActions();
  const [bootstrap, tagColors] = await Promise.all([api('/api/bootstrap'), api('/api/tag-colors')]);
  STATE.folders = bootstrap.folders;
  STATE.databases = bootstrap.databases;
  STATE.tagColors = tagColors;
  STATE.appSettings = bootstrap.settings || null;
  STATE.language = bootstrap.settings?.ui?.language === 'es' ? 'es' : 'en';
  loadSidebarFavorites();
  syncSidebarFavoritesWithData();
  restoreSidebarState();
  setupThemeSwitcher();
  applyLanguage();
  renderSidebar();
}

function bindGlobalActions() {
  document.getElementById('btnSidebarToggle').addEventListener('click', toggleSidebar);
  document.getElementById('btnAppSettings').addEventListener('click', openAppSettingsModal);
  document.getElementById('btnNewFolder').addEventListener('click', openCreateFolderModal);
  document.getElementById('btnNewDatabase').addEventListener('click', openCreateDatabaseModal);
  document.getElementById('btnImportCsv').addEventListener('click', openImportCsvModal);
  document.getElementById('btnExportDb').addEventListener('click', openExportDbModal);
  document.getElementById('btnRestoreDb').addEventListener('click', openRestoreDbModal);
  document.getElementById('databaseSearch').addEventListener('input', renderSidebar);
  document.getElementById('recordSearch').addEventListener('input', async (event) => {
    STATE.search = event.target.value;
    STATE.page = 1;
    await loadRecords();
  });
  document.getElementById('btnAdvancedFilter').addEventListener('click', () => openAdvancedCriteriaModal({ focus: 'filter' }));
  document.getElementById('btnAdvancedSort').addEventListener('click', () => openAdvancedCriteriaModal({ focus: 'sort' }));
  document.getElementById('btnNewProperty').addEventListener('click', openCreatePropertyModal);
  document.getElementById('btnNewRecord').addEventListener('click', createEmptyRecord);
  document.getElementById('btnSettings').addEventListener('click', openDatabaseSettingsModal);
  document.getElementById('btnEditDbTitle').addEventListener('click', openRenameDatabaseTitleModal);
  document.getElementById('btnNewView').addEventListener('click', openCreateViewModal);
  document.getElementById('btnUploadHeader').addEventListener('click', () => document.getElementById('headerInput').click());
  document.getElementById('headerInput').addEventListener('change', uploadHeaderImage);
  document.addEventListener('pointerdown', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickedPropertyMenuTrigger = Boolean(target.closest('.header-cell-menu-btn'));
    if (PROPERTY_MENU_STATE.menu && !PROPERTY_MENU_STATE.menu.contains(target) && !clickedPropertyMenuTrigger) {
      closePropertyHeaderMenu();
    }

    const clickedViewMenuTrigger = Boolean(target.closest('.db-view-tab-menu-btn'));
    if (VIEW_MENU_STATE.menu && !VIEW_MENU_STATE.menu.contains(target) && !clickedViewMenuTrigger) {
      closeViewHeaderMenu();
    }

    const clickInsideSelectOptionMenu = Boolean(SELECT_OPTION_MENU_STATE.menu && SELECT_OPTION_MENU_STATE.menu.contains(target));
    const clickedSelectValueTrigger = Boolean(target.closest('.inline-tag-trigger'));
    if (SELECT_VALUE_MENU_STATE.menu && !SELECT_VALUE_MENU_STATE.menu.contains(target) && !clickInsideSelectOptionMenu && !clickedSelectValueTrigger) {
      closeSelectValueMenu();
    }

    const clickedSidebarItemMenuTrigger = Boolean(target.closest('.sidebar-item-menu-btn'));
    if (SIDEBAR_ITEM_MENU_STATE.menu && !SIDEBAR_ITEM_MENU_STATE.menu.contains(target) && !clickedSidebarItemMenuTrigger) {
      closeSidebarItemMenu();
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePropertyHeaderMenu();
    if (event.key === 'Escape') closeViewHeaderMenu();
    if (event.key === 'Escape') closeSelectValueMenu();
    if (event.key === 'Escape') closeSidebarItemMenu();
  });
}

function getActiveView() {
  return STATE.selectedDatabase?.views?.find(view => view.id === STATE.activeViewId) || null;
}

function normalizeViewCriteria(criteria = {}) {
  const validPropertyIds = new Set((STATE.selectedDatabase?.properties || []).map(prop => Number(prop.id)));
  const allowedOperators = new Set(FILTER_OPERATORS.map(item => item.value));

  const filters = Array.isArray(criteria.filters)
    ? criteria.filters
      .map(item => {
        const propertyId = Number(item?.propertyId || 0);
        if (!validPropertyIds.has(propertyId)) return null;
        const operator = allowedOperators.has(item?.operator) ? item.operator : 'contains';
        const value = item?.value === null || item?.value === undefined ? '' : String(item.value);
        return { propertyId, operator, value };
      })
      .filter(Boolean)
    : [];

  const sorts = Array.isArray(criteria.sorts)
    ? criteria.sorts
      .map(item => {
        const propertyId = Number(item?.propertyId || 0);
        if (!validPropertyIds.has(propertyId)) return null;
        const dir = String(item?.dir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
        return { propertyId, dir };
      })
      .filter(Boolean)
    : [];

  return { filters, sorts };
}

function applyCriteriaFromActiveView() {
  const activeView = getActiveView();
  const config = activeView?.config || {};
  const rawCriteria = config.criteria && typeof config.criteria === 'object'
    ? config.criteria
    : { filters: config.filters, sorts: config.sorts };
  const normalized = normalizeViewCriteria(rawCriteria);

  STATE.filters = normalized.filters;
  STATE.sorts = normalized.sorts;
  STATE.page = 1;
}

async function persistActiveViewCriteria() {
  const activeView = getActiveView();
  if (!activeView) return;

  const normalized = normalizeViewCriteria({ filters: STATE.filters, sorts: STATE.sorts });
  const nextConfig = cloneJson(activeView.config || {});
  nextConfig.criteria = {
    filters: normalized.filters,
    sorts: normalized.sorts,
  };

  await persistActiveViewConfig(nextConfig);
}

async function persistActiveViewConfig(nextConfig) {
  const activeView = getActiveView();
  if (!activeView) return;

  await api(`/api/views/${activeView.id}`, {
    method: 'PUT',
    body: { config: nextConfig },
  });

  activeView.config = nextConfig;
}

function orderedVisibleProperties() {
  const visible = visibleProperties();
  const activeView = getActiveView();
  const rawOrder = Array.isArray(activeView?.config?.table?.columnOrder)
    ? activeView.config.table.columnOrder
    : (Array.isArray(activeView?.config?.columnOrder) ? activeView.config.columnOrder : []);

  if (!rawOrder.length) return visible;

  const byId = new Map(visible.map(prop => [Number(prop.id), prop]));
  const ordered = [];
  rawOrder.forEach(id => {
    const prop = byId.get(Number(id));
    if (!prop) return;
    ordered.push(prop);
    byId.delete(Number(id));
  });

  return [...ordered, ...byId.values()];
}

async function reorderActiveViewColumns(fromPropertyId, toPropertyId) {
  const props = orderedVisibleProperties();
  const fromIndex = props.findIndex(prop => Number(prop.id) === Number(fromPropertyId));
  const toIndex = props.findIndex(prop => Number(prop.id) === Number(toPropertyId));
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

  const reordered = [...props];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  const activeView = getActiveView();
  if (!activeView) return;

  const nextConfig = cloneJson(activeView.config || {});
  const tableConfig = nextConfig.table && typeof nextConfig.table === 'object'
    ? nextConfig.table
    : {};
  tableConfig.columnOrder = reordered.map(prop => Number(prop.id));
  nextConfig.table = tableConfig;

  await persistActiveViewConfig(nextConfig);
  renderActiveView();
}

function renderSidebar() {
  closeSidebarItemMenu();
  const tree = document.getElementById('folderTree');
  const searchTerm = document.getElementById('databaseSearch').value.toLowerCase().trim();
  tree.innerHTML = '';

  /* ── Folders with their databases ── */
  const folderRows = STATE.folders.map(folder => {
    const childDatabases = STATE.databases.filter(db => db.folder_id === folder.id);
    return { folder, childDatabases };
  });

  folderRows.forEach(({ folder, childDatabases }) => {
    const filtered = childDatabases.filter(db => !searchTerm || db.name.toLowerCase().includes(searchTerm));
    if (searchTerm && filtered.length === 0) return;

    const isExpanded = STATE.expandedFolderIds.has(folder.id) || !!searchTerm;

    const container = document.createElement('div');
    const folderRow = document.createElement('div');
    folderRow.className = 'sidebar-item-row';

    const folderBtn = document.createElement('button');
    folderBtn.className = `folder ${isFolderFavorite(folder.id) ? 'is-favorite' : ''}`;
    folderBtn.innerHTML = `<div class="folder-row"><span class="folder-title"><span class="folder-toggle-icon ${isExpanded ? 'expanded' : ''}">▶</span>${icon('folder')} ${escapeHtml(folder.name)}</span><span class="count">${childDatabases.length}</span></div>`;
    folderBtn.addEventListener('click', () => {
      if (STATE.expandedFolderIds.has(folder.id)) {
        STATE.expandedFolderIds.delete(folder.id);
      } else {
        STATE.expandedFolderIds.add(folder.id);
      }
      renderSidebar();
    });

    const folderMenuBtn = document.createElement('button');
    folderMenuBtn.type = 'button';
    folderMenuBtn.className = 'sidebar-item-menu-btn';
    folderMenuBtn.innerHTML = '<span class="header-cell-menu-dots">⋯</span>';
    folderMenuBtn.setAttribute('aria-label', tr('Opciones de carpeta', 'Folder options'));
    folderMenuBtn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openSidebarItemMenu('folder', folder, folderMenuBtn);
    });

    folderRow.appendChild(folderBtn);
    folderRow.appendChild(folderMenuBtn);
    container.appendChild(folderRow);

    /* Always render db-list but toggle collapsed class */
    const dbList = document.createElement('div');
    dbList.className = `db-list${isExpanded ? '' : ' collapsed'}`;

    filtered.forEach(db => {
      const row = document.createElement('div');
      row.className = 'sidebar-item-row';

      const btn = document.createElement('button');
      btn.className = `db-item ${STATE.selectedDatabaseId === db.id ? 'active' : ''} ${isDatabaseFavorite(db.id) ? 'is-favorite' : ''}`;
      btn.innerHTML = `${escapeHtml(db.name)} <span class="count">${db.record_count}</span>`;
      btn.addEventListener('click', () => selectDatabase(db.id));

      const dbMenuBtn = document.createElement('button');
      dbMenuBtn.type = 'button';
      dbMenuBtn.className = 'sidebar-item-menu-btn';
      dbMenuBtn.innerHTML = '<span class="header-cell-menu-dots">⋯</span>';
      dbMenuBtn.setAttribute('aria-label', tr('Opciones de base de datos', 'Database options'));
      dbMenuBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openSidebarItemMenu('database', db, dbMenuBtn);
      });

      row.appendChild(btn);
      row.appendChild(dbMenuBtn);
      dbList.appendChild(row);
    });

    container.appendChild(dbList);
    tree.appendChild(container);
  });

  /* ── Root databases (no folder) ── */
  const rootDbs = STATE.databases
    .filter(db => !db.folder_id)
    .filter(db => !searchTerm || db.name.toLowerCase().includes(searchTerm))
    .slice(0, 200);

  if (rootDbs.length) {
    const dbList = document.createElement('div');
    dbList.className = 'db-list';
    dbList.style.paddingLeft = '0';
    rootDbs.forEach(db => {
      const row = document.createElement('div');
      row.className = 'sidebar-item-row';

      const btn = document.createElement('button');
      btn.className = `db-item ${STATE.selectedDatabaseId === db.id ? 'active' : ''} ${isDatabaseFavorite(db.id) ? 'is-favorite' : ''}`;
      btn.innerHTML = `${escapeHtml(db.name)} <span class="count">${db.record_count}</span>`;
      btn.addEventListener('click', () => selectDatabase(db.id));

      const dbMenuBtn = document.createElement('button');
      dbMenuBtn.type = 'button';
      dbMenuBtn.className = 'sidebar-item-menu-btn';
      dbMenuBtn.innerHTML = '<span class="header-cell-menu-dots">⋯</span>';
      dbMenuBtn.setAttribute('aria-label', tr('Opciones de base de datos', 'Database options'));
      dbMenuBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openSidebarItemMenu('database', db, dbMenuBtn);
      });

      row.appendChild(btn);
      row.appendChild(dbMenuBtn);
      dbList.appendChild(row);
    });
    tree.appendChild(dbList);
  }

  const favoriteFolders = STATE.folders
    .filter(folder => isFolderFavorite(folder.id))
    .filter(folder => !searchTerm || folder.name.toLowerCase().includes(searchTerm));
  const favoriteDatabases = STATE.databases
    .filter(database => isDatabaseFavorite(database.id))
    .filter(database => !searchTerm || database.name.toLowerCase().includes(searchTerm));

  if (favoriteFolders.length || favoriteDatabases.length) {
    const section = document.createElement('div');
    section.className = 'sidebar-favorites';

    const title = document.createElement('div');
    title.className = 'sidebar-favorites-title';
    title.textContent = tr('Favoritos', 'Favorites');
    section.appendChild(title);

    favoriteFolders.forEach(folder => {
      const childDatabases = STATE.databases.filter(db => db.folder_id === folder.id);
      const row = document.createElement('div');
      row.className = 'sidebar-item-row';

      const btn = document.createElement('button');
      btn.className = 'folder is-favorite';
      btn.innerHTML = `<div class="folder-row"><span class="folder-title">${icon('folder')} ${escapeHtml(folder.name)}</span><span class="count">${childDatabases.length}</span></div>`;
      btn.addEventListener('click', () => {
        if (STATE.expandedFolderIds.has(folder.id)) STATE.expandedFolderIds.delete(folder.id);
        else STATE.expandedFolderIds.add(folder.id);
        renderSidebar();
      });

      const menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'sidebar-item-menu-btn';
      menuBtn.innerHTML = '<span class="header-cell-menu-dots">⋯</span>';
      menuBtn.setAttribute('aria-label', tr('Opciones de carpeta', 'Folder options'));
      menuBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openSidebarItemMenu('folder', folder, menuBtn);
      });

      row.appendChild(btn);
      row.appendChild(menuBtn);
      section.appendChild(row);
    });

    favoriteDatabases.forEach(database => {
      const row = document.createElement('div');
      row.className = 'sidebar-item-row';

      const btn = document.createElement('button');
      btn.className = `db-item is-favorite ${STATE.selectedDatabaseId === database.id ? 'active' : ''}`;
      btn.innerHTML = `${escapeHtml(database.name)} <span class="count">${database.record_count}</span>`;
      btn.addEventListener('click', () => selectDatabase(database.id));

      const menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'sidebar-item-menu-btn';
      menuBtn.innerHTML = '<span class="header-cell-menu-dots">⋯</span>';
      menuBtn.setAttribute('aria-label', tr('Opciones de base de datos', 'Database options'));
      menuBtn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openSidebarItemMenu('database', database, menuBtn);
      });

      row.appendChild(btn);
      row.appendChild(menuBtn);
      section.appendChild(row);
    });

    tree.appendChild(section);
  }
}

function openSidebarItemMenu(kind, item, anchorEl) {
  closeAllFloatingMenus('sidebar-item');

  const menu = document.createElement('div');
  menu.className = 'property-menu';

  const id = Number(item?.id || 0);
  const isFavorite = kind === 'folder' ? isFolderFavorite(id) : isDatabaseFavorite(id);
  const actions = [
    { key: 'favorite', label: isFavorite ? tr('Quitar de favoritos', 'Remove favorite') : tr('Marcar favorito', 'Mark favorite'), iconName: 'star' },
    { key: 'move', label: tr('Mover', 'Move'), iconName: 'swap' },
    { key: 'rename', label: tr('Renombrar', 'Rename'), iconName: 'edit' },
    { key: 'delete', label: tr('Eliminar', 'Delete'), iconName: 'trash', danger: true },
  ];

  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `property-menu-item${action.danger ? ' is-danger' : ''}`;
    btn.innerHTML = `${icon(action.iconName)}<span>${escapeHtml(action.label)}</span>`;
    btn.addEventListener('click', async event => {
      event.preventDefault();
      event.stopPropagation();
      closeSidebarItemMenu();

      if (action.key === 'favorite') {
        toggleSidebarFavorite(kind, item.id);
        return;
      }

      if (kind === 'database') {
        if (action.key === 'rename') await openRenameDatabaseModal(item);
        if (action.key === 'move') await openMoveDatabaseModal(item);
        if (action.key === 'delete') await confirmDeleteDatabase(item);
      }

      if (kind === 'folder') {
        if (action.key === 'rename') await openRenameFolderModal(item);
        if (action.key === 'move') await openMoveFolderModal(item);
        if (action.key === 'delete') await confirmDeleteFolder(item);
      }
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);
  positionFloatingMenu(menu, anchorEl, { align: 'right', prefer: 'bottom' });
  SIDEBAR_ITEM_MENU_STATE.menu = menu;
}

async function openRenameDatabaseModal(database) {
  if (!database) return;

  openModal({
    title: tr('Renombrar base de datos', 'Rename database'),
    submitText: tr('Guardar', 'Save'),
    width: '460px',
    content: `<label>${escapeHtml(tr('Nombre', 'Name'))}<input id="renameSidebarDbName" value="${escapeHtml(database.name)}" /></label>`,
    onSubmit: async () => {
      const name = document.getElementById('renameSidebarDbName').value.trim();
      if (!name) return true;
      await api(`/api/databases/${database.id}/settings`, {
        method: 'PUT',
        body: { name },
      });
      if (STATE.selectedDatabaseId === database.id) {
        STATE.selectedDatabase = await api(`/api/databases/${database.id}`);
        renderDatabaseHeader();
      }
      await refreshBootstrap();
      renderSidebar();
      return false;
    },
  });
}

async function openMoveDatabaseModal(database) {
  if (!database) return;
  const folderOptions = [`<option value="">${escapeHtml(tr('(Sin carpeta)', '(No folder)'))}</option>`]
    .concat(STATE.folders.map(folder => `<option value="${folder.id}" ${folder.id === database.folder_id ? 'selected' : ''}>${escapeHtml(folder.name)}</option>`))
    .join('');

  openModal({
    title: tr('Mover base de datos', 'Move database'),
    submitText: tr('Mover', 'Move'),
    width: '460px',
    content: `<label>${escapeHtml(tr('Carpeta destino', 'Target folder'))}<select id="moveSidebarDbFolder">${folderOptions}</select></label>`,
    onSubmit: async () => {
      const folderId = Number(document.getElementById('moveSidebarDbFolder').value || 0) || null;
      await api(`/api/databases/${database.id}/settings`, {
        method: 'PUT',
        body: { folderId },
      });
      await refreshBootstrap();
      renderSidebar();
      return false;
    },
  });
}

async function confirmDeleteDatabase(database) {
  if (!database) return;
  openConfirmMini({
    message: tr(
      `¿Eliminar la base de datos "${database.name}"? Esta acción no se puede deshacer.`,
      `Delete database "${database.name}"? This action cannot be undone.`,
    ),
    confirmText: tr('Eliminar', 'Delete'),
    danger: true,
    onConfirm: async () => {
      await api(`/api/databases/${database.id}`, { method: 'DELETE' });
      if (STATE.selectedDatabaseId === database.id) {
        STATE.selectedDatabaseId = null;
        STATE.selectedDatabase = null;
        document.getElementById('databaseState').classList.add('hidden');
        document.getElementById('homeState').classList.remove('hidden');
      }
      await refreshBootstrap();
      renderSidebar();
    },
  });
}

async function openRenameFolderModal(folder) {
  if (!folder) return;

  openModal({
    title: tr('Renombrar carpeta', 'Rename folder'),
    submitText: tr('Guardar', 'Save'),
    width: '460px',
    content: `<label>${escapeHtml(tr('Nombre', 'Name'))}<input id="renameSidebarFolderName" value="${escapeHtml(folder.name)}" /></label>`,
    onSubmit: async () => {
      const name = document.getElementById('renameSidebarFolderName').value.trim();
      if (!name) return true;
      await api(`/api/folders/${folder.id}`, {
        method: 'PUT',
        body: { name },
      });
      await refreshBootstrap();
      renderSidebar();
      return false;
    },
  });
}

async function openMoveFolderModal(folder) {
  if (!folder) return;
  const folderOptions = [`<option value="">${escapeHtml(tr('(Sin carpeta padre)', '(No parent folder)'))}</option>`]
    .concat(
      STATE.folders
        .filter(item => item.id !== folder.id)
        .map(item => `<option value="${item.id}" ${item.id === folder.parent_id ? 'selected' : ''}>${escapeHtml(item.name)}</option>`),
    )
    .join('');

  openModal({
    title: tr('Mover carpeta', 'Move folder'),
    submitText: tr('Mover', 'Move'),
    width: '460px',
    content: `<label>${escapeHtml(tr('Carpeta padre', 'Parent folder'))}<select id="moveSidebarFolderParent">${folderOptions}</select></label>`,
    onSubmit: async () => {
      const parentId = Number(document.getElementById('moveSidebarFolderParent').value || 0) || null;
      await api(`/api/folders/${folder.id}`, {
        method: 'PUT',
        body: { parentId },
      });
      await refreshBootstrap();
      renderSidebar();
      return false;
    },
  });
}

async function confirmDeleteFolder(folder) {
  if (!folder) return;

  openConfirmMini({
    message: tr(
      `¿Eliminar la carpeta "${folder.name}"? Las bases dentro de esta carpeta se conservarán sin carpeta.`,
      `Delete folder "${folder.name}"? Databases inside this folder will be kept without folder.`,
    ),
    confirmText: tr('Eliminar', 'Delete'),
    danger: true,
    onConfirm: async () => {
      await api(`/api/folders/${folder.id}`, { method: 'DELETE' });
      STATE.expandedFolderIds.delete(folder.id);
      STATE.favoriteFolderIds.delete(folder.id);
      saveSidebarFavorites();
      await refreshBootstrap();
      renderSidebar();
    },
  });
}

async function refreshBootstrap() {
  const bootstrap = await api('/api/bootstrap');
  STATE.folders = bootstrap.folders;
  STATE.databases = bootstrap.databases;
  STATE.appSettings = bootstrap.settings || null;
  STATE.language = bootstrap.settings?.ui?.language === 'es' ? 'es' : 'en';
  syncSidebarFavoritesWithData();
  applyLanguage();
}

async function selectDatabase(databaseId) {
  STATE.selectedDatabaseId = databaseId;
  STATE.page = 1;
  STATE.search = '';
  document.getElementById('recordSearch').value = '';

  STATE.selectedDatabase = await api(`/api/databases/${databaseId}`);
  STATE.totalDatabaseRecords = Number(STATE.selectedDatabase.totalRecords || 0);
  STATE.totalRecords = STATE.totalDatabaseRecords;
  STATE.selectedFolderId = STATE.selectedDatabase.folder_id || null;
  if (STATE.selectedFolderId) STATE.expandedFolderIds.add(STATE.selectedFolderId);
  STATE.activeViewId = STATE.selectedDatabase.views[0]?.id || null;
  applyCriteriaFromActiveView();

  showDatabaseShell();
  renderSidebar();
  renderDatabaseHeader();
  renderFilters();
  renderViewTabs();
  await loadRecords();
}

function showDatabaseShell() {
  document.getElementById('homeState').classList.add('hidden');
  document.getElementById('databaseState').classList.remove('hidden');
}

function toPercent(part, total) {
  const base = Number(total || 0);
  if (base <= 0) return 0;
  return Math.round((Number(part || 0) / base) * 100);
}

function renderDatabaseHeader() {
  const db = STATE.selectedDatabase;
  const cover = document.getElementById('dbHeaderCover');
  const title = document.getElementById('dbTitle');
  const subtitle = document.getElementById('dbSubtitle');

  if (db.header_image) {
    cover.style.background = `center / cover no-repeat url('/uploads/${db.header_image}')`;
  } else {
    cover.style.background = db.header_gradient;
  }

  title.textContent = db.name;
  const totalAll = Number(STATE.totalDatabaseRecords || 0);
  const totalFiltered = Number(STATE.totalRecords || 0);
  subtitle.textContent = `BD: ${totalAll.toLocaleString()} (${toPercent(totalAll, totalAll)}%) · Seleccionados: ${totalFiltered.toLocaleString()} (${toPercent(totalFiltered, totalAll)}%)`;
}

function renderViewTabs() {
  const tabs = document.getElementById('viewTabs');
  tabs.innerHTML = '';

  STATE.selectedDatabase.views.forEach(view => {
    const tabItem = document.createElement('div');
    tabItem.dataset.viewId = String(view.id);
    tabItem.className = `db-view-tab-item ${STATE.activeViewId === view.id ? 'active' : ''}`;
    tabItem.draggable = true;

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = 'db-view-tab-main';
    tabBtn.innerHTML = `${iconForView(view.type)} <span>${escapeHtml(view.name)}</span>`;

    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'header-cell-menu-btn db-view-tab-menu-btn';
    menuBtn.setAttribute('aria-label', escapeHtml(tr('Abrir menú de vista', 'Open view menu')));
    menuBtn.setAttribute('title', escapeHtml(tr('Menú', 'Menu')));
    menuBtn.innerHTML = '<span class="header-cell-menu-dots" aria-hidden="true">⋮</span>';

    tabBtn.addEventListener('click', async event => {
      event.stopPropagation();
      STATE.activeViewId = view.id;
      applyCriteriaFromActiveView();
      renderViewTabs();
      renderFilters();
      await loadRecords();
    });

    menuBtn.addEventListener('click', event => {
      event.stopPropagation();

      const clickedViewId = Number(view.id || 0);
      const activeViewId = Number(VIEW_MENU_STATE.viewId || 0);
      const hasOpenMenu = Boolean(VIEW_MENU_STATE.menu);

      if (hasOpenMenu && activeViewId === clickedViewId) {
        closeViewHeaderMenu();
        return;
      }

      if (hasOpenMenu && activeViewId !== clickedViewId) {
        closeViewHeaderMenu();
      }

      openViewHeaderMenu(view, menuBtn);
    });

    tabItem.addEventListener('dragstart', event => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(view.id));
      tabItem.classList.add('is-dragging');
    });

    tabItem.addEventListener('dragend', () => {
      tabItem.classList.remove('is-dragging');
      [...tabs.querySelectorAll('.db-view-tab-item')].forEach(item => item.classList.remove('drag-over'));
    });

    tabItem.addEventListener('dragover', event => {
      event.preventDefault();
      tabItem.classList.add('drag-over');
    });

    tabItem.addEventListener('dragleave', () => {
      tabItem.classList.remove('drag-over');
    });

    tabItem.addEventListener('drop', async event => {
      event.preventDefault();
      tabItem.classList.remove('drag-over');
      const fromId = Number(event.dataTransfer.getData('text/plain') || 0);
      const toId = Number(view.id || 0);
      if (!fromId || !toId || fromId === toId) return;
      await reorderViews(fromId, toId);
    });

    tabItem.appendChild(tabBtn);
    tabItem.appendChild(menuBtn);
    tabs.appendChild(tabItem);
  });
}

async function reorderViews(fromViewId, toViewId) {
  const current = [...(STATE.selectedDatabase?.views || [])];
  const fromIndex = current.findIndex(item => item.id === fromViewId);
  const toIndex = current.findIndex(item => item.id === toViewId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

  const [moved] = current.splice(fromIndex, 1);
  current.splice(toIndex, 0, moved);

  STATE.selectedDatabase.views = current;
  renderViewTabs();

  try {
    await api(`/api/databases/${STATE.selectedDatabaseId}/views/order`, {
      method: 'PUT',
      body: { viewIds: current.map(item => item.id) },
    });
  } catch (_error) {
    await refreshViews(STATE.activeViewId);
  }
}

function isPrimaryView(viewId) {
  return Number(STATE.selectedDatabase?.views?.[0]?.id || 0) === Number(viewId || 0);
}

function closeViewHeaderMenu() {
  if (!VIEW_MENU_STATE.menu) return;
  VIEW_MENU_STATE.menu.remove();
  VIEW_MENU_STATE.menu = null;
  VIEW_MENU_STATE.viewId = null;
}

function openViewHeaderMenu(view, anchorEl) {
  closeAllFloatingMenus('view');

  const menu = document.createElement('div');
  menu.className = 'property-menu';

  const items = [
    { key: 'rename', label: tr('Renombrar', 'Rename'), iconName: 'edit' },
    { key: 'edit', label: tr('Editar vista', 'Edit view'), iconName: 'swap' },
    { key: 'duplicate', label: tr('Duplicar vista', 'Duplicate view'), iconName: 'copy' },
    { key: 'delete', label: tr('Eliminar vista', 'Delete view'), iconName: 'trash', danger: true },
  ];

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `property-menu-item${item.danger ? ' is-danger' : ''}`;
    btn.innerHTML = `${icon(item.iconName)}<span>${escapeHtml(item.label)}</span>`;
    btn.addEventListener('click', async event => {
      event.stopPropagation();
      closeViewHeaderMenu();
      if (item.key === 'rename') await openRenameViewModal(view);
      if (item.key === 'edit') await openEditViewModal(view);
      if (item.key === 'duplicate') await duplicateView(view);
      if (item.key === 'delete') await deleteView(view);
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);
  positionFloatingMenu(menu, anchorEl, { align: 'right', prefer: 'bottom' });
  VIEW_MENU_STATE.menu = menu;
  VIEW_MENU_STATE.viewId = Number(view.id || 0);
}

function random4Digits() {
  return Array.from({ length: 4 }, () => String(Math.floor(Math.random() * 10))).join('');
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

async function refreshViews(activeViewId = STATE.activeViewId) {
  STATE.selectedDatabase = await api(`/api/databases/${STATE.selectedDatabaseId}`);
  const ids = new Set(STATE.selectedDatabase.views.map(item => item.id));
  if (ids.has(activeViewId)) {
    STATE.activeViewId = activeViewId;
  } else {
    STATE.activeViewId = STATE.selectedDatabase.views[0]?.id || null;
  }
  applyCriteriaFromActiveView();
  renderViewTabs();
  renderFilters();
  await loadRecords();
}

async function openRenameViewModal(view) {
  if (!view) return;

  openModal({
    title: tr('Renombrar vista', 'Rename view'),
    submitText: tr('Guardar', 'Save'),
    content: `<label>${escapeHtml(tr('Nombre', 'Name'))}<input id="renameViewName" value="${escapeHtml(view.name)}" /></label>`,
    onSubmit: async () => {
      const name = document.getElementById('renameViewName').value.trim();
      if (!name) return true;
      await api(`/api/views/${view.id}`, { method: 'PUT', body: { name } });
      await refreshViews(view.id);
      return false;
    },
  });
}

async function openEditViewModal(view) {
  if (!view) return;

  openModal({
    title: tr('Editar vista', 'Edit view'),
    submitText: tr('Guardar cambios', 'Save changes'),
    content: `
      <div class="columns-2">
        <label>${escapeHtml(tr('Nombre', 'Name'))}<input id="editViewName" value="${escapeHtml(view.name)}" /></label>
        <label>${escapeHtml(tr('Tipo', 'Type'))}
          <select id="editViewType">
            <option value="table" ${view.type === 'table' ? 'selected' : ''}>${escapeHtml(tr('Tabla', 'Table'))}</option>
            <option value="gallery" ${view.type === 'gallery' ? 'selected' : ''}>${escapeHtml(tr('Galería', 'Gallery'))}</option>
            <option value="analysis" ${view.type === 'analysis' ? 'selected' : ''}>${escapeHtml(tr('Análisis', 'Analysis'))}</option>
          </select>
        </label>
      </div>
    `,
    onSubmit: async () => {
      const name = document.getElementById('editViewName').value.trim();
      const type = document.getElementById('editViewType').value;
      if (!name) return true;
      const config = type === view.type ? cloneJson(view.config || {}) : {};
      await api(`/api/views/${view.id}`, { method: 'PUT', body: { name, type, config } });
      await refreshViews(view.id);
      return false;
    },
  });
}

async function duplicateView(view) {
  if (!view) return;
  const result = await api(`/api/databases/${STATE.selectedDatabaseId}/views`, {
    method: 'POST',
    body: {
      name: `${view.name} (copia)`,
      type: view.type,
      config: cloneJson(view.config || {}),
    },
  });
  await refreshViews(result.id);
}

function openPrimaryDeleteSecondStep(view) {
  const code = random4Digits();

  openModal({
    title: tr('Confirmación final', 'Final confirmation'),
    submitText: tr('Eliminar todas las vistas', 'Delete all views'),
    content: `
      <p>${escapeHtml(tr('Introduce estos 4 números para confirmar la eliminación completa de vistas:', 'Type these 4 digits to confirm deleting all views:'))}</p>
      <p><strong>${escapeHtml(code)}</strong></p>
      <label>${escapeHtml(tr('Números de confirmación', 'Confirmation digits'))}<input id="deletePrimaryViewCode" maxlength="4" /></label>
    `,
    onSubmit: async () => {
      const typed = String(document.getElementById('deletePrimaryViewCode').value || '').trim();
      if (typed !== code) {
        openConfirmMini({
          message: tr('Los números no coinciden. Inténtalo de nuevo.', 'Digits do not match. Try again.'),
          confirmText: 'OK',
        });
        return true;
      }

      const viewIds = STATE.selectedDatabase.views.map(item => item.id);
      for (const viewId of viewIds) {
        await api(`/api/views/${viewId}`, { method: 'DELETE' });
      }

      await refreshViews(null);
      return false;
    },
  });
}

async function deleteView(view) {
  if (!view) return;

  if (isPrimaryView(view.id)) {
    openModal({
      title: tr('Eliminar vista principal', 'Delete primary view'),
      submitText: tr('Sí, continuar', 'Yes, continue'),
      content: `<p>${escapeHtml(tr('Si eliminas la vista principal se perderán también todas las demás vistas. ¿Seguro que quieres continuar?', 'If you delete the primary view, all other views will also be removed. Are you sure you want to continue?'))}</p>`,
      onSubmit: async () => {
        openPrimaryDeleteSecondStep(view);
        return false;
      },
    });
    return;
  }

  openConfirmMini({
    message: STATE.language === 'en' ? `Delete view "${view.name}"?` : `¿Eliminar la vista "${view.name}"?`,
    confirmText: tr('Eliminar', 'Delete'),
    danger: true,
    onConfirm: async () => {
      await api(`/api/views/${view.id}`, { method: 'DELETE' });
      await refreshViews(STATE.activeViewId === view.id ? null : STATE.activeViewId);
    },
  });
}

function iconForView(type) {
  if (type === 'table') return icon('table');
  if (type === 'gallery') return icon('gallery');
  if (type === 'analysis') return icon('analysis');
  return '';
}

async function loadRecords() {
  if (!STATE.selectedDatabaseId) return;
  const params = new URLSearchParams({
    page: String(STATE.page),
    pageSize: String(STATE.pageSize),
    search: STATE.search,
    filters: JSON.stringify(STATE.filters),
    sorts: JSON.stringify(STATE.sorts || []),
  });

  if (STATE.sorts?.length) {
    params.set('sortPropertyId', String(STATE.sorts[0].propertyId));
    params.set('sortDir', STATE.sorts[0].dir);
  }

  const response = await api(`/api/databases/${STATE.selectedDatabaseId}/records?${params.toString()}`);
  STATE.records = response.data;
  STATE.totalRecords = response.total;
  STATE.totalDatabaseRecords = response.totalAll ?? response.total;
  STATE.selectedDatabase.properties = response.properties;
  STATE.selectedRecordIds = STATE.selectedRecordIds.filter(id => STATE.records.some(record => record.id === id));

  renderDatabaseHeader();
  renderActiveView();
}

function renderActiveView() {
  const view = STATE.selectedDatabase.views.find(v => v.id === STATE.activeViewId);
  const host = document.getElementById('viewHost');
  destroyAllChartInstances();
  host.innerHTML = '';

  if (!view) return;

  if (view.type === 'table') {
    renderTableView(host);
    return;
  }

  if (view.type === 'gallery') {
    renderGalleryView(host);
    return;
  }

  renderAnalysisView(host, view);
}

function destroyChartInstance(viewId) {
  if (!STATE.chartInstances[viewId]) return;
  STATE.chartInstances[viewId].destroy();
  STATE.chartInstances[viewId] = null;
}

function destroyAllChartInstances() {
  Object.keys(STATE.chartInstances).forEach(key => {
    destroyChartInstance(key);
  });
}

function visibleProperties() {
  return STATE.selectedDatabase.properties.filter(prop => prop.is_visible);
}

function renderTableView(host) {
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  const selectedIds = new Set(STATE.selectedRecordIds);
  const shownProps = orderedVisibleProperties();
  let draggingHeaderPropertyId = null;

  const selectHeader = document.createElement('th');
  selectHeader.className = 'select-col';
  const selectAll = document.createElement('input');
  selectAll.type = 'checkbox';
  const selectedCount = STATE.records.filter(record => selectedIds.has(record.id)).length;
  selectAll.checked = STATE.records.length > 0 && selectedCount === STATE.records.length;
  selectAll.indeterminate = selectedCount > 0 && selectedCount < STATE.records.length;
  selectAll.addEventListener('change', () => {
    if (selectAll.checked) {
      STATE.selectedRecordIds = STATE.records.map(record => record.id);
    } else {
      STATE.selectedRecordIds = [];
    }
    renderActiveView();
  });
  selectHeader.appendChild(selectAll);
  trh.appendChild(selectHeader);

  trh.appendChild(cellHeader('#', null));
  shownProps.forEach(prop => {
    const header = cellHeader(prop.name, prop);
    header.draggable = true;
    header.classList.add('column-header-draggable');

    header.addEventListener('dragstart', event => {
      const target = event.target;
      if (target instanceof Element && target.closest('.header-cell-menu-btn')) {
        event.preventDefault();
        return;
      }

      draggingHeaderPropertyId = Number(prop.id);
      header.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(prop.id));
      }
    });

    header.addEventListener('dragend', () => {
      draggingHeaderPropertyId = null;
      [...trh.querySelectorAll('.column-header-draggable')].forEach(item => {
        item.classList.remove('drag-over', 'is-dragging');
      });
    });

    header.addEventListener('dragover', event => {
      if (!draggingHeaderPropertyId || draggingHeaderPropertyId === Number(prop.id)) return;
      event.preventDefault();
      header.classList.add('drag-over');
    });

    header.addEventListener('dragleave', () => {
      header.classList.remove('drag-over');
    });

    header.addEventListener('drop', async event => {
      event.preventDefault();
      header.classList.remove('drag-over');
      if (!draggingHeaderPropertyId || draggingHeaderPropertyId === Number(prop.id)) return;
      await reorderActiveViewColumns(draggingHeaderPropertyId, prop.id);
    });

    trh.appendChild(header);
  });
  trh.appendChild(cellHeader('⋯', null));
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  STATE.records.forEach((record, idx) => {
    const tr = document.createElement('tr');
    if (selectedIds.has(record.id)) tr.classList.add('table-row-selected');
    const selectTd = document.createElement('td');
    selectTd.className = 'select-col';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedIds.has(record.id);
    checkbox.addEventListener('change', () => {
      const set = new Set(STATE.selectedRecordIds);
      if (checkbox.checked) set.add(record.id);
      else set.delete(record.id);
      STATE.selectedRecordIds = [...set];
      renderActiveView();
    });
    selectTd.appendChild(checkbox);
    tr.appendChild(selectTd);

    const order = document.createElement('td');
    order.textContent = String((STATE.page - 1) * STATE.pageSize + idx + 1);
    tr.appendChild(order);

    shownProps.forEach(prop => {
      const td = document.createElement('td');
      td.className = 'inline-cell';
      td.setAttribute('data-property-id', String(prop.id));
      td.appendChild(renderInlineCellInput({
        prop,
        value: record.values[prop.key],
        recordId: record.id,
        isDraft: false,
        onCommit: async (nextValue) => {
          await saveInlineValue(record.id, prop, nextValue);
        },
      }));
      tr.appendChild(td);
    });

    const actions = document.createElement('td');
    actions.innerHTML = `<button class="btn btn-danger btn-icon table-trash-btn" title="Eliminar" aria-label="Eliminar">${icon('trash')}</button>`;
    const [btnDelete] = actions.querySelectorAll('button');
    btnDelete.addEventListener('click', async () => {
      openDeleteRecordsModal([record.id]);
    });
    tr.appendChild(actions);

    tr.addEventListener('click', event => {
      if (shouldIgnoreRowBackgroundClick(event.target)) return;
      if (window.getSelection && window.getSelection().toString()) return;
      openRecordModal(record);
    });

    tbody.appendChild(tr);
  });

  const draftRow = document.createElement('tr');
  draftRow.className = 'table-row-draft';
  const draftSelect = document.createElement('td');
  draftSelect.className = 'select-col';
  draftRow.appendChild(draftSelect);
  const marker = document.createElement('td');
  marker.textContent = '+';
  draftRow.appendChild(marker);

  shownProps.forEach(prop => {
    const td = document.createElement('td');
    td.className = 'inline-cell';
    td.setAttribute('data-property-id', String(prop.id));
    td.appendChild(renderInlineCellInput({
      prop,
      value: null,
      recordId: null,
      isDraft: true,
      onCommit: async (nextValue) => {
        const payload = {};
        payload[prop.key] = nextValue;
        await api(`/api/databases/${STATE.selectedDatabaseId}/records`, { method: 'POST', body: { values: payload } });
        await loadRecords();
        await refreshBootstrap();
      },
    }));
    draftRow.appendChild(td);
  });

  const draftActions = document.createElement('td');
  draftActions.innerHTML = `<span class="count">${escapeHtml(t('addRow'))}</span>`;
  draftRow.appendChild(draftActions);
  tbody.appendChild(draftRow);

  table.appendChild(tbody);
  wrap.appendChild(table);

  const pagination = document.createElement('div');
  pagination.style.display = 'flex';
  pagination.style.gap = '8px';
  pagination.style.alignItems = 'center';
  pagination.style.marginTop = '8px';
  const totalPages = Math.max(1, Math.ceil(STATE.totalRecords / STATE.pageSize));

  const prev = document.createElement('button');
  prev.className = 'btn';
  prev.textContent = t('previous');
  prev.disabled = STATE.page <= 1;
  prev.addEventListener('click', async () => { STATE.page -= 1; await loadRecords(); });

  const next = document.createElement('button');
  next.className = 'btn';
  next.textContent = t('next');
  next.disabled = STATE.page >= totalPages;
  next.addEventListener('click', async () => { STATE.page += 1; await loadRecords(); });

  const info = document.createElement('span');
  info.className = 'count';
  info.style.margin = '8px 0 0 4px';
  info.textContent = t('pageOf', {
    page: STATE.page,
    totalPages,
    total: STATE.totalRecords.toLocaleString(),
  });

  const deleteSelected = document.createElement('button');
  deleteSelected.className = 'btn btn-danger btn-icon table-trash-btn';
  deleteSelected.innerHTML = icon('trash');
  deleteSelected.title = tr('Eliminar seleccionados', 'Delete selected');
  deleteSelected.disabled = !STATE.selectedRecordIds.length;
  deleteSelected.addEventListener('click', () => {
    if (!STATE.selectedRecordIds.length) return;
    openDeleteRecordsModal(STATE.selectedRecordIds);
  });

  pagination.appendChild(prev);
  pagination.appendChild(next);
  pagination.appendChild(deleteSelected);
  pagination.appendChild(info);

  host.appendChild(wrap);
  host.appendChild(pagination);
}

function openDeleteRecordsModal(recordIds) {
  const ids = [...new Set((recordIds || []).map(Number).filter(Boolean))];
  if (!ids.length) return;

  openConfirmMini({
    message: STATE.language === 'en'
      ? `You are about to delete ${ids.length} record(s). This action cannot be undone.`
      : `Vas a eliminar ${ids.length} registro(s). Esta acción no se puede deshacer.`,
    confirmText: tr('Eliminar', 'Delete'),
    danger: true,
    onConfirm: async () => {
      for (const id of ids) {
        await api(`/api/records/${id}`, { method: 'DELETE' });
      }
      STATE.selectedRecordIds = [];
      await loadRecords();
      await refreshBootstrap();
    },
  });
}

function normalizeInlineValue(prop, rawValue) {
  if (prop.type === 'checkbox') return Boolean(rawValue);
  if (prop.type === 'multiSelect') {
    const values = Array.isArray(rawValue)
      ? rawValue
      : String(rawValue || '').split(',').map(item => item.trim()).filter(Boolean);
    return [...new Set(values)];
  }
  if (prop.type === 'singleSelect') {
    const first = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    const text = String(first || '').trim();
    return text || null;
  }
  if (prop.type === 'relation') {
    return Array.isArray(rawValue) ? rawValue.map(v => Number(v)).filter(Boolean) : [];
  }
  const text = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim();
  return text || null;
}

function hasMeaningfulValue(prop, value) {
  if (prop.type === 'checkbox') return Boolean(value);
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && String(value).trim() !== '';
}

async function ensureSelectOptionsFromInline(prop, normalizedValue) {
  if (!(prop.type === 'singleSelect' || prop.type === 'multiSelect')) return;

  const values = Array.isArray(normalizedValue) ? normalizedValue : (normalizedValue ? [normalizedValue] : []);
  if (!values.length) return;

  const options = Array.isArray(prop.config?.options) ? [...prop.config.options] : [];
  const missing = values.filter(item => !findSelectOption(options, item));
  if (!missing.length) return;

  missing.forEach((label, idx) => {
    options.push({
      label: String(label),
      color: getNextTagColor(options.length + idx),
    });
  });

  await api(`/api/properties/${prop.id}`, {
    method: 'PUT',
    body: {
      config: { ...(prop.config || {}), options },
    },
  });

  const current = STATE.selectedDatabase.properties.find(item => item.id === prop.id);
  if (current) {
    current.config = { ...(current.config || {}), options };
  }
}

async function saveInlineValue(recordId, prop, nextValue) {
  if (prop.type === 'autoId' || prop.type === 'rollup' || prop.type === 'attachment') return;
  const normalized = normalizeInlineValue(prop, nextValue);
  await ensureSelectOptionsFromInline(prop, normalized);
  await api(`/api/records/${recordId}`, {
    method: 'PUT',
    body: {
      values: {
        [prop.key]: normalized,
      },
    },
  });
  await loadRecords();
  await refreshBootstrap();
}

async function uploadAttachment(recordId, propertyId, file) {
  if (!recordId || !propertyId || !file) return;
  const form = new FormData();
  form.append('file', file);
  const response = await fetch(`/api/records/${recordId}/attachments/${propertyId}`, { method: 'POST', body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error || tr('No se pudo adjuntar el archivo', 'Could not attach the file');
    openConfirmMini({ message, confirmText: 'OK' });
    throw new Error(message);
  }
}

function renderInlineCellInput({ prop, value, recordId, isDraft, onCommit }) {
  if (prop.type === 'autoId' || prop.type === 'rollup' || prop.type === 'relation') {
    return renderCellValue(prop, value);
  }

  if (prop.type === 'attachment') {
    const wrap = document.createElement('div');
    wrap.className = 'attachment-dropzone';

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.className = 'hidden';

    const files = Array.isArray(value) ? value : [];
    const hasFiles = files.length > 0;
    const list = document.createElement('div');
    list.className = 'attachment-preview-list attachment-preview-list-compact';

    if (hasFiles) {
      const visibleFiles = files.slice(0, 4);
      visibleFiles.forEach(url => {
        const fileUrl = String(url);
        const fileName = attachmentFileName(fileUrl);

        const itemWrap = document.createElement('div');
        itemWrap.className = 'attachment-thumb-wrap';

        const previewBtn = document.createElement('button');
        previewBtn.type = 'button';
        previewBtn.className = 'attachment-preview-btn';
        previewBtn.title = fileName;
        previewBtn.setAttribute('aria-label', fileName);

        if (isImageAttachment(fileUrl)) {
          const img = document.createElement('img');
          img.src = fileUrl;
          img.alt = fileName;
          previewBtn.appendChild(img);
        } else {
          previewBtn.innerHTML = attachmentIconForUrl(fileUrl);
        }

        previewBtn.addEventListener('click', event => {
          event.stopPropagation();
          if (isImageAttachment(fileUrl)) {
            openImagePreviewModal(fileUrl, fileName);
          } else {
            confirmAttachmentDownload(fileUrl);
          }
        });

        itemWrap.appendChild(previewBtn);

        /* X button to delete */
        if (recordId) {
          const deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'attachment-delete-btn';
          deleteBtn.textContent = '×';
          deleteBtn.title = t('deleteAttachment');
          deleteBtn.setAttribute('aria-label', t('deleteAttachment'));
          deleteBtn.addEventListener('click', event => {
            event.stopPropagation();
            confirmDeleteAttachment(fileUrl);
          });
          itemWrap.appendChild(deleteBtn);
        }

        list.appendChild(itemWrap);
      });

      if (files.length > 4) {
        const extra = document.createElement('div');
        extra.className = 'attachment-extra-count';
        extra.textContent = `+${files.length - 4}`;
        list.appendChild(extra);
      }
    } else {
      const empty = document.createElement('span');
      empty.className = 'count attachment-empty-inline';
      empty.textContent = tr('Sin adjuntos', 'No attachments');
      list.appendChild(empty);
    }

    const spinner = document.createElement('span');
    spinner.className = 'attachment-upload-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    wrap.appendChild(spinner);

    wrap.appendChild(list);

    /* Only show upload trigger if no files attached */
    if (!hasFiles) {
      const uploadTrigger = document.createElement('button');
      uploadTrigger.type = 'button';
      uploadTrigger.className = 'attachment-upload-trigger';
      uploadTrigger.textContent = '+';
      uploadTrigger.title = tr('Adjuntar archivo', 'Attach file');
      uploadTrigger.setAttribute('aria-label', tr('Adjuntar archivo', 'Attach file'));

      uploadTrigger.addEventListener('click', event => {
        event.stopPropagation();
        input.click();
      });

      wrap.appendChild(uploadTrigger);
    }

    wrap.appendChild(input);

    async function ensureRecordForUpload() {
      if (recordId) return recordId;
      if (!isDraft) return null;
      const created = await api(`/api/databases/${STATE.selectedDatabaseId}/records`, { method: 'POST', body: { values: {} } });
      return created.id;
    }

    async function processFiles(fileList) {
      const list = [...(fileList || [])];
      if (!list.length) return;
      const targetRecordId = await ensureRecordForUpload();
      if (!targetRecordId) return;

      wrap.classList.add('is-uploading');
      try {
        for (const file of list) {
          await uploadAttachment(targetRecordId, prop.id, file);
        }
        await loadRecords();
        await refreshBootstrap();
      } finally {
        wrap.classList.remove('is-uploading');
      }
    }

    input.addEventListener('change', async () => {
      await processFiles(input.files);
      input.value = '';
    });

    wrap.addEventListener('dragover', event => {
      if (hasFiles) return;
      event.preventDefault();
      wrap.classList.add('is-dragover');
    });
    wrap.addEventListener('dragleave', () => {
      wrap.classList.remove('is-dragover');
    });
    wrap.addEventListener('drop', async event => {
      if (hasFiles) return;
      event.preventDefault();
      wrap.classList.remove('is-dragover');
      const dropped = event.dataTransfer?.files || [];
      /* Only take the first file */
      if (dropped.length) await processFiles([dropped[0]]);
    });

    return wrap;
  }

  if (prop.type === 'checkbox') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'inline-cell-input';
    input.checked = Boolean(value);
    input.addEventListener('change', async () => {
      const normalized = normalizeInlineValue(prop, input.checked);
      if (isDraft && !hasMeaningfulValue(prop, normalized)) return;
      await onCommit(normalized);
    });
    return input;
  }

  if (prop.type === 'url') {
    const wrap = document.createElement('div');
    wrap.className = 'inline-url-wrap';
    let currentValue = value || null;

    const link = document.createElement('a');
    link.className = 'inline-url-link';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'inline-cell-input hidden';
    input.placeholder = 'https://...';

    function normalizeUrl(raw) {
      const text = String(raw || '').trim();
      if (!text) return null;
      if (/^https?:\/\//i.test(text)) return text;
      return `https://${text}`;
    }

    function renderLink(currentValue) {
      const normalized = normalizeUrl(currentValue);
      if (!normalized) {
        link.classList.add('hidden');
        input.classList.remove('hidden');
        input.value = '';
        return;
      }

      link.classList.remove('hidden');
      link.href = normalized;
      link.textContent = normalized;
      input.classList.add('hidden');
    }

    async function commitInput() {
      const normalized = normalizeUrl(input.value);
      if (isDraft && !hasMeaningfulValue(prop, normalized)) return;
      await onCommit(normalized);
      currentValue = normalized;
      renderLink(normalized);
    }

    function enterEditMode() {
      input.classList.remove('hidden');
      link.classList.add('hidden');
      input.value = currentValue || '';
      input.focus();
      input.select();
    }

    renderLink(currentValue);
    wrap.appendChild(link);
    wrap.appendChild(input);

    wrap.addEventListener('dblclick', () => {
      enterEditMode();
    });

    input.addEventListener('blur', async () => {
      await commitInput();
    });

    input.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        await commitInput();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        renderLink(currentValue);
      }
    });

    return wrap;
  }

  const input = document.createElement('input');
  input.type = prop.type === 'date' ? 'date' : (prop.type === 'time' ? 'time' : (prop.type === 'url' ? 'url' : 'text'));
  input.className = 'inline-cell-input';

  if (prop.type === 'multiSelect' || prop.type === 'singleSelect') {
    const isMulti = prop.type === 'multiSelect';
    const initial = Array.isArray(value) ? value : (value ? [value] : []);
    let selected = [...initial];
    const box = document.createElement('button');
    box.type = 'button';
    box.className = 'inline-tag-editor inline-tag-trigger';

    const tagsWrap = document.createElement('div');
    tagsWrap.className = 'inline-tags inline-tags-compact';
    box.appendChild(tagsWrap);

    const commit = async () => {
      const normalized = normalizeInlineValue(prop, isMulti ? selected : (selected[0] || null));
      if (isDraft && !hasMeaningfulValue(prop, normalized)) return;
      await onCommit(normalized);
    };

    function renderTags() {
      tagsWrap.innerHTML = '';
      if (!selected.length) {
        const empty = document.createElement('span');
        empty.className = 'count';
        empty.textContent = tr('Seleccionar...', 'Select...');
        tagsWrap.appendChild(empty);
        return;
      }

      selected.forEach((item, index) => {
        const option = findSelectOption(prop.config?.options || [], item);
        const badge = document.createElement('span');
        badge.className = `badge tag-${option?.color || 'gray'}`;
        badge.textContent = String(item);
        badge.title = String(item);
        tagsWrap.appendChild(badge);
      });
    }

    renderTags();

    box.addEventListener('click', event => {
      event.stopPropagation();
      openSelectValueMenu({
        anchorEl: box,
        prop,
        selected,
        isMulti,
        onChange: async (nextSelected) => {
          selected = [...nextSelected];
          renderTags();
          await commit();
        },
      });
    });

    box.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        box.click();
      }
    });

    return box;
  }

  input.value = value === null || value === undefined ? '' : String(value);
  const commit = async () => {
    const normalized = normalizeInlineValue(prop, input.value);
    if (isDraft && !hasMeaningfulValue(prop, normalized)) return;
    await onCommit(normalized);
  };

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await commit();
    }
  });

  return input;
}

async function persistPropertyConfig(prop, config) {
  await api(`/api/properties/${prop.id}`, {
    method: 'PUT',
    body: { config },
  });

  prop.config = config;
  const current = STATE.selectedDatabase?.properties?.find(item => item.id === prop.id);
  if (current) current.config = config;
}

function openSelectOptionMenu({ anchorEl, option, onColor, onDelete }) {
  closeSelectOptionMenu();

  const menu = document.createElement('div');
  menu.className = 'property-menu select-option-menu';

  BASIC_TAG_COLOR_PALETTE.forEach(color => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'property-menu-item';
    btn.innerHTML = `<span class="badge tag-${color.name}">${escapeHtml(colorLabel(color))}</span>`;
    btn.addEventListener('click', async event => {
      event.stopPropagation();
      closeSelectOptionMenu();
      await onColor(color.name);
    });
    menu.appendChild(btn);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'property-menu-item is-danger';
  deleteBtn.innerHTML = `${icon('trash')}<span>${escapeHtml(tr('Eliminar etiqueta', 'Delete tag'))}</span>`;
  deleteBtn.addEventListener('click', event => {
    event.stopPropagation();
    closeSelectOptionMenu();
    openModal({
      title: `${tr('Eliminar etiqueta', 'Delete tag')}: ${option.label}`,
      submitText: tr('Eliminar', 'Delete'),
      content: `<p>${escapeHtml(STATE.language === 'en' ? `Are you sure you want to delete the tag` : '¿Seguro que quieres eliminar la etiqueta')} <strong>${escapeHtml(option.label)}</strong>?</p>`,
      onSubmit: async () => {
        await onDelete();
        return false;
      },
    });
  });
  menu.appendChild(deleteBtn);

  document.body.appendChild(menu);
  positionFloatingMenu(menu, anchorEl, { align: 'right', prefer: 'bottom' });
  SELECT_OPTION_MENU_STATE.menu = menu;
}

function openSelectValueMenu({ anchorEl, prop, selected, isMulti, onChange }) {
  const isSameTriggerOpen = Boolean(
    SELECT_VALUE_MENU_STATE.menu
    && SELECT_VALUE_MENU_STATE.anchorEl === anchorEl
    && Number(SELECT_VALUE_MENU_STATE.propertyId || 0) === Number(prop?.id || 0)
  );
  if (isSameTriggerOpen) {
    closeSelectValueMenu();
    return;
  }

  closeAllFloatingMenus('select');

  const menu = document.createElement('div');
  menu.className = 'select-value-menu';

  const inputWrap = document.createElement('div');
  inputWrap.className = 'select-value-input-wrap';
  const chips = document.createElement('div');
  chips.className = 'select-value-selected';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'select-value-filter';
  input.placeholder = tr('Escribe para filtrar o crear…', 'Type to filter or create…');
  inputWrap.appendChild(chips);
  inputWrap.appendChild(input);

  const list = document.createElement('div');
  list.className = 'select-value-options';

  menu.appendChild(inputWrap);
  menu.appendChild(list);
  document.body.appendChild(menu);

  positionFloatingMenu(menu, anchorEl, { align: 'left', prefer: 'bottom' });
  SELECT_VALUE_MENU_STATE.menu = menu;
  SELECT_VALUE_MENU_STATE.anchorEl = anchorEl;
  SELECT_VALUE_MENU_STATE.propertyId = Number(prop?.id || 0);

  let selectedValues = [...(selected || [])];
  let filter = '';
  let draggingLabel = null;

  function selectedSet() {
    return new Set(selectedValues.map(item => String(item).toLowerCase()));
  }

  function getOptionsRaw() {
    return Array.isArray(prop.config?.options) ? [...prop.config.options] : [];
  }

  async function syncOptionsFromServer() {
    if (!(prop.type === 'singleSelect' || prop.type === 'multiSelect')) return;

    try {
      const remote = await api(`/api/properties/${prop.id}/options`);
      if (!Array.isArray(remote)) return;

      const nextOptions = remote
        .map(item => ({
          label: String(item?.label || '').trim(),
          color: String(item?.color || 'gray').trim() || 'gray',
        }))
        .filter(item => item.label);

      const nextConfig = {
        ...(prop.config || {}),
        options: nextOptions,
      };

      prop.config = nextConfig;
      const current = STATE.selectedDatabase?.properties?.find(item => item.id === prop.id);
      if (current) current.config = nextConfig;

      renderSelected();
      renderList();
    } catch (_error) {
    }
  }

  function getOptionsForDisplay() {
    const sorted = sortSelectOptions(getOptionsRaw(), prop.config?.optionSort || 'manual');
    const needle = filter.toLowerCase();
    if (!needle) return sorted;
    return sorted.filter(item => String(item.label || '').toLowerCase().includes(needle));
  }

  async function saveOptions(nextOptions, nextSortMode = prop.config?.optionSort || 'manual') {
    const config = {
      ...(prop.config || {}),
      options: nextOptions,
      optionSort: normalizeOptionSortMode(nextSortMode),
    };
    await persistPropertyConfig(prop, config);
  }

  function renderSelected() {
    chips.innerHTML = '';
    if (!selectedValues.length) {
      const empty = document.createElement('span');
      empty.className = 'count';
      empty.textContent = isMulti ? tr('Sin etiquetas seleccionadas', 'No tags selected') : tr('Sin valor seleccionado', 'No value selected');
      chips.appendChild(empty);
      return;
    }

    selectedValues.forEach(label => {
      const option = findSelectOption(prop.config?.options || [], label);
      const badge = document.createElement('span');
      badge.className = `badge tag-${option?.color || 'gray'}`;
      badge.textContent = String(label);
      chips.appendChild(badge);
    });
  }

  async function setSelection(nextValues) {
    const unique = [];
    const used = new Set();
    nextValues.forEach(item => {
      const key = String(item || '').toLowerCase();
      if (!key || used.has(key)) return;
      used.add(key);
      unique.push(String(item));
    });

    selectedValues = isMulti ? unique : unique.slice(0, 1);
    await onChange(selectedValues);
    renderSelected();
    renderList();
  }

  async function ensureOption(rawLabel) {
    const label = String(rawLabel || '').trim();
    if (!label) return null;

    const options = getOptionsRaw();
    const existing = findSelectOption(options, label);
    if (existing) return existing.label;

    options.push({ label, color: getNextTagColor(options.length) });
    await saveOptions(options);
    return label;
  }

  async function handleSubmitInput() {
    const raw = input.value.trim();
    if (!raw) return;
    const canonical = await ensureOption(raw);
    if (!canonical) return;

    if (isMulti) {
      await setSelection([...selectedValues, canonical]);
    } else {
      await setSelection([canonical]);
      closeSelectValueMenu();
    }

    input.value = '';
    filter = '';
    renderList();
  }

  async function reorderOption(fromLabel, toLabel) {
    if (!fromLabel || !toLabel || fromLabel === toLabel) return;
    const options = getOptionsRaw();
    const fromIndex = options.findIndex(item => item.label === fromLabel);
    const toIndex = options.findIndex(item => item.label === toLabel);
    if (fromIndex < 0 || toIndex < 0) return;

    const [moved] = options.splice(fromIndex, 1);
    options.splice(toIndex, 0, moved);
    await saveOptions(options, 'manual');
    renderList();
  }

  function renderList() {
    list.innerHTML = '';
    const options = getOptionsForDisplay();
    const selectedLookup = selectedSet();

    if (!options.length) {
      const empty = document.createElement('div');
      empty.className = 'count';
      empty.textContent = tr('Sin coincidencias. Pulsa Enter para crear una nueva etiqueta.', 'No matches. Press Enter to create a new tag.');
      list.appendChild(empty);
      return;
    }

    options.forEach(option => {
      const row = document.createElement('div');
      row.className = `select-option-row${selectedLookup.has(String(option.label).toLowerCase()) ? ' is-selected' : ''}`;
      row.draggable = true;
      row.dataset.label = option.label;

      const dragBtn = document.createElement('button');
      dragBtn.type = 'button';
      dragBtn.className = 'select-option-drag';
      dragBtn.textContent = '⋮⋮';
      dragBtn.title = tr('Arrastrar para reordenar', 'Drag to reorder');

      const valueBtn = document.createElement('button');
      valueBtn.type = 'button';
      valueBtn.className = 'select-option-value';
      valueBtn.innerHTML = `<span class="badge tag-${option.color || 'gray'}">${escapeHtml(option.label)}</span>`;

      const actionsBtn = document.createElement('button');
      actionsBtn.type = 'button';
      actionsBtn.className = 'select-option-actions';
      actionsBtn.textContent = '⋯';
      actionsBtn.title = tr('Opciones de etiqueta', 'Tag options');

      valueBtn.addEventListener('click', async event => {
        event.stopPropagation();
        const key = String(option.label).toLowerCase();
        if (isMulti) {
          if (selectedLookup.has(key)) {
            await setSelection(selectedValues.filter(item => String(item).toLowerCase() !== key));
          } else {
            await setSelection([...selectedValues, option.label]);
          }
          return;
        }

        await setSelection([option.label]);
        closeSelectValueMenu();
      });

      actionsBtn.addEventListener('click', event => {
        event.stopPropagation();
        openSelectOptionMenu({
          anchorEl: actionsBtn,
          option,
          onColor: async (nextColor) => {
            const optionsRaw = getOptionsRaw().map(item => (
              item.label === option.label ? { ...item, color: nextColor } : item
            ));
            await saveOptions(optionsRaw);
            renderSelected();
            renderList();
          },
          onDelete: async () => {
            const optionsRaw = getOptionsRaw().filter(item => item.label !== option.label);
            await saveOptions(optionsRaw);
            await setSelection(selectedValues.filter(item => String(item).toLowerCase() !== String(option.label).toLowerCase()));
          },
        });
      });

      row.addEventListener('dragstart', event => {
        draggingLabel = option.label;
        event.dataTransfer.effectAllowed = 'move';
      });

      row.addEventListener('dragover', event => {
        event.preventDefault();
      });

      row.addEventListener('drop', async event => {
        event.preventDefault();
        await reorderOption(draggingLabel, option.label);
      });

      row.addEventListener('dragend', () => {
        draggingLabel = null;
      });

      row.appendChild(dragBtn);
      row.appendChild(valueBtn);
      row.appendChild(actionsBtn);
      list.appendChild(row);
    });
  }

  input.addEventListener('input', () => {
    filter = input.value.trim();
    renderList();
  });

  input.addEventListener('keydown', async event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      await handleSubmitInput();
      return;
    }

    if (event.key === 'Backspace' && !input.value.trim() && selectedValues.length) {
      event.preventDefault();
      await setSelection(selectedValues.slice(0, -1));
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeSelectValueMenu();
    }
  });

  renderSelected();
  renderList();
  syncOptionsFromServer();
  setTimeout(() => input.focus(), 0);
}

async function createEmptyRecord() {
  if (!STATE.selectedDatabaseId) return;
  await api(`/api/databases/${STATE.selectedDatabaseId}/records`, { method: 'POST', body: { values: {} } });
  await loadRecords();
  await refreshBootstrap();
}

function cellHeader(label, prop) {
  const th = document.createElement('th');
  th.textContent = label;

  if (prop) {
    th.classList.add('header-cell-prop');
    th.setAttribute('data-property-id', String(prop.id));
    th.innerHTML = `
      <span class="header-cell-content">
        <span class="header-cell-label">${escapeHtml(label)}</span>
        <button type="button" class="header-cell-menu-btn" aria-label="${escapeHtml(tr('Abrir menú de propiedad', 'Open property menu'))}" title="${escapeHtml(tr('Menú', 'Menu'))}">
          <span class="header-cell-menu-dots" aria-hidden="true">⋮</span>
        </button>
      </span>
    `;

    const menuBtn = th.querySelector('.header-cell-menu-btn');
    menuBtn?.addEventListener('click', (event) => {
      event.stopPropagation();

      const clickedPropertyId = Number(prop.id || 0);
      const activePropertyId = Number(PROPERTY_MENU_STATE.propertyId || 0);
      const hasOpenMenu = Boolean(PROPERTY_MENU_STATE.menu);

      if (hasOpenMenu && activePropertyId === clickedPropertyId) {
        closePropertyHeaderMenu();
        return;
      }

      if (hasOpenMenu && activePropertyId !== clickedPropertyId) {
        closePropertyHeaderMenu();
      }

      openPropertyHeaderMenu(prop, menuBtn || th);
    });
  }

  return th;
}

function closePropertyHeaderMenu() {
  if (!PROPERTY_MENU_STATE.menu) return;
  PROPERTY_MENU_STATE.menu.remove();
  PROPERTY_MENU_STATE.menu = null;
  PROPERTY_MENU_STATE.propertyId = null;
}

function openPropertyHeaderMenu(prop, anchorEl) {
  closeAllFloatingMenus('property');

  const menu = document.createElement('div');
  menu.className = 'property-menu';

  const isSystem = prop.type === 'autoId' || prop.key === 'id';
  const items = [
    { key: 'edit', label: tr('Editar propiedad', 'Edit property'), iconName: 'edit' },
    { key: 'changeType', label: tr('Cambiar tipo de propiedad', 'Change property type'), iconName: 'swap', disabled: isSystem },
    { key: 'filter', label: tr('Filtrar', 'Filter'), iconName: 'filter' },
    { key: 'sort', label: tr('Ordenar', 'Sort'), iconName: 'sort' },
    { key: 'hide', label: tr('Ocultar', 'Hide'), iconName: 'hide', disabled: isSystem },
    { key: 'fit', label: tr('Ajustar contenido', 'Fit content'), iconName: 'fit' },
    { key: 'duplicate', label: tr('Duplicar propiedad', 'Duplicate property'), iconName: 'copy', disabled: isSystem },
    { key: 'delete', label: tr('Eliminar propiedad', 'Delete property'), iconName: 'trash', danger: true, disabled: isSystem },
  ];

  items.forEach(item => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `property-menu-item${item.danger ? ' is-danger' : ''}`;
    btn.innerHTML = `${icon(item.iconName)}<span>${escapeHtml(item.label)}</span>`;
    btn.disabled = Boolean(item.disabled);
    btn.addEventListener('click', async (event) => {
      event.stopPropagation();
      closePropertyHeaderMenu();
      if (item.key === 'edit') await openEditPropertyModal(prop);
      if (item.key === 'changeType') await openChangePropertyTypeModal(prop);
      if (item.key === 'filter') openAdvancedCriteriaModal({ focus: 'filter', presetPropertyId: prop.id });
      if (item.key === 'sort') openAdvancedCriteriaModal({ focus: 'sort', presetPropertyId: prop.id });
      if (item.key === 'hide') await hideProperty(prop);
      if (item.key === 'fit') adjustPropertyColumn(prop.id);
      if (item.key === 'duplicate') await duplicateProperty(prop);
      if (item.key === 'delete') await deleteProperty(prop);
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);
  positionFloatingMenu(menu, anchorEl, { align: 'left', prefer: 'bottom' });
  PROPERTY_MENU_STATE.menu = menu;
  PROPERTY_MENU_STATE.propertyId = Number(prop.id || 0);
}

function adjustPropertyColumn(propertyId) {
  const header = document.querySelector(`th[data-property-id="${propertyId}"]`);
  if (!header) return;

  const cells = [...document.querySelectorAll(`td[data-property-id="${propertyId}"]`)];
  const widths = [header.scrollWidth + 20, ...cells.map(cell => cell.scrollWidth + 20)];
  const target = Math.min(640, Math.max(110, ...widths));

  header.style.minWidth = `${target}px`;
  cells.forEach(cell => {
    cell.style.minWidth = `${target}px`;
  });
}

function renderCellValue(prop, value) {
  if (prop.type === 'checkbox') {
    const span = document.createElement('span');
    span.textContent = value ? '☑' : '☐';
    return span;
  }

  if (prop.type === 'singleSelect' || prop.type === 'multiSelect') {
    const container = document.createElement('div');
    const values = Array.isArray(value) ? value : (value ? [value] : []);
    values.forEach(item => {
      const option = findSelectOption(prop.config?.options || [], item);
      const badge = document.createElement('span');
      badge.className = `badge tag-${option?.color || 'gray'}`;
      badge.textContent = String(item);
      badge.style.marginRight = '4px';
      container.appendChild(badge);
    });
    return container;
  }

  if (prop.type === 'attachment') {
    const files = Array.isArray(value) ? value : [];
    const container = document.createElement('div');
    container.className = 'attachment-preview-list attachment-preview-list-compact';

    if (!files.length) {
      container.innerHTML = `<span class="count attachment-empty-inline">${escapeHtml(tr('Sin adjuntos', 'No attachments'))}</span>`;
      return container;
    }

    const visibleFiles = files.slice(0, 4);
    visibleFiles.forEach(url => {
      const fileUrl = String(url);
      const fileName = attachmentFileName(fileUrl);

      const itemWrap = document.createElement('div');
      itemWrap.className = 'attachment-thumb-wrap';

      const previewBtn = document.createElement('button');
      previewBtn.type = 'button';
      previewBtn.className = 'attachment-preview-btn';
      previewBtn.title = fileName;
      previewBtn.setAttribute('aria-label', fileName);

      if (isImageAttachment(fileUrl)) {
        const img = document.createElement('img');
        img.src = fileUrl;
        img.alt = fileName;
        previewBtn.appendChild(img);
      } else {
        previewBtn.innerHTML = attachmentIconForUrl(fileUrl);
      }

      previewBtn.addEventListener('click', event => {
        event.stopPropagation();
        if (isImageAttachment(fileUrl)) {
          openImagePreviewModal(fileUrl, fileName);
        } else {
          confirmAttachmentDownload(fileUrl);
        }
      });

      itemWrap.appendChild(previewBtn);

      /* X button to delete */
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'attachment-delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.title = t('deleteAttachment');
      deleteBtn.setAttribute('aria-label', t('deleteAttachment'));
      deleteBtn.addEventListener('click', event => {
        event.stopPropagation();
        confirmDeleteAttachment(fileUrl);
      });
      itemWrap.appendChild(deleteBtn);

      container.appendChild(itemWrap);
    });

    if (files.length > 4) {
      const extra = document.createElement('div');
      extra.className = 'attachment-extra-count';
      extra.textContent = `+${files.length - 4}`;
      container.appendChild(extra);
    }

    return container;
  }

  if (Array.isArray(value)) {
    const span = document.createElement('span');
    span.textContent = value.join(', ');
    return span;
  }

  if (prop.type === 'url' && value) {
    const anchor = document.createElement('a');
    anchor.href = String(value);
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.textContent = String(value);
    return anchor;
  }

  const span = document.createElement('span');
  span.textContent = value === null || value === undefined || value === '' ? '—' : String(value);
  return span;
}

function renderGalleryView(host) {
  const grid = document.createElement('div');
  grid.className = 'gallery-grid';

  const attachmentProperty = visibleProperties().find(prop => prop.type === 'attachment') || STATE.selectedDatabase.properties.find(prop => prop.type === 'attachment');

  STATE.records.forEach(record => {
    const card = document.createElement('article');
    card.className = 'gallery-card';

    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumb';

    const attachmentUrls = attachmentProperty ? record.values[attachmentProperty.key] : [];
    const firstImage = Array.isArray(attachmentUrls)
      ? attachmentUrls.find(url => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url))
      : null;

    if (firstImage) {
      const img = document.createElement('img');
      img.src = firstImage;
      img.alt = tr('Adjunto', 'Attachment');
      thumb.appendChild(img);
    } else {
      thumb.textContent = tr('Sin miniatura', 'No thumbnail');
    }

    const body = document.createElement('div');
    body.className = 'gallery-body';
    const titleProp = STATE.selectedDatabase.properties.find(prop => prop.type === 'text') || STATE.selectedDatabase.properties[0];
    body.innerHTML = `<strong>${escapeHtml(String(record.values[titleProp?.key] || `${tr('Registro', 'Record')} ${record.id}`))}</strong><div class="count">ID ${record.id}</div>`;

    card.appendChild(thumb);
    card.appendChild(body);
    card.addEventListener('click', () => openRecordModal(record));
    grid.appendChild(card);
  });

  host.appendChild(grid);
}

function renderAnalysisView(host, view) {
  destroyChartInstance(view.id);

  const card = document.createElement('div');
  card.className = 'analysis-card';

  const props = STATE.selectedDatabase.properties;
  const cfg = view.config || {};

  card.innerHTML = `
    <div class="analysis-grid">
      <label>Título<input id="ana-title-${view.id}" value="${escapeHtml(cfg.title || view.name)}" /></label>
      <label>${escapeHtml(tr('Tipo gráfico', 'Chart type'))}
        <select id="ana-type-${view.id}">
          <option value="bar">${escapeHtml(tr('Barras', 'Bars'))}</option>
          <option value="line">${escapeHtml(tr('Líneas', 'Lines'))}</option>
          <option value="heatmap">${escapeHtml(tr('Mapa de calor (tabla)', 'Heatmap (table)'))}</option>
        </select>
      </label>
      <label>${escapeHtml(tr('Propiedad X', 'Property X'))}
        <select id="ana-x-${view.id}">${propertySelectOptions(props, cfg.xPropertyId)}</select>
      </label>
      <label>${escapeHtml(tr('Propiedad Y (numérica)', 'Property Y (numeric)'))}
        <select id="ana-y-${view.id}"><option value="">${escapeHtml(tr('(conteo)', '(count)'))}</option>${propertySelectOptions(props, cfg.yPropertyId)}</select>
      </label>
      <label>${escapeHtml(tr('Agregación', 'Aggregation'))}
        <select id="ana-agg-${view.id}">
          <option value="count">${escapeHtml(tr('Conteo', 'Count'))}</option>
          <option value="sum">${escapeHtml(tr('Suma', 'Sum'))}</option>
          <option value="avg">${escapeHtml(tr('Promedio', 'Average'))}</option>
          <option value="max">${escapeHtml(tr('Máximo', 'Maximum'))}</option>
          <option value="min">${escapeHtml(tr('Mínimo', 'Minimum'))}</option>
        </select>
      </label>
      <label>${escapeHtml(tr('Chi-cuadrado A', 'Chi-square A'))}
        <select id="ana-chi-a-${view.id}"><option value="">${escapeHtml(tr('(sin prueba)', '(no test)'))}</option>${propertySelectOptions(props, cfg.chiAPropertyId)}</select>
      </label>
      <label>${escapeHtml(tr('Chi-cuadrado B', 'Chi-square B'))}
        <select id="ana-chi-b-${view.id}"><option value="">${escapeHtml(tr('(sin prueba)', '(no test)'))}</option>${propertySelectOptions(props, cfg.chiBPropertyId)}</select>
      </label>
      <div style="display:flex;align-items:flex-end;gap:8px;">
        <button class="btn btn-primary" id="ana-run-${view.id}">${escapeHtml(tr('Actualizar análisis', 'Update analysis'))}</button>
      </div>
    </div>
    <div id="ana-heatmap-${view.id}"></div>
    <canvas id="ana-chart-${view.id}" class="analysis-chart-canvas" height="320" style="display:none;"></canvas>
    <div id="ana-empty-${view.id}" class="analysis-empty">${escapeHtml(tr('Ningún gráfico generado todavía. Pulsa “Actualizar análisis” para generarlo.', 'No chart generated yet. Click “Update analysis” to generate it.'))}</div>
    <div id="ana-chi-box-${view.id}" class="chi-box">${escapeHtml(tr('Sin prueba chi-cuadrado.', 'No chi-square test.'))}</div>
  `;

  host.appendChild(card);

  document.getElementById(`ana-type-${view.id}`).value = cfg.chartType || 'bar';
  document.getElementById(`ana-agg-${view.id}`).value = cfg.aggregation || 'count';

  document.getElementById(`ana-run-${view.id}`).addEventListener('click', async () => {
    const nextCfg = {
      title: document.getElementById(`ana-title-${view.id}`).value.trim(),
      chartType: document.getElementById(`ana-type-${view.id}`).value,
      xPropertyId: Number(document.getElementById(`ana-x-${view.id}`).value || 0),
      yPropertyId: Number(document.getElementById(`ana-y-${view.id}`).value || 0),
      aggregation: document.getElementById(`ana-agg-${view.id}`).value,
      chiAPropertyId: Number(document.getElementById(`ana-chi-a-${view.id}`).value || 0),
      chiBPropertyId: Number(document.getElementById(`ana-chi-b-${view.id}`).value || 0),
    };

    await api(`/api/views/${view.id}`, { method: 'PUT', body: { config: nextCfg, name: nextCfg.title || view.name } });
    view.config = nextCfg;
    view.name = nextCfg.title || view.name;
    renderViewTabs();

    const result = await api(`/api/databases/${STATE.selectedDatabaseId}/analysis`, {
      method: 'POST',
      body: nextCfg,
    });

    renderAnalysisOutput(view.id, nextCfg, result);
  });
}

function renderAnalysisOutput(viewId, cfg, result) {
  const chartCanvas = document.getElementById(`ana-chart-${viewId}`);
  const heatmapHost = document.getElementById(`ana-heatmap-${viewId}`);
  const chiBox = document.getElementById(`ana-chi-box-${viewId}`);
  const emptyBox = document.getElementById(`ana-empty-${viewId}`);

  destroyChartInstance(viewId);

  heatmapHost.innerHTML = '';
  if (emptyBox) emptyBox.style.display = 'none';

  if (cfg.chartType === 'heatmap') {
    chartCanvas.style.display = 'none';
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    trh.innerHTML = `<th>${escapeHtml(tr('Categoría', 'Category'))}</th><th>${escapeHtml(tr('Valor', 'Value'))}</th>`;
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    result.chart.labels.forEach((label, idx) => {
      const value = result.chart.datasets[0].data[idx];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(String(label))}</td><td>${escapeHtml(String(Number(value).toFixed(3)))}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    wrap.appendChild(table);
    heatmapHost.appendChild(wrap);
  } else {
    chartCanvas.style.display = 'block';
    chartCanvas.height = 320;
    chartCanvas.style.height = '320px';
    STATE.chartInstances[viewId] = new Chart(chartCanvas, {
      type: cfg.chartType,
      data: result.chart,
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 2,
        resizeDelay: 150,
        animation: false,
        plugins: { legend: { display: true } },
      },
    });
  }

  if (result.chi) {
    chiBox.innerHTML = `
      <strong>Chi-cuadrado</strong><br />
      ${escapeHtml(tr('Estadístico', 'Statistic'))}: ${result.chi.statistic}<br />
      ${escapeHtml(tr('Grados de libertad', 'Degrees of freedom'))}: ${result.chi.degreesOfFreedom}<br />
      ${escapeHtml(tr('Filas', 'Rows'))}: ${result.chi.rows.length} · ${escapeHtml(tr('Columnas', 'Columns'))}: ${result.chi.cols.length}
    `;
  } else {
    chiBox.textContent = tr('Sin prueba chi-cuadrado (selecciona propiedades categóricas A y B).', 'No chi-square test (select categorical properties A and B).');
  }
}

function renderFilters() {
  const host = document.getElementById('filters');
  host.innerHTML = '';

  STATE.filters.forEach((filter, idx) => {
    const prop = STATE.selectedDatabase.properties.find(item => item.id === filter.propertyId);
    const op = FILTER_OPERATORS.find(item => item.value === filter.operator);
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.innerHTML = `
      <span>${icon('filter')}${escapeHtml(prop?.name || tr('Propiedad', 'Property'))} · ${escapeHtml(op ? filterLabel(op) : filter.operator)} · ${escapeHtml(String(filter.value || ''))}</span>
      <button class="btn">✕</button>
    `;
    chip.querySelector('button').addEventListener('click', async () => {
      STATE.filters.splice(idx, 1);
      renderFilters();
      await persistActiveViewCriteria();
      await loadRecords();
    });
    host.appendChild(chip);
  });

  STATE.sorts.forEach((sort, idx) => {
    const prop = STATE.selectedDatabase.properties.find(item => item.id === sort.propertyId);
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.innerHTML = `
      <span>${icon('sort')}${escapeHtml(prop?.name || tr('Propiedad', 'Property'))} · ${sort.dir === 'asc' ? tr('Ascendente', 'Ascending') : tr('Descendente', 'Descending')}</span>
      <button class="btn">✕</button>
    `;
    chip.querySelector('button').addEventListener('click', async () => {
      STATE.sorts.splice(idx, 1);
      renderFilters();
      await persistActiveViewCriteria();
      await loadRecords();
    });
    host.appendChild(chip);
  });
}

function propertySelectOptions(properties, selectedId) {
  return properties.map(prop => `<option value="${prop.id}" ${Number(selectedId) === prop.id ? 'selected' : ''}>${escapeHtml(prop.name)}</option>`).join('');
}

function dirSelectOptions(selected) {
  const value = selected === 'desc' ? 'desc' : 'asc';
  return `
    <option value="asc" ${value === 'asc' ? 'selected' : ''}>${tr('Ascendente', 'Ascending')}</option>
    <option value="desc" ${value === 'desc' ? 'selected' : ''}>${tr('Descendente', 'Descending')}</option>
  `;
}

function advancedFilterPropertyById(propertyId) {
  return STATE.selectedDatabase?.properties?.find(prop => prop.id === Number(propertyId)) || null;
}

function allowedFilterOperatorsForProperty(prop) {
  const type = String(prop?.type || 'text');
  if (type === 'checkbox') return ['checked', 'unchecked', 'isEmpty', 'isNotEmpty'];
  if (type === 'date' || type === 'time') return ['equals', 'notEquals', 'before', 'after', 'isEmpty', 'isNotEmpty'];
  return ['contains', 'notContains', 'equals', 'notEquals', 'isEmpty', 'isNotEmpty'];
}

function buildAdvancedFilterValueControl(prop, operator, currentValue) {
  const normalizedValue = currentValue === null || currentValue === undefined ? '' : String(currentValue);
  const noValueOperators = new Set(['isEmpty', 'isNotEmpty', 'checked', 'unchecked']);
  if (noValueOperators.has(String(operator || ''))) {
    return `<input data-role="value" value="" disabled placeholder="${escapeHtml(tr('(sin valor)', '(no value)'))}" />`;
  }

  if (prop && (prop.type === 'singleSelect' || prop.type === 'multiSelect')) {
    const options = sortSelectOptions(prop.config?.options || [], prop.config?.optionSort || 'manual');
    const html = options.map(item => {
      const label = String(item?.label || '');
      const selected = label === normalizedValue ? 'selected' : '';
      return `<option value="${escapeHtml(label)}" ${selected}>${escapeHtml(label)}</option>`;
    }).join('');

    return `
      <select data-role="value">
        <option value="">${escapeHtml(tr('Selecciona...', 'Select...'))}</option>
        ${html}
      </select>
    `;
  }

  const inputType = prop?.type === 'date' ? 'date' : (prop?.type === 'time' ? 'time' : 'text');
  return `<input data-role="value" type="${inputType}" value="${escapeHtml(normalizedValue)}" />`;
}

function syncAdvancedFilterRow(row, { preserveValue = true } = {}) {
  const propertySelect = row.querySelector('[data-role="property"]');
  const operatorSelect = row.querySelector('[data-role="operator"]');
  const valueHost = row.querySelector('[data-role="value-host"]');
  const previousValue = preserveValue ? (row.querySelector('[data-role="value"]')?.value ?? '') : '';

  const prop = advancedFilterPropertyById(propertySelect?.value);
  const allowedOperators = allowedFilterOperatorsForProperty(prop);
  const fallbackOperator = allowedOperators[0] || 'contains';
  const currentOperator = operatorSelect?.value;
  const nextOperator = allowedOperators.includes(currentOperator) ? currentOperator : fallbackOperator;

  operatorSelect.innerHTML = FILTER_OPERATORS
    .filter(op => allowedOperators.includes(op.value))
    .map(op => `<option value="${op.value}" ${op.value === nextOperator ? 'selected' : ''}>${filterLabel(op)}</option>`)
    .join('');

  valueHost.innerHTML = buildAdvancedFilterValueControl(prop, nextOperator, previousValue);
}

function addAdvancedFilterRow(host, initial = {}) {
  const row = document.createElement('div');
  row.className = 'advanced-criteria-row';
  row.innerHTML = `
    <label>${escapeHtml(tr('Propiedad', 'Property'))}<select data-role="property">${propertySelectOptions(STATE.selectedDatabase.properties, initial.propertyId)}</select></label>
    <label>${escapeHtml(tr('Operador', 'Operator'))}<select data-role="operator"></select></label>
    <label>${escapeHtml(tr('Valor', 'Value'))}<span data-role="value-host"></span></label>
    <button class="btn" type="button" data-role="remove">${icon('trash')}</button>
  `;

  const propertySelect = row.querySelector('[data-role="property"]');
  const operatorSelect = row.querySelector('[data-role="operator"]');
  propertySelect.addEventListener('change', () => syncAdvancedFilterRow(row, { preserveValue: false }));
  operatorSelect.addEventListener('change', () => syncAdvancedFilterRow(row, { preserveValue: true }));

  syncAdvancedFilterRow(row, { preserveValue: false });
  if (initial.operator) {
    const hasInitialOperator = [...operatorSelect.options].some(option => option.value === initial.operator);
    if (hasInitialOperator) operatorSelect.value = initial.operator;
  }
  syncAdvancedFilterRow(row, { preserveValue: false });
  const initialValueInput = row.querySelector('[data-role="value"]');
  if (initialValueInput) initialValueInput.value = String(initial.value ?? '');

  row.querySelector('[data-role="remove"]').addEventListener('click', () => row.remove());
  host.appendChild(row);
}

function addAdvancedSortRow(host, initial = {}) {
  const row = document.createElement('div');
  row.className = 'advanced-sort-row';
  row.innerHTML = `
    <label>${escapeHtml(tr('Propiedad', 'Property'))}<select data-role="property">${propertySelectOptions(STATE.selectedDatabase.properties, initial.propertyId)}</select></label>
    <label>${escapeHtml(tr('Dirección', 'Direction'))}<select data-role="dir">${dirSelectOptions(initial.dir)}</select></label>
    <button class="btn" type="button" data-role="remove">${icon('trash')}</button>
  `;

  row.querySelector('[data-role="remove"]').addEventListener('click', () => row.remove());
  host.appendChild(row);
}

function openAdvancedCriteriaModal({ focus = 'filter', presetPropertyId = null } = {}) {
  if (!STATE.selectedDatabase) return;

  openModal({
    title: tr('Filtros y ordenación avanzados', 'Advanced filters and sorting'),
    submitText: tr('Aplicar', 'Apply'),
    width: '1000px',
    content: `
      <div class="advanced-criteria-layout">
        <section class="advanced-criteria-col">
          <h4>${escapeHtml(tr('Filtros granulares', 'Granular filters'))}</h4>
          <div class="advanced-criteria-list" id="advancedFiltersRows"></div>
          <button class="btn" type="button" id="btnAdvancedAddFilter">${escapeHtml(tr('+ Añadir filtro', '+ Add filter'))}</button>
        </section>
        <section class="advanced-criteria-col">
          <h4>${escapeHtml(tr('Ordenación granular', 'Granular sorting'))}</h4>
          <div class="advanced-criteria-list" id="advancedSortRows"></div>
          <button class="btn" type="button" id="btnAdvancedAddSort">${escapeHtml(tr('+ Añadir orden', '+ Add sort'))}</button>
        </section>
      </div>
    `,
    onSubmit: async (modal) => {
      const nextFilters = [...modal.querySelectorAll('#advancedFiltersRows .advanced-criteria-row')]
        .map(row => ({
          propertyId: Number(row.querySelector('[data-role="property"]').value || 0),
          operator: row.querySelector('[data-role="operator"]').value,
          value: row.querySelector('[data-role="value"]').value,
        }))
        .filter(item => item.propertyId);

      const nextSorts = [...modal.querySelectorAll('#advancedSortRows .advanced-sort-row')]
        .map(row => ({
          propertyId: Number(row.querySelector('[data-role="property"]').value || 0),
          dir: row.querySelector('[data-role="dir"]').value === 'desc' ? 'desc' : 'asc',
        }))
        .filter(item => item.propertyId);

      STATE.filters = nextFilters;
      STATE.sorts = nextSorts;
      STATE.page = 1;
      renderFilters();
      await persistActiveViewCriteria();
      await loadRecords();
      return false;
    },
  });

  const filtersHost = document.getElementById('advancedFiltersRows');
  const sortsHost = document.getElementById('advancedSortRows');

  if (STATE.filters.length) STATE.filters.forEach(filter => addAdvancedFilterRow(filtersHost, filter));
  if (STATE.sorts.length) STATE.sorts.forEach(sort => addAdvancedSortRow(sortsHost, sort));

  if (!STATE.filters.length && (focus === 'filter' || presetPropertyId)) {
    addAdvancedFilterRow(filtersHost, {
      propertyId: presetPropertyId || STATE.selectedDatabase.properties[0]?.id,
      operator: 'contains',
      value: '',
    });
  }

  if (!STATE.sorts.length && (focus === 'sort' || presetPropertyId)) {
    addAdvancedSortRow(sortsHost, {
      propertyId: presetPropertyId || STATE.selectedDatabase.properties[0]?.id,
      dir: 'asc',
    });
  }

  document.getElementById('btnAdvancedAddFilter').addEventListener('click', () => {
    addAdvancedFilterRow(filtersHost, { propertyId: STATE.selectedDatabase.properties[0]?.id, operator: 'contains', value: '' });
  });

  document.getElementById('btnAdvancedAddSort').addEventListener('click', () => {
    addAdvancedSortRow(sortsHost, { propertyId: STATE.selectedDatabase.properties[0]?.id, dir: 'asc' });
  });
}

async function openEditPropertyModal(prop) {
  if (!prop) return;

  const currentOptionSort = normalizeOptionSortMode(prop.config?.optionSort || 'manual');
  const optionSortLabel = currentOptionSort === 'asc'
    ? tr('Alfabético ascendente', 'Alphabetical ascending')
    : (currentOptionSort === 'desc' ? tr('Alfabético descendente', 'Alphabetical descending') : tr('Manual', 'Manual'));

  /* ── Relation config ── */
  const dbOptions = STATE.databases.map(db => {
    const selected = (prop.config?.relatedDatabaseIds || []).includes(db.id) || prop.config?.relatedDatabaseId === db.id ? 'selected' : '';
    return `<option value="${db.id}" ${selected}>${escapeHtml(db.name)}</option>`;
  }).join('');

  const showRelation = prop.type === 'relation';
  const showRollup = prop.type === 'rollup';

  /* ── Rollup config ── */
  const relationPropertyOptions = STATE.selectedDatabase.properties
    .filter(p => p.type === 'relation')
    .map(p => {
      const selected = prop.config?.relationPropertyId === p.id ? 'selected' : '';
      return `<option value="${p.id}" ${selected}>${escapeHtml(p.name)}</option>`;
    }).join('');

  const rollupCalculations = [
    { value: 'showOriginal', label: tr('Mostrar original', 'Show original') },
    { value: 'countAll', label: tr('Contar todo', 'Count all') },
    { value: 'countValues', label: tr('Contar valores no vacíos', 'Count non-empty values') },
    { value: 'countUniqueValues', label: tr('Contar valores únicos', 'Count unique values') },
    { value: 'sum', label: tr('Suma (numérico)', 'Sum (numeric)') },
    { value: 'avg', label: tr('Promedio (numérico)', 'Average (numeric)') },
    { value: 'min', label: tr('Mínimo (numérico)', 'Minimum (numeric)') },
    { value: 'max', label: tr('Máximo (numérico)', 'Maximum (numeric)') },
  ];
  const currentCalc = prop.config?.calculate || 'showOriginal';

  openModal({
    title: `${tr('Editar propiedad', 'Edit property')}: ${prop.name}`,
    submitText: tr('Guardar cambios', 'Save changes'),
    content: `
      <div class="columns-2">
        <label>${escapeHtml(tr('Nombre', 'Name'))}<input id="editPropertyName" value="${escapeHtml(prop.name)}" /></label>
        <label class="checkbox-row"><input type="checkbox" id="editPropertyVisible" ${prop.is_visible ? 'checked' : ''}/> ${escapeHtml(tr('Visible en tabla/galería', 'Visible in table/gallery'))}</label>
      </div>
      <div id="editPropertySelectConfig" class="${(prop.type === 'singleSelect' || prop.type === 'multiSelect') ? '' : 'hidden'}">
        <div class="select-config-head">
          <h4>${escapeHtml(tr('Opciones de etiqueta y color', 'Tag and color options'))}</h4>
          <button type="button" class="btn" id="editPropertySortBtn">${escapeHtml(tr('Ordenar', 'Sort'))}</button>
        </div>
        <div class="count" id="editPropertySortLabel">${escapeHtml(tr('Orden actual', 'Current order'))}: ${optionSortLabel}</div>
        ${renderSelectOptionsEditor('editProperty')}
      </div>

      <div id="editRelationConfig" class="${showRelation ? '' : 'hidden'}">
        <h4>${escapeHtml(tr('Relaciones', 'Relations'))}</h4>
        <label>${escapeHtml(tr('Base de datos relacionada', 'Related database'))}
          <select id="editRelatedDatabase"><option value="">${escapeHtml(tr('Selecciona...', 'Select...'))}</option>${dbOptions}</select>
        </label>
        <label class="checkbox-row"><input type="checkbox" id="editRelationTwoWay" ${prop.config?.showOnRelatedDatabase ? 'checked' : ''} /> ${escapeHtml(tr('Mostrar también en la base relacionada (bidireccional)', 'Also show in related database (bidirectional)'))}</label>
        <label>${escapeHtml(tr('Nombre en la base relacionada', 'Name in related database'))}<input id="editRelationTwoWayName" value="${escapeHtml(prop.config?.reciprocalPropertyName || '')}" placeholder="${escapeHtml(tr('Ej.', 'e.g.'))} ${escapeHtml(STATE.selectedDatabase.name)}" /></label>
      </div>

      <div id="editRollupConfig" class="${showRollup ? '' : 'hidden'}">
        <h4>${escapeHtml(tr('Configurar rollup (solo lectura)', 'Configure rollup (read only)'))}</h4>
        <div class="columns-2">
          <label>${escapeHtml(tr('Propiedad relación', 'Relation property'))}<select id="editRollupRelationProperty"><option value="">${escapeHtml(tr('Selecciona...', 'Select...'))}</option>${relationPropertyOptions}</select></label>
          <label>${escapeHtml(tr('Propiedad origen', 'Source property'))}<select id="editRollupRelatedProperty"><option value="">${escapeHtml(tr('Selecciona una relación...', 'Select a relation...'))}</option></select></label>
        </div>
        <label>${escapeHtml(tr('Cálculo', 'Calculation'))}
          <select id="editRollupCalculate">${rollupCalculations.map(item => `<option value="${item.value}" ${currentCalc === item.value ? 'selected' : ''}>${item.label}</option>`).join('')}</select>
        </label>
      </div>
    `,
    onSubmit: async (modal) => {
      const name = document.getElementById('editPropertyName').value.trim();
      if (!name) return true;
      const isVisible = document.getElementById('editPropertyVisible').checked;
      const body = { name, isVisible };
      if (prop.type === 'singleSelect' || prop.type === 'multiSelect') {
        body.config = {
          ...(prop.config || {}),
          options: collectOptions('editProperty'),
          optionSort: normalizeOptionSortMode(modal.dataset.optionSort || prop.config?.optionSort || 'manual'),
        };
      }
      if (prop.type === 'relation') {
        const relatedDatabaseId = Number(document.getElementById('editRelatedDatabase').value || 0) || null;
        body.config = {
          ...(prop.config || {}),
          relatedDatabaseId,
          relatedDatabaseIds: relatedDatabaseId ? [relatedDatabaseId] : [],
          showOnRelatedDatabase: document.getElementById('editRelationTwoWay').checked,
          reciprocalPropertyName: document.getElementById('editRelationTwoWayName').value.trim() || null,
        };
      }
      if (prop.type === 'rollup') {
        body.config = {
          ...(prop.config || {}),
          relationPropertyId: Number(document.getElementById('editRollupRelationProperty').value || 0) || null,
          relatedPropertyId: Number(document.getElementById('editRollupRelatedProperty').value || 0) || null,
          calculate: document.getElementById('editRollupCalculate').value || 'showOriginal',
        };
      }
      await api(`/api/properties/${prop.id}`, { method: 'PUT', body });
      await reloadSelectedDatabase();
      return false;
    },
  });

  /* ── Rollup: load related properties ── */
  if (showRollup) {
    const editRollupRelationProperty = document.getElementById('editRollupRelationProperty');
    const editRollupRelatedProperty = document.getElementById('editRollupRelatedProperty');

    async function refreshEditRollupRelated() {
      const relationPropertyId = Number(editRollupRelationProperty.value || 0);
      if (!relationPropertyId) {
        editRollupRelatedProperty.innerHTML = `<option value="">${escapeHtml(tr('Selecciona una relación...', 'Select a relation...'))}</option>`;
        return;
      }
      const relatedProps = await api(`/api/properties/${relationPropertyId}/related-properties`);
      const options = relatedProps
        .filter(p => p.type !== 'relation' || p.id !== relationPropertyId)
        .map(p => {
          const selected = prop.config?.relatedPropertyId === p.id ? 'selected' : '';
          return `<option value="${p.id}" ${selected}>${escapeHtml(p.name)} (${escapeHtml(p.type)})</option>`;
        }).join('');
      editRollupRelatedProperty.innerHTML = `<option value="">${escapeHtml(tr('Selecciona...', 'Select...'))}</option>${options}`;
    }

    editRollupRelationProperty.addEventListener('change', refreshEditRollupRelated);
    await refreshEditRollupRelated();
  }

  if (prop.type === 'singleSelect' || prop.type === 'multiSelect') {
    const modal = document.getElementById('modal');
    modal.dataset.optionSort = currentOptionSort;
    mountOptionsEditor('editProperty', prop.config?.options || []);

    const sortButton = document.getElementById('editPropertySortBtn');
    const sortLabel = document.getElementById('editPropertySortLabel');

    sortButton.addEventListener('click', event => {
      event.stopPropagation();

      const sortMenu = document.createElement('div');
      sortMenu.className = 'property-menu';

      const options = [
        { key: 'manual', label: tr('Manual', 'Manual') },
        { key: 'asc', label: tr('Alfabético ascendente', 'Alphabetical ascending') },
        { key: 'desc', label: tr('Alfabético descendente', 'Alphabetical descending') },
      ];

      options.forEach(item => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'property-menu-item';
        row.innerHTML = `<span>${escapeHtml(item.label)}</span>`;
        row.addEventListener('click', () => {
          modal.dataset.optionSort = item.key;
          sortLabel.textContent = `${tr('Orden actual', 'Current order')}: ${item.label}`;
          sortMenu.remove();
        });
        sortMenu.appendChild(row);
      });

      document.body.appendChild(sortMenu);
      const rect = sortButton.getBoundingClientRect();
      const maxLeft = Math.max(8, window.innerWidth - sortMenu.offsetWidth - 8);
      sortMenu.style.left = `${Math.min(rect.left, maxLeft)}px`;
      sortMenu.style.top = `${Math.min(rect.bottom + 6, window.innerHeight - sortMenu.offsetHeight - 8)}px`;
      sortMenu.style.position = 'fixed';
      sortMenu.style.zIndex = '2300';

      const close = (ev) => {
        if (!sortMenu.contains(ev.target) && ev.target !== sortButton) {
          sortMenu.remove();
          document.removeEventListener('click', close);
        }
      };
      setTimeout(() => document.addEventListener('click', close), 0);
    });
  }
}

async function openChangePropertyTypeModal(prop) {
  if (!prop) return;

  openModal({
    title: `${tr('Cambiar tipo', 'Change type')}: ${prop.name}`,
    submitText: tr('Actualizar tipo', 'Update type'),
    content: `
      <label>${escapeHtml(tr('Nuevo tipo', 'New type'))}
        <select id="changePropertyType">
          ${PROPERTY_TYPES.map(item => `<option value="${item.value}" ${item.value === prop.type ? 'selected' : ''}>${escapeHtml(typeLabel(item))}</option>`).join('')}
        </select>
      </label>
    `,
    onSubmit: async () => {
      const type = document.getElementById('changePropertyType').value;
      const config = (type === prop.type)
        ? (prop.config || {})
        : (type === 'singleSelect' || type === 'multiSelect')
          ? { options: prop.config?.options || [] }
          : {};
      await api(`/api/properties/${prop.id}`, { method: 'PUT', body: { type, config } });
      await reloadSelectedDatabase();
      return false;
    },
  });
}

async function hideProperty(prop) {
  await api(`/api/properties/${prop.id}`, {
    method: 'PUT',
    body: { isVisible: false },
  });
  await reloadSelectedDatabase();
}

async function duplicateProperty(prop) {
  await api(`/api/databases/${STATE.selectedDatabaseId}/properties`, {
    method: 'POST',
    body: {
      name: `${prop.name} (copia)`,
      type: prop.type,
      isVisible: prop.is_visible,
      config: prop.config || {},
    },
  });
  await reloadSelectedDatabase();
}

async function deleteProperty(prop) {
  openConfirmMini({
    message: tr(`¿Eliminar la propiedad "${prop.name}"?`, `Delete property "${prop.name}"?`),
    confirmText: tr('Eliminar', 'Delete'),
    danger: true,
    onConfirm: async () => {
      await api(`/api/properties/${prop.id}`, { method: 'DELETE' });
      await reloadSelectedDatabase();
    },
  });
}

async function reloadSelectedDatabase() {
  STATE.selectedDatabase = await api(`/api/databases/${STATE.selectedDatabaseId}`);
  applyCriteriaFromActiveView();
  renderFilters();
  renderViewTabs();
  await loadRecords();
}

function setupThemeSwitcher() {
  const switcher = document.getElementById('themeSwitcher');
  const toggle = document.getElementById('themeToggle');
  const options = document.getElementById('themeOptions');
  const buttons = [...document.querySelectorAll('.theme-btn[data-theme-value]')];

  const initialTheme = normalizeTheme(STATE.appSettings?.ui?.theme);

  function setExpanded(expanded) {
    switcher.classList.toggle('open', expanded);
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    options.setAttribute('aria-hidden', expanded ? 'false' : 'true');
  }

  function updateButtons(theme) {
    buttons.forEach(btn => {
      const active = btn.dataset.themeValue === theme;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyTheme(theme, { persist = true } = {}) {
    const normalizedTheme = normalizeTheme(theme);
    document.documentElement.setAttribute('data-theme', normalizedTheme);
    updateButtons(normalizedTheme);

    if (persist) {
      persistUiSettings({ theme: normalizedTheme }).catch(error => {
        console.error('No se pudo guardar el tema en servidor', error);
      });
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.themeValue);
      setExpanded(false);
    });
  });

  toggle.addEventListener('click', () => setExpanded(!switcher.classList.contains('open')));
  document.addEventListener('click', event => {
    if (!switcher.contains(event.target)) setExpanded(false);
  });

  applyTheme(initialTheme, { persist: false });
  setExpanded(false);
}

function toggleSidebar() {
  const shell = document.querySelector('.app-shell');
  const collapsed = shell.classList.toggle('sidebar-collapsed');
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  persistUiSettings({ sidebarCollapsed: collapsed }).catch(error => {
    console.error('No se pudo guardar el estado del sidebar en servidor', error);
  });
}

function restoreSidebarState() {
  const shell = document.querySelector('.app-shell');
  const isCollapsed = Boolean(STATE.appSettings?.ui?.sidebarCollapsed);
  shell.classList.toggle('sidebar-collapsed', isCollapsed);
  document.body.classList.toggle('sidebar-collapsed', isCollapsed);
}

function applyLanguage() {
  document.documentElement.lang = STATE.language;

  const folderLabel = document.querySelector('#btnNewFolder span');
  if (folderLabel) folderLabel.textContent = STATE.language === 'en' ? 'New folder' : 'Nueva carpeta';

  const dbLabel = document.querySelector('#btnNewDatabase span');
  if (dbLabel) dbLabel.textContent = STATE.language === 'en' ? 'New database' : 'Nueva base de datos';

  const homeTitle = document.querySelector('#homeState h2');
  if (homeTitle) homeTitle.textContent = STATE.language === 'en' ? 'Select or create a database' : 'Selecciona o crea una base de datos';

  const homeText = document.querySelector('#homeState p');
  if (homeText) {
    homeText.textContent = STATE.language === 'en'
      ? 'Organize your databases in folders and configure properties, relations, views and dynamic analysis.'
      : 'Organiza tus bases en carpetas y configura propiedades, relaciones, vistas y análisis dinámicos.';
  }

  const btnImportCsv = document.getElementById('btnImportCsv');
  if (btnImportCsv) btnImportCsv.textContent = STATE.language === 'en' ? 'Import CSV' : 'Importar CSV';

  const btnUploadHeader = document.getElementById('btnUploadHeader');
  if (btnUploadHeader) btnUploadHeader.textContent = STATE.language === 'en' ? 'Cover' : 'Portada';

  const btnSettings = document.getElementById('btnSettings');
  if (btnSettings) btnSettings.textContent = STATE.language === 'en' ? 'Database settings' : 'Configuración';

  const btnNewProperty = document.getElementById('btnNewProperty');
  if (btnNewProperty) btnNewProperty.textContent = STATE.language === 'en' ? '+ Property' : '+ Propiedad';

  const btnNewView = document.getElementById('btnNewView');
  if (btnNewView) btnNewView.textContent = STATE.language === 'en' ? '+ View' : '+ Vista';

  const btnNewRecord = document.getElementById('btnNewRecord');
  if (btnNewRecord) btnNewRecord.textContent = STATE.language === 'en' ? '+ Record' : '+ Registro';

  const btnExportDb = document.getElementById('btnExportDb');
  if (btnExportDb) btnExportDb.textContent = STATE.language === 'en' ? 'Export' : 'Exportar';

  const btnRestoreDb = document.getElementById('btnRestoreDb');
  if (btnRestoreDb) btnRestoreDb.textContent = STATE.language === 'en' ? 'Restore backup' : 'Restaurar backup';

  const btnAdvancedFilter = document.getElementById('btnAdvancedFilter');
  if (btnAdvancedFilter) {
    btnAdvancedFilter.title = STATE.language === 'en' ? 'Advanced filters' : 'Filtros avanzados';
    btnAdvancedFilter.setAttribute('aria-label', btnAdvancedFilter.title);
  }

  const btnAdvancedSort = document.getElementById('btnAdvancedSort');
  if (btnAdvancedSort) {
    btnAdvancedSort.title = STATE.language === 'en' ? 'Advanced sorting' : 'Ordenación avanzada';
    btnAdvancedSort.setAttribute('aria-label', btnAdvancedSort.title);
  }

  const settingsBtn = document.getElementById('btnAppSettings');
  settingsBtn.title = t('globalSettings');
  settingsBtn.setAttribute('aria-label', t('globalSettings'));

  const dbSearch = document.getElementById('databaseSearch');
  if (dbSearch) dbSearch.placeholder = STATE.language === 'en' ? 'Search database...' : 'Buscar base de datos...';

  const recordSearch = document.getElementById('recordSearch');
  if (recordSearch) recordSearch.placeholder = STATE.language === 'en' ? 'Search records...' : 'Buscar registros...';

  renderSidebar();
  if (STATE.selectedDatabase) {
    renderDatabaseHeader();
    renderViewTabs();
    renderActiveView();
  }
}

function openAppSettingsModal() {
  const currentLanguage = STATE.appSettings?.ui?.language === 'es' ? 'es' : (STATE.language === 'es' ? 'es' : 'en');

  const integrationTabLabel = tr('Integraciones', 'Integrations');
  const integrationInfoText = tr(
    'Genera claves API para conectar con otras apps. La clave completa solo se muestra una vez al crearla.',
    'Generate API keys to connect with other apps. The full key is shown only once when created.',
  );
  const integrationUseCases = tr(
    'Ejemplos: crear registros por tipo de propiedad, buscar por propiedad/nombre, subir archivos a registros concretos.',
    'Examples: create records by property type, search by property/name, upload files to specific records.',
  );
  const dbCodesTitle = tr('Códigos de bases de datos', 'Database codes');
  const dbCodesHint = tr(
    'Usa este código para resolver rápidamente el ID antes de operar con la API.',
    'Use this code to quickly resolve the ID before running API operations.',
  );
  const tutorialToggleText = tr('Mostrar tutorial API', 'Show API tutorial');
  const tutorialHideText = tr('Ocultar tutorial API', 'Hide API tutorial');
  const tutorialCopyText = tr('Copiar tutorial', 'Copy tutorial');
  const tutorialCopiedText = tr('Tutorial copiado', 'Tutorial copied');

  openModal({
    title: t('globalSettings'),
    submitText: t('save'),
    closeOnSubmit: false,
    content: `
      <div class="view-tabs" id="appSettingsTabs">
        <button class="view-tab active" type="button" data-tab="general">${escapeHtml(t('generalTab'))}</button>
        <button class="view-tab" type="button" data-tab="interface">${escapeHtml(t('interfaceTab'))}</button>
        <button class="view-tab" type="button" data-tab="integrations">${escapeHtml(integrationTabLabel)}</button>
        <button class="view-tab" type="button" data-tab="backup">${escapeHtml(t('backupTab'))}</button>
        <button class="view-tab" type="button" data-tab="danger">${escapeHtml(t('dangerTab'))}</button>
      </div>

      <div id="settingsTabGeneral" class="modal-body">
        <p class="count">${escapeHtml(STATE.language === 'en' ? 'General options will be expanded soon.' : 'Las opciones generales se ampliarán próximamente.')}</p>
      </div>

      <div id="settingsTabInterface" class="modal-body hidden">
        <label>${escapeHtml(t('languageLabel'))}
          <select id="settingsLanguage">
            <option value="es" ${currentLanguage === 'es' ? 'selected' : ''}>${escapeHtml(t('languageSpanish'))}</option>
            <option value="en" ${currentLanguage === 'en' ? 'selected' : ''}>${escapeHtml(t('languageEnglish'))}</option>
          </select>
        </label>
      </div>

      <div id="settingsTabIntegrations" class="modal-body hidden" style="display:grid;gap:10px;">
        <p class="count">${escapeHtml(integrationInfoText)}</p>
        <p class="count">${escapeHtml(integrationUseCases)}</p>
        <div class="columns-2">
          <label>${escapeHtml(tr('Etiqueta (opcional)', 'Label (optional)'))}
            <input id="settingsApiKeyLabel" placeholder="${escapeHtml(tr('Ej: Make / Zapier / n8n', 'e.g. Make / Zapier / n8n'))}" />
          </label>
          <div style="display:flex;align-items:flex-end;">
            <button class="btn" type="button" id="btnCreateApiKey">${escapeHtml(tr('Crear nueva clave', 'Create new key'))}</button>
          </div>
        </div>
        <label>${escapeHtml(tr('Clave recién creada (solo visible ahora)', 'New key (visible only now)'))}
          <input id="settingsApiKeyPlain" readonly value="" placeholder="${escapeHtml(tr('Aún no creada', 'Not created yet'))}" />
        </label>
        <div class="count">${escapeHtml(tr('Copia y guarda la clave en tu gestor secreto. No se puede volver a mostrar.', 'Copy and store the key in your secret manager. It cannot be shown again.'))}</div>
        <div id="settingsApiKeysList" class="config-list"></div>

        <hr style="border:none;border-top:1px solid var(--border);" />
        <strong>${escapeHtml(dbCodesTitle)}</strong>
        <p class="count">${escapeHtml(dbCodesHint)}</p>
        <div id="settingsDatabaseCodesList" class="config-list"></div>

        <button class="btn" type="button" id="btnToggleApiTutorial">${escapeHtml(tutorialToggleText)}</button>
        <div id="settingsApiTutorialWrap" class="api-tutorial-wrap hidden">
          <label>${escapeHtml(tr('Tutorial y endpoints API', 'API tutorial and endpoints'))}
            <textarea id="settingsApiTutorialText" class="api-tutorial-text" rows="16" readonly></textarea>
          </label>
          <div class="api-tutorial-actions">
            <button class="btn" type="button" id="btnCopyApiTutorial">${escapeHtml(tutorialCopyText)}</button>
          </div>
        </div>
      </div>

      <div id="settingsTabBackup" class="modal-body hidden" style="display:grid;gap:12px;">
        <p class="count">${escapeHtml(t('portfolioBackupInfo'))}</p>
        <button class="btn" type="button" id="btnDownloadFullBackup">${escapeHtml(t('downloadFullBackup'))}</button>
        <hr style="border:none;border-top:1px solid var(--border);" />
        <p style="color:var(--danger,#a33);font-size:13px;">${escapeHtml(t('portfolioRestoreWarning'))}</p>
        <label>${escapeHtml(t('chooseZipFile'))}<input type="file" id="settingsRestorePortfolioFile" accept=".zip" /></label>
        <button class="btn btn-danger" type="button" id="btnRestoreFullBackup">${escapeHtml(t('restoreFullBackup'))}</button>
      </div>

      <div id="settingsTabDanger" class="modal-body hidden">
        <div class="danger-zone-panel">
          <strong>${escapeHtml(t('dangerZoneTitle'))}</strong>
          <p class="count">${escapeHtml(t('dangerZoneDescription'))}</p>
          <button class="btn btn-danger" type="button" id="btnPurgeAllData">${escapeHtml(t('deleteAllData'))}</button>
        </div>
      </div>
    `,
    onSubmit: async (modal) => {
      const nextLanguage = modal.querySelector('#settingsLanguage')?.value || currentLanguage;
      const incoming = {
        ui: {
          language: nextLanguage === 'es' ? 'es' : 'en',
        },
      };
      const saved = await api('/api/settings', { method: 'PUT', body: incoming });
      STATE.appSettings = saved;
      STATE.language = saved?.ui?.language === 'es' ? 'es' : 'en';
      applyLanguage();
      return false;
    },
  });

  const tabs = [...document.querySelectorAll('#appSettingsTabs .view-tab')];
  const general = document.getElementById('settingsTabGeneral');
  const iface = document.getElementById('settingsTabInterface');
  const integrations = document.getElementById('settingsTabIntegrations');
  const backup = document.getElementById('settingsTabBackup');
  const danger = document.getElementById('settingsTabDanger');

  const apiKeysList = document.getElementById('settingsApiKeysList');
  const apiKeyLabel = document.getElementById('settingsApiKeyLabel');
  const apiKeyPlain = document.getElementById('settingsApiKeyPlain');
  const createApiKeyBtn = document.getElementById('btnCreateApiKey');
  const databaseCodesList = document.getElementById('settingsDatabaseCodesList');
  const toggleTutorialBtn = document.getElementById('btnToggleApiTutorial');
  const tutorialWrap = document.getElementById('settingsApiTutorialWrap');
  const tutorialText = document.getElementById('settingsApiTutorialText');
  const copyTutorialBtn = document.getElementById('btnCopyApiTutorial');

  function renderApiKeys(keys = []) {
    const list = Array.isArray(keys) ? keys : [];
    if (!apiKeysList) return;

    if (!list.length) {
      apiKeysList.innerHTML = `<div class="count">${escapeHtml(tr('No hay claves API todavía.', 'No API keys yet.'))}</div>`;
      return;
    }

    apiKeysList.innerHTML = list
      .map(item => {
        const label = item.label ? ` · ${escapeHtml(item.label)}` : '';
        const state = item.active ? tr('Activa', 'Active') : tr('Revocada', 'Revoked');
        return `
          <div class="config-row" data-api-key-id="${escapeHtml(item.id)}" style="grid-template-columns:1fr auto;align-items:center;">
            <div>
              <strong>${escapeHtml(item.prefix)}…</strong>${label}
              <div class="count">${escapeHtml(state)} · ${escapeHtml(item.createdAt || '')}</div>
            </div>
            ${item.active ? `<button class="btn btn-danger" type="button" data-role="revoke-api-key">${escapeHtml(tr('Revocar', 'Revoke'))}</button>` : ''}
          </div>
        `;
      })
      .join('');

    [...apiKeysList.querySelectorAll('[data-role="revoke-api-key"]')].forEach(button => {
      button.addEventListener('click', async event => {
        const row = event.target.closest('[data-api-key-id]');
        const keyId = row?.getAttribute('data-api-key-id');
        if (!keyId) return;

        openConfirmMini({
          message: tr('¿Revocar esta clave API? Dejará de funcionar inmediatamente.', 'Revoke this API key? It will stop working immediately.'),
          confirmText: tr('Revocar', 'Revoke'),
          danger: true,
          onConfirm: async () => {
            await api(`/api/settings/api-keys/${encodeURIComponent(keyId)}`, { method: 'DELETE' });
            const refreshed = await api('/api/settings/api-keys');
            renderApiKeys(refreshed.keys || []);
          },
        });
      });
    });
  }

  function renderDatabaseCodes() {
    if (!databaseCodesList) return;

    if (!STATE.databases.length) {
      databaseCodesList.innerHTML = `<div class="count" style="padding:8px;">${escapeHtml(tr('No hay bases de datos todavía.', 'No databases yet.'))}</div>`;
      return;
    }

    databaseCodesList.innerHTML = STATE.databases
      .map(database => {
        const code = String(database.api_code || '').trim();
        return `
          <div class="config-row" style="grid-template-columns:1fr auto auto;align-items:center;">
            <div>
              <strong>${escapeHtml(database.name)}</strong>
              <div class="count">ID ${escapeHtml(String(database.id))} · ${escapeHtml(tr('Código', 'Code'))}: ${escapeHtml(code || '-')}</div>
            </div>
            <button type="button" class="btn" data-copy-db-code="${escapeHtml(code)}">${escapeHtml(tr('Copiar código', 'Copy code'))}</button>
            <button type="button" class="btn" data-copy-db-id="${escapeHtml(String(database.id))}">${escapeHtml(tr('Copiar ID', 'Copy ID'))}</button>
          </div>
        `;
      })
      .join('');

    [...databaseCodesList.querySelectorAll('[data-copy-db-code]')].forEach(button => {
      button.addEventListener('click', async () => {
        const code = button.getAttribute('data-copy-db-code') || '';
        if (!code) return;
        await copyWithVisualFeedback(button, code, {
          idle: tr('Copiar código', 'Copy code'),
          copied: tr('Código copiado', 'Code copied'),
        });
      });
    });

    [...databaseCodesList.querySelectorAll('[data-copy-db-id]')].forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.getAttribute('data-copy-db-id') || '';
        if (!id) return;
        await copyWithVisualFeedback(button, id, {
          idle: tr('Copiar ID', 'Copy ID'),
          copied: tr('ID copiado', 'ID copied'),
        });
      });
    });
  }

  function buildApiTutorialText() {
    const origin = window.location.origin;
    const databaseLines = STATE.databases.length
      ? STATE.databases
        .map(item => `- ${item.name} -> code=${item.api_code || '-'} id=${item.id}`)
        .join('\n')
      : '- (sin bases de datos todavía)';

    return [
      tr('Tutorial API dubyDB', 'dubyDB API Tutorial'),
      '==================================================',
      '',
      tr('1) Base URL', '1) Base URL'),
      origin,
      '',
      tr('2) Autenticación (si está habilitada)', '2) Authentication (if enabled)'),
      'Header: x-api-key: duby_xxx',
      'o Header: Authorization: Bearer duby_xxx',
      '',
      tr('3) Resolver ID de base de datos por código', '3) Resolve database ID from code'),
      'GET /api/databases/resolve/:code',
      tr('Ejemplo:', 'Example:'),
      `GET ${origin}/api/databases/resolve/db_xxxxx`,
      '',
      tr('4) Endpoints principales (aceptan ID o código en :id)', '4) Main endpoints (:id accepts numeric id or code)'),
      'GET /api/databases',
      'GET /api/databases/:id',
      'GET /api/databases/:id/records?page=1&pageSize=50',
      'POST /api/databases/:id/records',
      'POST /api/databases/:id/properties',
      'POST /api/databases/:id/analysis',
      '',
      tr('5) Subir archivos a registros', '5) Upload files to records'),
      'POST /api/records/:recordId/attachments/:propertyId (multipart/form-data, campo file)',
      '',
      tr('6) Flujo recomendado para integrar', '6) Recommended integration flow'),
      tr('a) Lista bases o usa el código guardado.', 'a) List databases or use your saved code.'),
      tr('b) Resuelve el ID con /resolve si lo necesitas.', 'b) Resolve id with /resolve if needed.'),
      tr('c) Crea o actualiza registros en /records.', 'c) Create or update records in /records.'),
      tr('d) Sube adjuntos al recordId y propertyId correctos.', 'd) Upload attachments using the target recordId/propertyId.'),
      '',
      tr('Bases de datos actuales:', 'Current databases:'),
      databaseLines,
    ].join('\n');
  }

  if (tutorialText) {
    tutorialText.value = buildApiTutorialText();
  }

  renderDatabaseCodes();

  if (toggleTutorialBtn && tutorialWrap) {
    toggleTutorialBtn.addEventListener('click', () => {
      const willShow = tutorialWrap.classList.contains('hidden');
      tutorialWrap.classList.toggle('hidden', !willShow);
      toggleTutorialBtn.textContent = willShow ? tutorialHideText : tutorialToggleText;
    });
  }

  if (copyTutorialBtn && tutorialText) {
    copyTutorialBtn.addEventListener('click', () => {
      copyWithVisualFeedback(copyTutorialBtn, tutorialText.value, {
        idle: tutorialCopyText,
        copied: tutorialCopiedText,
      });
    });
  }

  async function refreshApiKeys() {
    const payload = await api('/api/settings/api-keys');
    renderApiKeys(payload.keys || []);
  }

  if (createApiKeyBtn) {
    createApiKeyBtn.addEventListener('click', async () => {
      const label = apiKeyLabel?.value?.trim() || null;
      createApiKeyBtn.disabled = true;
      createApiKeyBtn.classList.add('is-loading');
      const prev = createApiKeyBtn.textContent;
      createApiKeyBtn.textContent = tr('Creando…', 'Creating…');

      try {
        const created = await api('/api/settings/api-keys', {
          method: 'POST',
          body: label ? { label } : {},
        });
        if (apiKeyPlain) {
          apiKeyPlain.value = created.key || '';
          apiKeyPlain.focus();
          apiKeyPlain.select();
        }
        if (apiKeyLabel) apiKeyLabel.value = '';
        await refreshApiKeys();
      } finally {
        createApiKeyBtn.disabled = false;
        createApiKeyBtn.classList.remove('is-loading');
        createApiKeyBtn.textContent = prev;
      }
    });
  }

  refreshApiKeys().catch(error => {
    console.error('No se pudieron cargar las claves API', error);
  });

  const downloadBtn = document.getElementById('btnDownloadFullBackup');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      window.open('/api/backup/full', '_blank');
    });
  }

  const restoreBtn = document.getElementById('btnRestoreFullBackup');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      const fileInput = document.getElementById('settingsRestorePortfolioFile');
      const file = fileInput?.files?.[0];
      if (!file) {
        openConfirmMini({
          message: STATE.language === 'en' ? 'Select a ZIP file first.' : 'Selecciona un archivo ZIP primero.',
          confirmText: 'OK',
        });
        return;
      }

      const previousLabel = restoreBtn.textContent;
      restoreBtn.disabled = true;
      restoreBtn.classList.add('is-loading');
      restoreBtn.textContent = t('restoringPortfolio');

      try {
        const form = new FormData();
        form.append('backup', file);
        const response = await fetch('/api/backup/full/restore', { method: 'POST', body: form });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          openConfirmMini({
            message: result.error || (STATE.language === 'en' ? 'Restore error' : 'Error al restaurar'),
            confirmText: 'OK',
          });
          return;
        }

        const bootstrap = await api('/api/bootstrap');
        STATE.folders = bootstrap.folders;
        STATE.databases = bootstrap.databases;
        STATE.appSettings = bootstrap.settings || null;
        STATE.language = bootstrap.settings?.ui?.language === 'es' ? 'es' : 'en';
        const selectedStillExists = STATE.databases.some(item => item.id === STATE.selectedDatabaseId);
        if (!selectedStillExists) {
          STATE.selectedDatabaseId = null;
          STATE.selectedDatabase = null;
        }
        applyLanguage();
        renderSidebar();
        if (selectedStillExists && STATE.selectedDatabaseId) {
          await selectDatabase(STATE.selectedDatabaseId);
        }

        openConfirmMini({
          message: result.message || t('portfolioRestoreSuccess'),
          confirmText: 'OK',
        });
      } catch (error) {
        openConfirmMini({
          message: (STATE.language === 'en' ? 'Error: ' : 'Error: ') + error.message,
          confirmText: 'OK',
        });
      } finally {
        restoreBtn.disabled = false;
        restoreBtn.classList.remove('is-loading');
        restoreBtn.textContent = previousLabel;
      }
    });
  }

  const purgeAllBtn = document.getElementById('btnPurgeAllData');
  if (purgeAllBtn) {
    purgeAllBtn.addEventListener('click', () => {
      openConfirmMini({
        message: t('deleteAllDataConfirm'),
        confirmText: t('deleteAllData'),
        danger: true,
        onConfirm: async () => {
          const previousSelectedDatabaseId = STATE.selectedDatabaseId;
          const previousLabel = purgeAllBtn.textContent;
          purgeAllBtn.disabled = true;
          purgeAllBtn.classList.add('is-loading');
          purgeAllBtn.textContent = t('deletingAllData');

          STATE.selectedDatabaseId = null;
          STATE.selectedDatabase = null;
          STATE.folders = [];
          STATE.databases = [];
          STATE.filters = [];
          STATE.sorts = [];
          STATE.records = [];
          STATE.totalRecords = 0;
          STATE.totalDatabaseRecords = 0;
          STATE.page = 1;
          STATE.search = '';
          STATE.activeViewId = null;
          STATE.selectedRecordIds = [];
          const recordSearch = document.getElementById('recordSearch');
          if (recordSearch) recordSearch.value = '';
          document.getElementById('databaseState').classList.add('hidden');
          document.getElementById('homeState').classList.remove('hidden');
          renderSidebar();

          try {
            const result = await api('/api/danger/purge-all', { method: 'POST' });
            await refreshBootstrap();
            applyLanguage();
            renderSidebar();

            openConfirmMini({
              message: t('deleteAllDataSuccess'),
              confirmText: 'OK',
            });
          } catch (error) {
            await refreshBootstrap();
            const canRestoreSelection = previousSelectedDatabaseId && STATE.databases.some(item => item.id === previousSelectedDatabaseId);
            if (canRestoreSelection) {
              await selectDatabase(previousSelectedDatabaseId);
            }
            throw error;
          } finally {
            purgeAllBtn.disabled = false;
            purgeAllBtn.classList.remove('is-loading');
            purgeAllBtn.textContent = previousLabel;
          }
        },
      });
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.toggle('active', item === tab));
      const target = tab.getAttribute('data-tab');
      general.classList.toggle('hidden', target !== 'general');
      iface.classList.toggle('hidden', target !== 'interface');
      integrations.classList.toggle('hidden', target !== 'integrations');
      backup.classList.toggle('hidden', target !== 'backup');
      danger.classList.toggle('hidden', target !== 'danger');
    });
  });
}

function openModal({ title, content, onSubmit, submitText = t('save'), width = '860px', closeOnSubmit = true }) {
  const modal = document.getElementById('modal');
  modal.style.width = width;
  modal.innerHTML = `
    <form method="dialog">
      <div class="modal-title">
        <span>${escapeHtml(title)}</span>
        <button type="button" class="modal-close-btn" id="modalCloseX" aria-label="${escapeHtml(tr('Cerrar', 'Close'))}" title="${escapeHtml(tr('Cerrar', 'Close'))}">×</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-body modal-actions">
        <button type="button" class="btn" id="modalCancel">${escapeHtml(t('close'))}</button>
        <button type="submit" class="btn btn-primary" value="default" id="modalSubmit" autofocus>${escapeHtml(submitText)}</button>
      </div>
    </form>
  `;

  modal.showModal();

  const form = modal.querySelector('form');
  const cancelBtn = modal.querySelector('#modalCancel');
  const closeXBtn = modal.querySelector('#modalCloseX');
  const submitBtn = modal.querySelector('#modalSubmit');
  const originalSubmitLabel = submitBtn?.textContent || submitText;
  let submitting = false;

  const closeModalSafely = () => {
    if (submitting) return;
    modal.close();
  };

  cancelBtn?.addEventListener('click', () => {
    closeModalSafely();
  });

  closeXBtn?.addEventListener('click', () => {
    closeModalSafely();
  });

  const onModalClick = (event) => {
    if (event.target === modal) {
      closeModalSafely();
    }
  };
  modal.addEventListener('click', onModalClick);
  modal.addEventListener('close', () => {
    modal.removeEventListener('click', onModalClick);
  }, { once: true });

  function isAffirmativeAction() {
    const text = String(submitText || '').toLowerCase();
    return text.includes('guardar') || text.includes('save') || text.includes('aceptar') || text.includes('accept');
  }

  function resetSubmitVisualState() {
    if (!submitBtn) return;
    submitBtn.classList.remove('is-loading');
    submitBtn.classList.remove('is-saved');
    submitBtn.textContent = originalSubmitLabel;
  }

  async function showAffirmativeConfirmation() {
    if (!submitBtn || !isAffirmativeAction()) return;
    submitBtn.classList.remove('is-loading');
    submitBtn.classList.add('is-saved');
    submitBtn.textContent = STATE.language === 'en' ? 'Saved ✓' : 'Guardado ✓';
    await new Promise(resolve => setTimeout(resolve, 450));
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    submitting = true;

    if (cancelBtn) cancelBtn.disabled = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');
    }

    let keepOpen = false;
    try {
      keepOpen = onSubmit ? await onSubmit(modal) : false;
    } catch (_error) {
      keepOpen = true;
    }

    if (keepOpen) {
      if (cancelBtn) cancelBtn.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      resetSubmitVisualState();
      submitting = false;
      return;
    }

    await showAffirmativeConfirmation();
    if (!closeOnSubmit) {
      if (cancelBtn) cancelBtn.disabled = false;
      if (closeXBtn) closeXBtn.disabled = false;
      if (submitBtn) submitBtn.disabled = false;
      resetSubmitVisualState();
      submitting = false;
      return;
    }

    if (modal.open) {
      modal.close();
    }

    submitting = false;
  });
}

function openRenameDatabaseTitleModal() {
  if (!STATE.selectedDatabaseId || !STATE.selectedDatabase) return;

  openModal({
    title: tr('Renombrar base de datos', 'Rename database'),
    submitText: tr('Guardar', 'Save'),
    width: '460px',
    content: `<label>${escapeHtml(tr('Título', 'Title'))}<input id="quickDbName" value="${escapeHtml(STATE.selectedDatabase.name)}" /></label>`,
    onSubmit: async () => {
      const name = document.getElementById('quickDbName').value.trim();
      if (!name) return true;
      await api(`/api/databases/${STATE.selectedDatabaseId}/settings`, {
        method: 'PUT',
        body: { name },
      });
      await refreshBootstrap();
      STATE.selectedDatabase = await api(`/api/databases/${STATE.selectedDatabaseId}`);
      renderDatabaseHeader();
      return false;
    },
  });
}

function openCreateFolderModal() {
  openModal({
    title: tr('Nueva carpeta', 'New folder'),
    content: `<label>${escapeHtml(tr('Nombre', 'Name'))}<input id="folderName" /></label>`,
    onSubmit: async () => {
      const name = document.getElementById('folderName').value.trim();
      if (!name) return true;
      await api('/api/folders', { method: 'POST', body: { name } });
      await refreshBootstrap();
      return false;
    },
  });
}

function openCreateDatabaseModal() {
  const folderOptions = [`<option value="">${escapeHtml(tr('(Sin carpeta)', '(No folder)'))}</option>`]
    .concat(STATE.folders.map(folder => `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`))
    .join('');

  openModal({
    title: tr('Nueva base de datos', 'New database'),
    content: `
      <label>${escapeHtml(tr('Nombre', 'Name'))}<input id="databaseName" /></label>
      <label>${escapeHtml(tr('Carpeta', 'Folder'))}<select id="databaseFolder">${folderOptions}</select></label>
    `,
    onSubmit: async () => {
      const name = document.getElementById('databaseName').value.trim();
      const folderId = Number(document.getElementById('databaseFolder').value || 0) || null;
      if (!name) return true;
      const result = await api('/api/databases', { method: 'POST', body: { name, folderId } });
      STATE.selectedFolderId = folderId;
      await refreshBootstrap();
      await selectDatabase(result.id);
      return false;
    },
  });
}

/* ── Export database modal ── */
function openExportDbModal() {
  if (!STATE.selectedDatabaseId) return;

  openModal({
    title: t('exportDb'),
    submitText: tr('Descargar', 'Download'),
    width: '480px',
    content: `
      <div style="display:grid;gap:12px;">
        <label><strong>${escapeHtml(tr('Modo', 'Mode'))}</strong></label>
        <label class="checkbox-row"><input type="radio" name="exportMode" value="full" checked /> ${escapeHtml(t('exportFull'))}</label>
        <label class="checkbox-row"><input type="radio" name="exportMode" value="view" /> ${escapeHtml(t('exportView'))}</label>
        <hr style="border:none;border-top:1px solid var(--border);" />
        <label class="checkbox-row"><input type="checkbox" id="exportIncludeFiles" /> ${escapeHtml(t('includeFiles'))}</label>
      </div>
    `,
    onSubmit: async (modal) => {
      const mode = modal.querySelector('input[name="exportMode"]:checked')?.value || 'full';
      const includeFiles = modal.querySelector('#exportIncludeFiles')?.checked ? '1' : '0';

      const params = new URLSearchParams({ mode, includeFiles });
      if (mode === 'view') {
        params.set('filters', JSON.stringify(STATE.filters || []));
        params.set('search', STATE.search || '');
      }

      const url = `/api/databases/${STATE.selectedDatabaseId}/export?${params.toString()}`;
      window.open(url, '_blank');
      return false;
    },
  });
}

/* ── Restore database backup modal ── */
function openRestoreDbModal() {
  openModal({
    title: t('importDb'),
    submitText: tr('Restaurar', 'Restore'),
    width: '520px',
    content: `
      <div style="display:grid;gap:12px;">
        <p style="color:var(--text-secondary);font-size:13px;">${escapeHtml(t('restoreInfo'))}</p>
        <p class="count">${escapeHtml(tr('Si el backup es grande (muchos registros o adjuntos), la restauración puede tardar varios minutos.', 'If the backup is large (many records or attachments), restore can take several minutes.'))}</p>
        <p class="count">${escapeHtml(tr('Se creará una base de datos nueva. Nunca se sobrescribe una existente.', 'A new database will be created. Existing ones are never overwritten.'))}</p>
        <label>${escapeHtml(tr('Archivo de backup', 'Backup file'))}<input type="file" id="restoreFileInput" accept=".json,.zip" /></label>
      </div>
    `,
    onSubmit: async (modal) => {
      const input = modal.querySelector('#restoreFileInput');
      const file = input?.files?.[0];
      if (!file) return true;

      const submitBtn = modal.querySelector('#modalSubmit');
      const previousLabel = submitBtn?.textContent || tr('Restaurar', 'Restore');
      let shouldResetButton = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-loading');
        submitBtn.textContent = STATE.language === 'en' ? 'Restoring…' : 'Restaurando…';
      }

      const form = new FormData();
      form.append('backup', file);

      try {
        const response = await fetch('/api/restore', { method: 'POST', body: form });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          openConfirmMini({ message: result.error || tr('Error al restaurar', 'Restore error'), confirmText: 'OK' });
          return true;
        }

        await refreshBootstrap();
        if (result.databaseId) {
          await selectDatabase(result.databaseId);
        }

        openConfirmMini({
          message: result.message || t('restoreSuccess'),
          confirmText: 'OK',
        });

        shouldResetButton = false;
      } catch (err) {
        openConfirmMini({ message: `${tr('Error', 'Error')}: ${err.message}`, confirmText: 'OK' });
        return true;
      } finally {
        if (submitBtn && shouldResetButton) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-loading');
          submitBtn.textContent = previousLabel;
        }
      }

      return false;
    },
  });
}

function openImportCsvModal() {
  const availableTypes = PROPERTY_TYPES.filter(item => ['text', 'singleSelect', 'multiSelect', 'url', 'checkbox', 'date', 'time'].includes(item.value));
  const csvState = {
    rows: [],
    headers: [],
    file: null,
  };

  openModal({
    title: tr('Importar CSV', 'Import CSV'),
    submitText: tr('Importar', 'Import'),
    width: '980px',
    content: `
      <div class="columns-2">
        <label>${escapeHtml(tr('Nombre de la nueva BD', 'New DB name'))}<input id="csvDatabaseName" placeholder="${escapeHtml(tr('Ej. Importación febrero', 'e.g. February import'))}" /></label>
        <label>${escapeHtml(tr('Carpeta destino', 'Target folder'))}
          <select id="csvDatabaseFolder">
            <option value="">${escapeHtml(tr('(Sin carpeta)', '(No folder)'))}</option>
            ${STATE.folders.map(folder => `<option value="${folder.id}">${escapeHtml(folder.name)}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="columns-2">
        <label>${escapeHtml(tr('Archivo CSV', 'CSV file'))}<input type="file" id="csvFileInput" accept=".csv,text/csv" /></label>
        <label><span>${escapeHtml(tr('Opciones', 'Options'))}</span><span class="checkbox-row"><input type="checkbox" id="csvHasHeaders" checked /> ${escapeHtml(tr('La primera fila contiene cabeceras', 'First row contains headers'))}</span></label>
      </div>
      <p class="count">${escapeHtml(tr('La importación siempre crea una base de datos nueva. No se sobrescribe ninguna existente.', 'Import always creates a new database. Existing databases are not overwritten.'))}</p>
      <div id="csvMapping" class="csv-import-map"></div>
    `,
    onSubmit: async (modal) => {
      const databaseName = String(modal.querySelector('#csvDatabaseName')?.value || '').trim();
      const folderId = Number(modal.querySelector('#csvDatabaseFolder')?.value || 0) || null;
      if (!databaseName) {
        openConfirmMini({
          message: tr('Indica el nombre de la nueva base de datos.', 'Enter a name for the new database.'),
          confirmText: 'OK',
        });
        return true;
      }

      if (!csvState.rows.length || !csvState.headers.length) {
        openConfirmMini({
          message: tr('Primero selecciona y analiza un CSV válido.', 'First select and parse a valid CSV.'),
          confirmText: 'OK',
        });
        return true;
      }

      const mappingRows = [...modal.querySelectorAll('.csv-map-row')].map(row => ({
        include: row.querySelector('[data-role="include"]')?.checked !== false,
        sourceIndex: Number(row.getAttribute('data-index')),
        name: row.getAttribute('data-name') || '',
        type: row.querySelector('[data-role="type"]').value,
      })).filter(item => item.name && item.include);

      if (!mappingRows.length) {
        openConfirmMini({
          message: tr('Configura al menos una columna para importar.', 'Configure at least one column to import.'),
          confirmText: 'OK',
        });
        return true;
      }

      const createdDb = await api('/api/databases', {
        method: 'POST',
        body: { name: databaseName, folderId },
      });
      const targetDatabaseId = Number(createdDb.id);
      const created = [];

      for (const col of mappingRows) {
        const uniqueValues = collectDistinctCsvValues(csvState.rows, col.sourceIndex, col.type);
        const config = {};
        if (col.type === 'singleSelect' || col.type === 'multiSelect') {
          config.options = uniqueValues.map((value, idx) => ({
            label: value,
            color: STATE.tagColors[idx % STATE.tagColors.length] || 'gray',
          }));
        }

        const response = await api(`/api/databases/${targetDatabaseId}/properties`, {
          method: 'POST',
          body: {
            name: col.name,
            type: col.type,
            isVisible: true,
            config,
          },
        });

        created.push({ ...col, propertyId: response.id });
      }

      const importedDatabase = await api(`/api/databases/${targetDatabaseId}`);
      STATE.selectedDatabase = importedDatabase;
      const propertyById = new Map(STATE.selectedDatabase.properties.map(prop => [prop.id, prop]));
      const submitBtn = modal.querySelector('#modalSubmit');
      const totalRows = csvState.rows.length;
      const batchSize = 25;
      let processedRows = 0;

      for (let index = 0; index < csvState.rows.length; index += batchSize) {
        const batch = csvState.rows.slice(index, index + batchSize);
        if (submitBtn) {
          submitBtn.textContent = tr(
            `Importando ${Math.min(index + 1, totalRows)}-${Math.min(index + batch.length, totalRows)} de ${totalRows}…`,
            `Importing ${Math.min(index + 1, totalRows)}-${Math.min(index + batch.length, totalRows)} of ${totalRows}…`,
          );
        }

        await Promise.all(batch.map(async (row) => {
          const values = {};
          created.forEach(col => {
            const property = propertyById.get(col.propertyId);
            if (!property) return;
            const raw = row[col.sourceIndex];
            values[property.key] = parseCsvCellByType(raw, col.type);
          });
          await api(`/api/databases/${targetDatabaseId}/records`, { method: 'POST', body: { values } });
        }));

        processedRows += batch.length;
      }

      if (submitBtn) {
        submitBtn.textContent = tr(`Finalizando (${processedRows}/${totalRows})…`, `Finishing (${processedRows}/${totalRows})…`);
      }

      await refreshBootstrap();
      await selectDatabase(targetDatabaseId);
      return false;
    },
  });

  const fileInput = document.getElementById('csvFileInput');
  const hasHeaders = document.getElementById('csvHasHeaders');
  const mapping = document.getElementById('csvMapping');

  async function detectCsv() {
    const file = fileInput.files[0];
    csvState.file = file;
    if (!file) {
      csvState.rows = [];
      csvState.headers = [];
      mapping.innerHTML = '';
      return;
    }

    const text = await file.text();
    const rows = parseCsvText(text).filter(row => row.some(cell => String(cell || '').trim()));

    if (!rows.length) {
      csvState.rows = [];
      csvState.headers = [];
      mapping.innerHTML = '';
      return;
    }

    const headerEnabled = hasHeaders.checked;
    const firstRow = rows[0] || [];
    const headers = headerEnabled
      ? firstRow.map((value, idx) => String(value || '').trim() || `${tr('Columna', 'Column')} ${idx + 1}`)
      : firstRow.map((_value, idx) => `${tr('Columna', 'Column')} ${idx + 1}`);

    const dataRows = headerEnabled ? rows.slice(1) : rows;
    csvState.headers = headers;
    csvState.rows = dataRows;

    if (!dataRows.length) {
      mapping.innerHTML = '';
      return;
    }

    const bodyRows = headers.map((header, idx) => {
      const samples = dataRows.slice(0, 8).map(row => row[idx]).filter(Boolean);
      const guessedType = guessCsvPropertyType(samples);
      const typeOptions = availableTypes.map(type => `<option value="${type.value}" ${type.value === guessedType ? 'selected' : ''}>${escapeHtml(typeLabel(type))}</option>`).join('');
      return `
        <div class="csv-map-row" data-index="${idx}" data-name="${escapeHtml(header)}">
          <label class="checkbox-row csv-include-cell"><input type="checkbox" data-role="include" checked /> ${escapeHtml(tr('Importar', 'Import'))}</label>
          <div class="csv-col-name">${escapeHtml(header)}</div>
          <select data-role="type">${typeOptions}</select>
        </div>
      `;
    }).join('');

    mapping.innerHTML = `
      <div class="csv-map-head">
        <div>${escapeHtml(tr('Incluir', 'Include'))}</div>
        <div>${escapeHtml(tr('Cabecera CSV', 'CSV header'))}</div>
        <div>${escapeHtml(tr('Tipo de propiedad', 'Property type'))}</div>
      </div>
      ${bodyRows}
    `;
  }

  fileInput.addEventListener('change', detectCsv);
  hasHeaders.addEventListener('change', detectCsv);
}

function parseCsvText(input) {
  const text = String(input || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      row.push(value.trim());
      value = '';
      continue;
    }

    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      rows.push(row);
      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows;
}

function parseCsvCellByType(raw, type) {
  const value = String(raw ?? '').trim();
  if (!value) {
    if (type === 'checkbox') return false;
    if (type === 'multiSelect') return [];
    return null;
  }

  if (type === 'checkbox') {
    return ['1', 'true', 'sí', 'si', 'yes', 'y', 'x'].includes(value.toLowerCase());
  }

  if (type === 'multiSelect') {
    return value.split(/[;,|]/).map(item => item.trim()).filter(Boolean);
  }

  return value;
}

function collectDistinctCsvValues(rows, index, type) {
  const set = new Set();

  rows.forEach(row => {
    const value = parseCsvCellByType(row[index], type);
    if (Array.isArray(value)) {
      value.forEach(item => item && set.add(String(item)));
      return;
    }
    if (value === null || value === false || value === '') return;
    set.add(String(value));
  });

  return [...set].slice(0, 60);
}

function guessCsvPropertyType(samples) {
  const values = (samples || []).map(item => String(item || '').trim()).filter(Boolean);
  if (!values.length) return 'text';

  const lower = values.map(item => item.toLowerCase());
  if (lower.every(item => ['1', '0', 'true', 'false', 'sí', 'si', 'no', 'yes', 'y', 'n', 'x'].includes(item))) return 'checkbox';
  if (values.every(item => /^https?:\/\//i.test(item))) return 'url';
  if (values.every(item => /^\d{4}-\d{2}-\d{2}$/.test(item))) return 'date';
  if (values.every(item => /^\d{2}:\d{2}(:\d{2})?$/.test(item))) return 'time';
  if (values.some(item => /[;,|]/.test(item))) return 'multiSelect';

  return 'text';
}

function renderSelectOptionsEditor(prefix = 'option') {
  const presetRows = BASIC_TAG_COLOR_PALETTE
    .map(item => `<option value="${item.name}">${colorLabel(item)}</option>`)
    .join('');
  return `
    <div id="${prefix}Options"></div>
    <button type="button" class="btn option-add-btn" id="${prefix}Add" aria-label="${escapeHtml(tr('Añadir opción', 'Add option'))}">+</button>
    <template id="${prefix}Template">
      <div class="columns-3">
        <label>${escapeHtml(tr('Etiqueta', 'Tag'))}<input data-role="label" /></label>
        <label>${escapeHtml(tr('Color', 'Color'))}
          <div class="option-color-controls">
            <input type="color" data-role="color-picker" value="#e3e2e0" />
            <select data-role="color-preset">${presetRows}</select>
          </div>
        </label>
        <div style="display:flex;align-items:flex-end;"><button type="button" class="btn" data-role="remove">${escapeHtml(tr('Quitar', 'Remove'))}</button></div>
      </div>
    </template>
  `;
}

function mountOptionsEditor(prefix = 'option', existing = []) {
  const container = document.getElementById(`${prefix}Options`);
  const tpl = document.getElementById(`${prefix}Template`);

  function addRow(item = {}) {
    const frag = tpl.content.cloneNode(true);
    const row = frag.querySelector('.columns-3');
    row.querySelector('[data-role="label"]').value = item.label || '';

    const colorPicker = row.querySelector('[data-role="color-picker"]');
    const colorPreset = row.querySelector('[data-role="color-preset"]');
    const initialName = String(item.color || 'gray').toLowerCase();
    const initialHex = COLOR_HEX_BY_NAME[initialName] || '#e3e2e0';
    colorPreset.value = BASIC_TAG_COLOR_PALETTE.some(entry => entry.name === initialName) ? initialName : nearestTagColorName(initialHex);
    colorPicker.value = normalizeHexColor(initialHex);

    colorPreset.addEventListener('change', () => {
      colorPicker.value = COLOR_HEX_BY_NAME[colorPreset.value] || '#e3e2e0';
    });

    colorPicker.addEventListener('input', () => {
      colorPreset.value = nearestTagColorName(colorPicker.value);
    });

    row.querySelector('[data-role="remove"]').addEventListener('click', () => row.remove());
    container.appendChild(row);
  }

  document.getElementById(`${prefix}Add`).addEventListener('click', () => addRow());
  existing.forEach(item => addRow(item));
  if (!existing.length) addRow();
}

function collectOptions(prefix = 'option') {
  const rows = [...document.querySelectorAll(`#${prefix}Options .columns-3`)];
  return rows
    .map(row => ({
      label: row.querySelector('[data-role="label"]').value.trim(),
      color: row.querySelector('[data-role="color-preset"]').value || nearestTagColorName(row.querySelector('[data-role="color-picker"]').value),
    }))
    .filter(item => item.label);
}

function openCreatePropertyModal() {
  if (!STATE.selectedDatabase) return;

  const dbOptions = STATE.databases.map(db => `<option value="${db.id}">${escapeHtml(db.name)}</option>`).join('');
  const relationPropertyOptions = STATE.selectedDatabase.properties
    .filter(prop => prop.type === 'relation')
    .map(prop => `<option value="${prop.id}">${escapeHtml(prop.name)}</option>`)
    .join('');
  const rollupCalculations = [
    { value: 'showOriginal', label: tr('Mostrar original', 'Show original') },
    { value: 'countAll', label: tr('Contar todo', 'Count all') },
    { value: 'countValues', label: tr('Contar valores no vacíos', 'Count non-empty values') },
    { value: 'countUniqueValues', label: tr('Contar valores únicos', 'Count unique values') },
    { value: 'sum', label: tr('Suma (numérico)', 'Sum (numeric)') },
    { value: 'avg', label: tr('Promedio (numérico)', 'Average (numeric)') },
    { value: 'min', label: tr('Mínimo (numérico)', 'Minimum (numeric)') },
    { value: 'max', label: tr('Máximo (numérico)', 'Maximum (numeric)') },
  ];

  openModal({
    title: tr('Nueva propiedad', 'New property'),
    content: `
      <div class="columns-2">
        <label>${escapeHtml(tr('Nombre', 'Name'))}<input id="propertyName" /></label>
        <label>${escapeHtml(tr('Tipo', 'Type'))}<select id="propertyType">${PROPERTY_TYPES.map(p => `<option value="${p.value}">${escapeHtml(typeLabel(p))}</option>`).join('')}</select></label>
      </div>
      <label class="checkbox-row"><input type="checkbox" id="propertyVisible" checked /> ${escapeHtml(tr('Visible en tabla/galería', 'Visible in table/gallery'))}</label>

      <div id="selectConfig" class="hidden">
        <h4>${escapeHtml(tr('Opciones de etiqueta y color', 'Tag and color options'))}</h4>
        ${renderSelectOptionsEditor('property')}
      </div>

      <div id="relationConfig" class="hidden">
        <h4>${escapeHtml(tr('Relaciones', 'Relations'))}</h4>
        <label>${escapeHtml(tr('Base de datos relacionada', 'Related database'))}
          <select id="relatedDatabase"><option value="">${escapeHtml(tr('Selecciona...', 'Select...'))}</option>${dbOptions}</select>
        </label>
        <label class="checkbox-row"><input type="checkbox" id="relationTwoWay" checked /> ${escapeHtml(tr('Mostrar también en la base relacionada (bidireccional)', 'Also show in related database (bidirectional)'))}</label>
        <label>${escapeHtml(tr('Nombre en la base relacionada', 'Name in related database'))}<input id="relationTwoWayName" placeholder="${escapeHtml(tr('Ej.', 'e.g.'))} ${escapeHtml(STATE.selectedDatabase.name)}" /></label>
      </div>

      <div id="rollupConfig" class="hidden">
        <h4>${escapeHtml(tr('Configurar rollup (solo lectura)', 'Configure rollup (read only)'))}</h4>
        <div class="columns-2">
          <label>${escapeHtml(tr('Propiedad relación', 'Relation property'))}<select id="rollupRelationProperty"><option value="">${escapeHtml(tr('Selecciona...', 'Select...'))}</option>${relationPropertyOptions}</select></label>
          <label>${escapeHtml(tr('Propiedad origen', 'Source property'))}<select id="rollupRelatedProperty"><option value="">${escapeHtml(tr('Selecciona una relación...', 'Select a relation...'))}</option></select></label>
        </div>
        <label>${escapeHtml(tr('Cálculo', 'Calculation'))}
          <select id="rollupCalculate">${rollupCalculations.map(item => `<option value="${item.value}">${item.label}</option>`).join('')}</select>
        </label>
      </div>
    `,
    onSubmit: async () => {
      const name = document.getElementById('propertyName').value.trim();
      const type = document.getElementById('propertyType').value;
      const isVisible = document.getElementById('propertyVisible').checked;

      if (!name) {
        openConfirmMini({
          message: tr('Indica un nombre para la propiedad.', 'Enter a property name.'),
          confirmText: 'OK',
        });
        document.getElementById('propertyName')?.focus();
        return true;
      }

      const config = {};
      if (type === 'singleSelect' || type === 'multiSelect') {
        config.options = collectOptions('property');
      }

      if (type === 'relation') {
        const relatedDatabaseId = Number(document.getElementById('relatedDatabase').value || 0) || null;
        config.relatedDatabaseId = relatedDatabaseId;
        config.relatedDatabaseIds = relatedDatabaseId ? [relatedDatabaseId] : [];
        config.showOnRelatedDatabase = document.getElementById('relationTwoWay').checked;
        config.reciprocalPropertyName = document.getElementById('relationTwoWayName').value.trim() || null;
      }

      if (type === 'rollup') {
        config.relationPropertyId = Number(document.getElementById('rollupRelationProperty').value || 0) || null;
        config.relatedPropertyId = Number(document.getElementById('rollupRelatedProperty').value || 0) || null;
        config.calculate = document.getElementById('rollupCalculate').value || 'showOriginal';
      }

      await api(`/api/databases/${STATE.selectedDatabaseId}/properties`, {
        method: 'POST',
        body: { name, type, isVisible, config },
      });

      STATE.selectedDatabase = await api(`/api/databases/${STATE.selectedDatabaseId}`);
      renderViewTabs();
      await loadRecords();
      return false;
    },
  });

  mountOptionsEditor('property', []);

  const typeSelect = document.getElementById('propertyType');
  const selectConfig = document.getElementById('selectConfig');
  const relationConfig = document.getElementById('relationConfig');
  const rollupConfig = document.getElementById('rollupConfig');
  const rollupRelationProperty = document.getElementById('rollupRelationProperty');
  const rollupRelatedProperty = document.getElementById('rollupRelatedProperty');

  async function refreshRollupRelatedProperties() {
    const relationPropertyId = Number(rollupRelationProperty.value || 0);
    if (!relationPropertyId) {
      rollupRelatedProperty.innerHTML = `<option value="">${escapeHtml(tr('Selecciona una relación...', 'Select a relation...'))}</option>`;
      return;
    }

    const relatedProps = await api(`/api/properties/${relationPropertyId}/related-properties`);
    const options = relatedProps
      .filter(prop => prop.type !== 'relation' || prop.id !== relationPropertyId)
      .map(prop => `<option value="${prop.id}">${escapeHtml(prop.name)} (${escapeHtml(prop.type)})</option>`)
      .join('');

    rollupRelatedProperty.innerHTML = `<option value="">${escapeHtml(tr('Selecciona...', 'Select...'))}</option>${options}`;
  }

  function refreshTypeConfig() {
    const type = typeSelect.value;
    selectConfig.classList.toggle('hidden', !(type === 'singleSelect' || type === 'multiSelect'));
    relationConfig.classList.toggle('hidden', type !== 'relation');
    rollupConfig.classList.toggle('hidden', type !== 'rollup');
  }

  typeSelect.addEventListener('change', refreshTypeConfig);
  rollupRelationProperty.addEventListener('change', refreshRollupRelatedProperties);
  refreshTypeConfig();
  refreshRollupRelatedProperties();
}

function openDatabaseSettingsModal() {
  if (!STATE.selectedDatabase) return;

  const folderOptions = [`<option value="">${escapeHtml(tr('(Sin carpeta)', '(No folder)'))}</option>`]
    .concat(STATE.folders.map(folder => `<option value="${folder.id}" ${folder.id === STATE.selectedDatabase.folder_id ? 'selected' : ''}>${escapeHtml(folder.name)}</option>`))
    .join('');

  const rows = STATE.selectedDatabase.properties.map(prop => `
    <div class="config-row" data-property-id="${prop.id}">
      <input value="${escapeHtml(prop.name)}" data-role="name" />
      <label class="checkbox-row"><input type="checkbox" data-role="visible" ${prop.is_visible ? 'checked' : ''}/> ${escapeHtml(tr('Visible', 'Visible'))}</label>
      <button class="btn btn-danger" data-role="delete">${escapeHtml(tr('Eliminar', 'Delete'))}</button>
    </div>
  `).join('');

  openModal({
    title: tr('Configuración de la base de datos', 'Database settings'),
    submitText: tr('Guardar cambios', 'Save changes'),
    content: `
      <label>${escapeHtml(tr('Título de la base de datos', 'Database title'))}<input id="settingsDbName" value="${escapeHtml(STATE.selectedDatabase.name)}" /></label>
      <label>${escapeHtml(tr('Carpeta', 'Folder'))}<select id="settingsFolder">${folderOptions}</select></label>
      <label>${escapeHtml(tr('Degradado cabecera (si no hay imagen)', 'Header gradient (if no image)'))}
        <textarea id="settingsGradient" rows="2">${escapeHtml(STATE.selectedDatabase.header_gradient || '')}</textarea>
      </label>
      <div class="config-list" id="settingsProperties">${rows}</div>
      <div style="display:flex;gap:8px;">
        <button type="button" class="btn" id="btnRemoveHeader">${escapeHtml(tr('Quitar imagen de cabecera', 'Remove header image'))}</button>
        <button type="button" class="btn btn-danger" id="btnDeleteDatabase">${escapeHtml(tr('Eliminar base de datos', 'Delete database'))}</button>
      </div>
    `,
    onSubmit: async () => {
      const name = document.getElementById('settingsDbName').value.trim();
      const folderId = Number(document.getElementById('settingsFolder').value || 0) || null;
      const headerGradient = document.getElementById('settingsGradient').value.trim();

      if (!name) return true;

      const propertyUpdates = [];
      const rowsProps = [...document.querySelectorAll('#settingsProperties .config-row')];

      rowsProps.forEach(row => {
        const propertyId = Number(row.dataset.propertyId);
        const propName = row.querySelector('[data-role="name"]').value.trim();
        const visible = row.querySelector('[data-role="visible"]').checked;
        const originalName = String(row.dataset.originalName || '').trim();
        const originalVisible = row.dataset.originalVisible === '1';
        if (propName !== originalName || visible !== originalVisible) {
          propertyUpdates.push({ propertyId, name: propName, visible });
        }
      });

      await api(`/api/databases/${STATE.selectedDatabaseId}/settings`, {
        method: 'PUT',
        body: { name, folderId, headerGradient, propertyUpdates },
      });

      await refreshBootstrap();
      STATE.selectedDatabase = await api(`/api/databases/${STATE.selectedDatabaseId}`);
      renderDatabaseHeader();
      renderViewTabs();
      await loadRecords();
      return false;
    },
  });

  [...document.querySelectorAll('[data-role="delete"]')].forEach(button => {
    button.addEventListener('click', async (event) => {
      const row = event.target.closest('.config-row');
      const propertyId = Number(row.dataset.propertyId);
      openConfirmMini({
        message: tr('¿Eliminar propiedad?', 'Delete property?'),
        confirmText: tr('Eliminar', 'Delete'),
        danger: true,
        onConfirm: async () => {
          await api(`/api/properties/${propertyId}`, { method: 'DELETE' });
          row.remove();
        },
      });
    });
  });

  document.getElementById('btnRemoveHeader').addEventListener('click', async () => {
    await api(`/api/databases/${STATE.selectedDatabaseId}/header-image`, { method: 'DELETE' });
    STATE.selectedDatabase = await api(`/api/databases/${STATE.selectedDatabaseId}`);
    renderDatabaseHeader();
    document.getElementById('settingsGradient').value = STATE.selectedDatabase.header_gradient || '';
  });

  document.getElementById('btnDeleteDatabase').addEventListener('click', async () => {
    openConfirmMini({
      message: tr('¿Eliminar base de datos completa? Esta acción no se puede deshacer.', 'Delete full database? This action cannot be undone.'),
      confirmText: tr('Eliminar', 'Delete'),
      danger: true,
      onConfirm: async () => {
        const deleteBtn = document.getElementById('btnDeleteDatabase');
        const previousLabel = deleteBtn?.textContent || tr('Eliminar base de datos', 'Delete database');
        if (deleteBtn) {
          deleteBtn.disabled = true;
          deleteBtn.classList.add('is-loading');
          deleteBtn.textContent = tr('Eliminando…', 'Deleting…');
        }

        try {
          await api(`/api/databases/${STATE.selectedDatabaseId}`, { method: 'DELETE' });
          const modal = document.getElementById('modal');
          if (modal.open) modal.close();
          STATE.selectedDatabaseId = null;
          STATE.selectedDatabase = null;
          document.getElementById('databaseState').classList.add('hidden');
          document.getElementById('homeState').classList.remove('hidden');
          await refreshBootstrap();
          renderSidebar();
        } finally {
          if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.classList.remove('is-loading');
            deleteBtn.textContent = previousLabel;
          }
        }
      },
    });
  });

  [...document.querySelectorAll('#settingsProperties .config-row')].forEach(row => {
    const nameInput = row.querySelector('[data-role="name"]');
    const visibleInput = row.querySelector('[data-role="visible"]');
    row.dataset.originalName = String(nameInput?.value || '').trim();
    row.dataset.originalVisible = visibleInput?.checked ? '1' : '0';
  });
}

function openCreateViewModal() {
  if (!STATE.selectedDatabase) return;

  openModal({
    title: tr('Nueva vista', 'New view'),
    content: `
      <div class="columns-2">
        <label>${escapeHtml(tr('Nombre', 'Name'))}<input id="viewName" /></label>
        <label>${escapeHtml(tr('Tipo', 'Type'))}
          <select id="viewType">
            <option value="table">${escapeHtml(tr('Tabla', 'Table'))}</option>
            <option value="gallery">${escapeHtml(tr('Galería', 'Gallery'))}</option>
            <option value="analysis">${escapeHtml(tr('Análisis', 'Analysis'))}</option>
          </select>
        </label>
      </div>
    `,
    onSubmit: async () => {
      const name = document.getElementById('viewName').value.trim();
      const type = document.getElementById('viewType').value;
      if (!name) return true;
      await api(`/api/databases/${STATE.selectedDatabaseId}/views`, {
        method: 'POST',
        body: { name, type, config: {} },
      });
      STATE.selectedDatabase = await api(`/api/databases/${STATE.selectedDatabaseId}`);
      STATE.activeViewId = STATE.selectedDatabase.views[STATE.selectedDatabase.views.length - 1]?.id || STATE.activeViewId;
      renderViewTabs();
      renderActiveView();
      return false;
    },
  });
}

async function openRecordModal(existingRecord) {
  const isEditing = Boolean(existingRecord);
  const props = STATE.selectedDatabase.properties;
  const dbId = STATE.selectedDatabaseId;
  const orderedProps = [...props].sort((a, b) => {
    const ap = Number(a?.position ?? 0);
    const bp = Number(b?.position ?? 0);
    if (ap !== bp) return ap - bp;
    return Number(a?.id || 0) - Number(b?.id || 0);
  });

  /* ── Build property rows ── */
  const rows = [];
  for (const prop of orderedProps) {
    let fieldHtml = '';

    if (prop.type === 'rollup') {
      const value = isEditing ? (existingRecord.values[prop.key] || []) : [];
      fieldHtml = `<input disabled value="${escapeHtml(Array.isArray(value) ? value.join(', ') : String(value || ''))}" />`;
    } else if (prop.type === 'checkbox') {
      const current = isEditing ? existingRecord.values[prop.key] : false;
      fieldHtml = `<div class="record-field-checkbox"><input type="checkbox" id="field-${prop.id}" ${current ? 'checked' : ''} /></div>`;
    } else if (prop.type === 'singleSelect') {
      const current = isEditing ? existingRecord.values[prop.key] : null;
      const orderedOptions = sortSelectOptions(prop.config?.options || [], prop.config?.optionSort || 'manual');
      const options = orderedOptions.map(opt => `<option value="${escapeHtml(opt.label)}" ${current === opt.label ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('');
      fieldHtml = `<select id="field-${prop.id}"><option value="">${escapeHtml(tr('(vacío)', '(empty)'))}</option>${options}</select>`;
    } else if (prop.type === 'multiSelect') {
      const current = isEditing ? existingRecord.values[prop.key] : [];
      const selected = new Set(Array.isArray(current) ? current : []);
      const orderedOptions = sortSelectOptions(prop.config?.options || [], prop.config?.optionSort || 'manual');
      const options = orderedOptions.map(opt => `<option value="${escapeHtml(opt.label)}" ${selected.has(opt.label) ? 'selected' : ''}>${escapeHtml(opt.label)}</option>`).join('');
      fieldHtml = `<select id="field-${prop.id}" multiple size="4">${options}</select>`;
    } else if (prop.type === 'relation') {
      const current = isEditing ? existingRecord.values[prop.key] : [];
      const relatedDbIds = prop.config?.relatedDatabaseIds?.length
        ? prop.config.relatedDatabaseIds
        : (prop.config?.relatedDatabaseId ? [prop.config.relatedDatabaseId] : []);
      const selectedIds = new Set(Array.isArray(current) ? current.map(Number) : []);
      const selectedIdsQuery = [...selectedIds].join(',');
      let options = '';
      for (const relDbId of relatedDbIds) {
        const relRows = await api(`/api/databases/${relDbId}/record-options?all=1&includeIds=${encodeURIComponent(selectedIdsQuery)}`);
        const dbName = STATE.databases.find(item => item.id === relDbId)?.name || `${tr('BD', 'DB')} ${relDbId}`;
        options += `<optgroup label="${escapeHtml(dbName)}">${relRows.map(row => `<option value="${row.id}" ${selectedIds.has(row.id) ? 'selected' : ''}>${escapeHtml(row.label)} (ID ${row.id})</option>`).join('')}</optgroup>`;
      }
      fieldHtml = `<select id="field-${prop.id}" multiple size="5">${options}</select>`;
    } else if (prop.type === 'autoId') {
      const current = isEditing ? existingRecord.values[prop.key] : null;
      fieldHtml = `<input disabled value="${escapeHtml(String(current ?? tr('(autogenerado)', '(auto-generated)')))}" />`;
    } else if (prop.type === 'attachment') {
      const current = isEditing ? existingRecord.values[prop.key] : [];
      const files = Array.isArray(current) ? current : [];
      const hasFiles = files.length > 0;
      const fileListHtml = hasFiles
        ? files.map(url => {
            const name = attachmentFileName(url);
            const isImg = isImageAttachment(url);
            const previewHtml = isImg
              ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" class="record-attachment-thumb" data-preview-url="${escapeHtml(url)}" data-preview-name="${escapeHtml(name)}" />`
              : `<span class="record-attachment-doc">${attachmentIconForUrl(url)} ${escapeHtml(name)}</span>`;
            return `<div class="record-attachment-item attachment-thumb-wrap">
              ${previewHtml}
              ${isEditing ? `<button type="button" class="attachment-delete-btn" data-delete-url="${escapeHtml(url)}" title="${escapeHtml(t('deleteAttachment'))}" aria-label="${escapeHtml(t('deleteAttachment'))}">×</button>` : ''}
            </div>`;
          }).join('')
        : `<span class="count">${escapeHtml(tr('Sin adjuntos', 'No attachments'))}</span>`;
      const uploadHtml = isEditing && !hasFiles
        ? `<div class="record-attachment-upload"><input id="upload-${prop.id}" type="file" /><button type="button" class="btn" data-upload-prop="${prop.id}">${escapeHtml(tr('Subir', 'Upload'))}</button><span class="attachment-upload-spinner record-attachment-spinner" aria-hidden="true"></span></div>`
        : (!isEditing ? `<span class="count">${escapeHtml(tr('Guarda el registro para adjuntar archivos.', 'Save the record to attach files.'))}</span>` : '');
      fieldHtml = `<div class="record-attachment-zone">${fileListHtml}${uploadHtml}</div>`;
    } else {
      const current = isEditing ? existingRecord.values[prop.key] : '';
      const type = prop.type === 'date' ? 'date' : (prop.type === 'time' ? 'time' : (prop.type === 'url' ? 'url' : 'text'));
      fieldHtml = `<input id="field-${prop.id}" type="${type}" value="${escapeHtml(String(current || ''))}" />`;
    }

    rows.push(`<div class="record-prop-row" draggable="true" data-prop-id="${prop.id}">
      <span class="record-prop-drag" title="${escapeHtml(tr('Arrastrar para reordenar', 'Drag to reorder'))}">⠿</span>
      <span class="record-prop-label">${escapeHtml(prop.name)}</span>
      <div class="record-prop-value">${fieldHtml}</div>
    </div>`);
  }

  const content = `<div class="record-detail">${rows.join('')}</div>`;

  openModal({
    title: isEditing ? `${tr('Editar registro', 'Edit record')} #${existingRecord.id}` : tr('Nuevo registro', 'New record'),
    submitText: isEditing ? tr('Guardar cambios', 'Save changes') : tr('Crear registro', 'Create record'),
    content,
    onSubmit: async (modal) => {
      const values = {};

      props.forEach(prop => {
        const field = modal.querySelector(`#field-${prop.id}`);
        if (!field || prop.type === 'rollup' || prop.type === 'attachment' || prop.type === 'autoId') return;

        if (prop.type === 'checkbox') {
          values[prop.key] = field.checked;
        } else if (prop.type === 'multiSelect' || prop.type === 'relation') {
          values[prop.key] = [...field.selectedOptions].map(option => prop.type === 'relation' ? Number(option.value) : option.value);
        } else {
          values[prop.key] = field.value || null;
        }
      });

      if (isEditing) {
        await api(`/api/records/${existingRecord.id}`, { method: 'PUT', body: { values } });
      } else {
        await api(`/api/databases/${STATE.selectedDatabaseId}/records`, { method: 'POST', body: { values } });
      }

      await loadRecords();
      await refreshBootstrap();
      return false;
    },
    width: '720px',
  });

  /* ── Drag-and-drop reordering ── */
  const detail = document.querySelector('.record-detail');
  if (detail) {
    let draggedRow = null;

    detail.addEventListener('dragstart', (e) => {
      const row = e.target.closest('.record-prop-row');
      if (!row) return;
      draggedRow = row;
      row.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    detail.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const row = e.target.closest('.record-prop-row');
      if (!row || row === draggedRow) return;
      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        detail.insertBefore(draggedRow, row);
      } else {
        detail.insertBefore(draggedRow, row.nextSibling);
      }
    });

    detail.addEventListener('dragend', async () => {
      if (draggedRow) draggedRow.classList.remove('is-dragging');
      draggedRow = null;

      const propertyIds = [...detail.querySelectorAll('.record-prop-row')].map(r => Number(r.dataset.propId));
      if (!propertyIds.length) return;

      try {
        await api(`/api/databases/${dbId}/properties/order`, {
          method: 'PUT',
          body: { propertyIds },
        });

        const currentById = new Map(STATE.selectedDatabase.properties.map(prop => [prop.id, prop]));
        const reordered = propertyIds.map(id => currentById.get(id)).filter(Boolean);
        const used = new Set(reordered.map(prop => prop.id));
        const missing = STATE.selectedDatabase.properties.filter(prop => !used.has(prop.id));
        STATE.selectedDatabase.properties = [...reordered, ...missing].map((prop, index) => ({
          ...prop,
          position: index,
        }));
      } catch (error) {
        console.error('No se pudo persistir el orden de propiedades', error);
      }
    });
  }

  /* ── Attachment preview handlers in record modal ── */
  [...document.querySelectorAll('.record-attachment-thumb[data-preview-url]')].forEach(thumb => {
    thumb.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const fileUrl = thumb.getAttribute('data-preview-url') || '';
      const fileName = thumb.getAttribute('data-preview-name') || '';
      if (!fileUrl) return;
      openImagePreviewModal(fileUrl, fileName);
    });
  });

  /* ── Attachment upload handlers ── */
  if (isEditing) {
    [...document.querySelectorAll('[data-upload-prop]')].forEach(button => {
      button.addEventListener('click', async () => {
        const propId = Number(button.getAttribute('data-upload-prop'));
        const input = document.getElementById(`upload-${propId}`);
        const file = input.files[0];
        if (!file) return;

        const uploadWrap = button.closest('.record-attachment-upload');
        uploadWrap?.classList.add('is-uploading');
        button.disabled = true;

        const form = new FormData();
        form.append('file', file);
        try {
          await fetch(`/api/records/${existingRecord.id}/attachments/${propId}`, { method: 'POST', body: form });
          await loadRecords();
          const freshRecord = STATE.records.find(record => record.id === existingRecord.id) || existingRecord;
          document.getElementById('modal').close();
          openRecordModal(freshRecord);
        } finally {
          uploadWrap?.classList.remove('is-uploading');
          button.disabled = false;
        }
      });
    });

    /* ── Attachment delete handlers in record modal ── */
    [...document.querySelectorAll('[data-delete-url]')].forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-delete-url');
        openConfirmMini({
          message: t('deleteAttachmentConfirm'),
          confirmText: t('deleteAttachment'),
          danger: true,
          onConfirm: async () => {
            await api('/api/attachments-by-url', { method: 'DELETE', body: { url } });
            await loadRecords();
            await refreshBootstrap();
            const freshRecord = STATE.records.find(record => record.id === existingRecord.id) || existingRecord;
            openRecordModal(freshRecord);
          },
        });
      });
    });
  }
}

function openAddFilterModal() {
  openAdvancedCriteriaModal({ focus: 'filter' });
}

async function uploadHeaderImage(event) {
  const file = event.target.files[0];
  if (!file || !STATE.selectedDatabaseId) return;

  const form = new FormData();
  form.append('image', file);
  await fetch(`/api/databases/${STATE.selectedDatabaseId}/header-image`, {
    method: 'POST',
    body: form,
  });

  STATE.selectedDatabase = await api(`/api/databases/${STATE.selectedDatabaseId}`);
  renderDatabaseHeader();
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload.error || tr('Error de servidor', 'Server error');
    openConfirmMini({ message, confirmText: 'OK' });
    throw new Error(message);
  }

  return payload;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
