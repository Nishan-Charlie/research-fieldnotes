'use strict';
(() => {
  const destination = 'https://research-fieldnotes.nishannishankar.chatgpt.site/';
  const target = destination + location.hash;
  let hasProgress = true;
  try {
    const raw = localStorage.getItem('nishankar-fieldnotes-v1');
    const saved = raw ? JSON.parse(raw) : {};
    hasProgress = Boolean(saved.savedAt || Object.keys(saved.leads || {}).length ||
      (saved.custom || []).length || Object.keys(saved.tasks || {}).length);
  } catch { /* Keep the old workspace accessible if storage cannot be read. */ }
  if (!hasProgress) {
    location.replace(target);
    return;
  }
  const notice = document.createElement('section');
  notice.className = 'cloud-move';
  notice.setAttribute('aria-label', 'Move to the synced website');
  notice.innerHTML = '<div><h2>Your synced workspace is ready</h2><p>This browser has saved progress. Export a backup, then sign in on the new page and choose <strong>Import backup</strong>. Your original browser copy stays here.</p><p class="cloud-move-status" role="status"></p></div><div class="cloud-move-actions"><button class="button primary" type="button" data-transfer-export>1. Export backup</button><a class="button" data-transfer-open>2. Open synced page ↗</a><button class="button quiet" type="button" data-transfer-stay>Stay here for now</button></div>';
  notice.querySelector('[data-transfer-open]').href = target;
  notice.querySelector('[data-transfer-export]').addEventListener('click', () => {
    backup();
    notice.querySelector('.cloud-move-status').textContent = 'Backup requested. Check your Downloads folder before opening the synced page. Keep this file private.';
  });
  notice.querySelector('[data-transfer-stay]').addEventListener('click', () => {
    notice.remove();
    document.body.classList.remove('has-cloud-move');
  });
  document.body.classList.add('has-cloud-move');
  document.body.append(notice);
})();
