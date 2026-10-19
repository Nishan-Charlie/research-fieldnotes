'use strict';
let universityFilter = 'all';
function universityProgress(record) { return state.leads[record.id] || {}; }
function universityTracker() {
  const query = $('global-search').value.trim().toLowerCase();
  const records = window.UNIVERSITY_PLAN;
  const selected = records.filter(record => {
    const progress = universityProgress(record);
    return (!query || `${record.name} ${record.country} ${progress.programme || record.programme}`.toLowerCase().includes(query)) &&
      (universityFilter === 'all' || universityFilter === 'accounts' && progress.accountCreated ||
      universityFilter === 'submitted' && progress.applicationSubmitted ||
      universityFilter === 'pending' && !progress.applicationSubmitted ||
      universityFilter === 'original' && record.source === 'Your spreadsheet' ||
      universityFilter === 'added' && record.source !== 'Your spreadsheet');
  });
  const accountCount = records.filter(record => universityProgress(record).accountCreated).length;
  const submittedCount = records.filter(record => universityProgress(record).applicationSubmitted).length;
  return heading('University applications', 'Track portal accounts and submissions separately for your Fall 2027 applications.', 'YOUR APPLICATION LIST', '<button class="button" data-university-export>Export application list ↓</button>') +
    `<div class="university-summary"><div><strong>${records.length}</strong><span>Universities</span></div><div><strong>${accountCount}</strong><span>Accounts marked created</span></div><div><strong>${submittedCount}</strong><span>Applications marked submitted</span></div></div>
    <p class="data-status">Your spreadsheet list was imported on 19 October 2026. Additional research universities are suggestions, not a ranking or confirmed vacancies. Unchecked means not yet marked. Your updates save in this browser and are included in Export backup.</p>
    <div class="university-toolbar"><label>Show<select id="university-filter">${[['all','All universities'],['accounts','Account created'],['submitted','Application submitted'],['pending','Not marked submitted'],['original','From your spreadsheet'],['added','Additional universities']].map(([value,label]) => `<option value="${value}" ${universityFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><span>${selected.length} ${selected.length === 1 ? 'university' : 'universities'} · use the search above to find a university</span></div>
    <div class="university-table-wrap"><table class="university-table"><thead><tr><th>University / programme</th><th>Account created</th><th>Application submitted</th><th>Notes</th></tr></thead><tbody>${selected.map(record => {
      const progress = universityProgress(record);
      const input = (field, type, label, value) => `<input type="${type}" data-university-id="${record.id}" data-university-field="${field}" aria-label="${esc(label + ' — ' + record.name)}" ${type === 'checkbox' ? value ? 'checked' : '' : `value="${esc(value || '')}"`}>`;
      return `<tr><td><strong>${esc(record.name)}</strong><div class="small muted">${esc(record.country)} · ${esc(record.source)}</div>${localTimeMarkup({university:record.name,country:record.country,timeZone:record.timeZone})}<label class="university-programme">Programme${input('programme','text','Programme',progress.programme ?? record.programme)}</label>${safeUrl(record.portal) ? `<a href="${safeUrl(record.portal)}" target="_blank" rel="noopener noreferrer">Application link from sheet ↗</a>` : ''}${record.sheetStatus ? `<p class="small muted">Original sheet note: ${esc(record.sheetStatus)}</p>` : ''}</td><td><label class="university-check">${input('accountCreated','checkbox','Account created',progress.accountCreated)}<span>Created</span></label><label class="small">Date created${input('accountDate','date','Account creation date',progress.accountDate)}</label></td><td><label class="university-check">${input('applicationSubmitted','checkbox','Application submitted',progress.applicationSubmitted)}<span>Submitted</span></label><label class="small">Date submitted${input('submittedDate','date','Submission date',progress.submittedDate)}</label></td><td><textarea rows="3" data-university-id="${record.id}" data-university-field="applicationNotes" aria-label="Notes — ${esc(record.name)}" placeholder="Supervisor, fee waiver, documents or next step…">${esc(progress.applicationNotes || '')}</textarea></td></tr>`;
    }).join('')}</tbody></table>${!selected.length ? '<p class="muted">No universities match this filter.</p>' : ''}</div>`;
}
document.addEventListener('change', event => {
  if (event.target.id === 'university-filter') { universityFilter = event.target.value; render(); return; }
  const {universityId, universityField} = event.target.dataset;
  if (!universityId || !universityField) return;
  setTrack(universityId, universityField, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
  if (event.target.type === 'checkbox') render();
});
document.addEventListener('input', event => {
  const {universityId, universityField} = event.target.dataset;
  if (universityId && ['programme','applicationNotes'].includes(universityField)) setTrack(universityId, universityField, event.target.value);
});
document.addEventListener('click', event => {
  if (!event.target.closest('[data-university-export]')) return;
  const rows = [['University','Country','Source','Programme','Account created','Account creation date','Application submitted','Submission date','Notes','Application link','Original sheet status'], ...window.UNIVERSITY_PLAN.map(record => {
    const progress = universityProgress(record);
    return [record.name,record.country,record.source,progress.programme ?? record.programme,progress.accountCreated ? 'Yes' : 'Not marked',progress.accountDate || '',progress.applicationSubmitted ? 'Yes' : 'Not marked',progress.submittedDate || '',progress.applicationNotes || '',record.portal,record.sheetStatus];
  })];
  const quote = value => '"' + String(value ?? '').replace(/^[=+@-]/,"'$&").replaceAll('"','""') + '"';
  exportFile(`university-applications-${today()}.csv`, '\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  toast('Application list exported with your current progress.');
});
