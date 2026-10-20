'use strict';
let universityFilter = 'all';
let universityCountry = '';
let universitySort = 'country';
let sopFilter = '';
const SOP_STATUSES = ['Not started', 'Outline', 'Drafting', 'Needs review', 'Ready', 'Submitted', 'Not required'];
function universityProgress(record) { return state.leads[record.id] || {}; }
function sopProgress(record) { return universityProgress(record).sopStatus || 'Not started'; }
function sopRow(record, progress) {
  const control = (field, type, label, value, placeholder = '') => `<label>${label}<input type="${type}" data-university-id="${record.id}" data-university-field="${field}" aria-label="${esc(label + ' — ' + record.name)}" value="${esc(value || '')}" placeholder="${esc(placeholder)}"></label>`;
  const late = progress.sopDue && days(progress.sopDue) < 0 && !['Ready','Submitted','Not required'].includes(sopProgress(record));
  return `<tr><td><strong>${esc(record.name)}</strong><div class="small muted">${esc(record.country)} · ${esc(record.source)}</div><p class="small">${esc(progress.programme || record.programme || 'Programme not recorded')}</p></td><td><label>SOP status<select data-university-id="${record.id}" data-university-field="sopStatus" aria-label="SOP status — ${esc(record.name)}">${SOP_STATUSES.map(value => `<option ${sopProgress(record) === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>${control('sopDue','date','SOP target date',progress.sopDue)}${late ? '<p class="small danger-text">Past your target date</p>' : ''}</td><td>${control('sopDraftLink','url','Draft link',progress.sopDraftLink,'https://docs.google.com/…')}${safeUrl(progress.sopDraftLink) ? `<a class="button sop-open" href="${safeUrl(progress.sopDraftLink)}" target="_blank" rel="noopener noreferrer">Open SOP draft ↗</a>` : '<p class="small muted">Add a web link to your draft to open it here.</p>'}</td><td><label>Prompt, word limit & notes<textarea rows="5" data-university-id="${record.id}" data-university-field="sopNotes" aria-label="SOP notes — ${esc(record.name)}" placeholder="Programme prompt, word limit, faculty to mention, feedback and next edits…">${esc(progress.sopNotes || '')}</textarea></label></td></tr>`;
}
function universityTracker(view = 'applications') {
  const isSop = view === 'sop';
  const query = $('global-search').value.trim().toLowerCase();
  const records = window.UNIVERSITY_PLAN;
  const countries = [...new Set(records.map(record => record.country))].sort();
  const selected = records.filter(record => {
    const progress = universityProgress(record);
    return (!isSop || !sopFilter || sopProgress(record) === sopFilter) && (!universityCountry || record.country === universityCountry) && (!query || `${record.name} ${record.country} ${progress.programme || record.programme}`.toLowerCase().includes(query)) &&
      (universityFilter === 'all' || universityFilter === 'accounts' && progress.accountCreated ||
      universityFilter === 'submitted' && progress.applicationSubmitted ||
      universityFilter === 'pending' && !progress.applicationSubmitted ||
      universityFilter === 'original' && record.source === 'Your spreadsheet' ||
      universityFilter === 'added' && record.source !== 'Your spreadsheet');
  }).sort((a, b) => universitySort === 'country' ? a.country.localeCompare(b.country) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));
  const accountCount = records.filter(record => universityProgress(record).accountCreated).length;
  const submittedCount = records.filter(record => universityProgress(record).applicationSubmitted).length;
  const sopStarted = records.filter(record => ['Outline','Drafting','Needs review'].includes(sopProgress(record))).length;
  const sopReady = records.filter(record => sopProgress(record) === 'Ready').length;
  const sopSubmitted = records.filter(record => sopProgress(record) === 'Submitted').length;
  return heading(isSop ? 'SOP tracker' : 'University applications', isSop ? 'Plan, draft and review a statement of purpose for each university.' : 'Track portal accounts and submissions separately for your Fall 2027 applications.', isSop ? 'STATEMENTS OF PURPOSE' : 'YOUR APPLICATION LIST', `<button class="button" data-university-export>Export ${isSop ? 'SOP tracker' : 'application list'} ↓</button>`) +
    (isSop ? `<div class="university-summary"><div><strong>${records.length}</strong><span>Universities</span></div><div><strong>${sopStarted}</strong><span>SOPs in progress</span></div><div><strong>${sopReady}</strong><span>Ready</span></div><div><strong>${sopSubmitted}</strong><span>SOPs submitted</span></div></div><p class="data-status">Track your main SOP for each university. Target dates are your writing deadlines; verify the programme deadline separately. Draft links, notes and statuses save in this browser and are included in Export backup. They are not published to GitHub. Existing draft files are not automatically marked complete.</p>` :
    `<div class="university-summary"><div><strong>${records.length}</strong><span>Universities</span></div><div><strong>${accountCount}</strong><span>Accounts marked created</span></div><div><strong>${submittedCount}</strong><span>Applications marked submitted</span></div></div>
    <p class="data-status">Your spreadsheet list was imported on 19 October 2026. Additional research universities are suggestions, not a ranking or confirmed vacancies. Unchecked means not yet marked. Your updates save in this browser and are included in Export backup.</p>`) + `
    <div class="university-toolbar"><label>Country<select id="university-country"><option value="">All countries</option>${countries.map(country => `<option value="${esc(country)}" ${universityCountry === country ? 'selected' : ''}>${esc(country)}</option>`).join('')}</select></label><label>Show<select id="university-filter">${[['all','All universities'],['accounts','Account created'],['submitted','Application submitted'],['pending','Not marked submitted'],['original','From your spreadsheet'],['added','Additional universities']].map(([value,label]) => `<option value="${value}" ${universityFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Sort by<select id="university-sort"><option value="country" ${universitySort === 'country' ? 'selected' : ''}>Country, then university</option><option value="name" ${universitySort === 'name' ? 'selected' : ''}>University name A–Z</option></select></label><span>${selected.length} ${selected.length === 1 ? 'university' : 'universities'} · use the search above to find a university</span></div>
    ${isSop ? `<div class="sop-filter"><label>SOP status<select id="sop-filter"><option value="">All SOP statuses</option>${SOP_STATUSES.map(value => `<option value="${value}" ${sopFilter === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><a href="#universities">View application accounts & submissions ↗</a></div>` : '<p><a href="#sop">Track statements of purpose for these universities ↗</a></p>'}
    <div class="university-table-wrap"><table class="university-table ${isSop ? 'sop-table' : ''}"><thead><tr>${isSop ? '<th>University / programme</th><th>SOP progress</th><th>Your draft</th><th>Requirements & notes</th>' : '<th>University / programme</th><th>Account created</th><th>Application submitted</th><th>Notes</th>'}</tr></thead><tbody>${selected.map((record, index) => {
      const progress = universityProgress(record);
      const input = (field, type, label, value) => `<input type="${type}" data-university-id="${record.id}" data-university-field="${field}" aria-label="${esc(label + ' — ' + record.name)}" ${type === 'checkbox' ? value ? 'checked' : '' : `value="${esc(value || '')}"`}>`;
      const countryHeading = universitySort === 'country' && (index === 0 || selected[index - 1].country !== record.country) ? `<tr class="university-country-heading"><th colspan="4" scope="rowgroup">${esc(record.country)} <span>${selected.filter(item => item.country === record.country).length} ${selected.filter(item => item.country === record.country).length === 1 ? 'university' : 'universities'}</span></th></tr>` : '';
      if (isSop) return countryHeading + sopRow(record, progress);
      return `${countryHeading}<tr><td><strong>${esc(record.name)}</strong><div class="small muted">${esc(record.country)} · ${esc(record.source)}</div>${localTimeMarkup({university:record.name,country:record.country,timeZone:record.timeZone})}<label class="university-programme">Programme${input('programme','text','Programme',progress.programme ?? record.programme)}</label>${safeUrl(record.portal) ? `<a href="${safeUrl(record.portal)}" target="_blank" rel="noopener noreferrer">Application link from sheet ↗</a>` : ''}${record.sheetStatus ? `<p class="small muted">Original sheet note: ${esc(record.sheetStatus)}</p>` : ''}</td><td><label class="university-check">${input('accountCreated','checkbox','Account created',progress.accountCreated)}<span>Created</span></label><label class="small">Date created${input('accountDate','date','Account creation date',progress.accountDate)}</label></td><td><label class="university-check">${input('applicationSubmitted','checkbox','Application submitted',progress.applicationSubmitted)}<span>Submitted</span></label><label class="small">Date submitted${input('submittedDate','date','Submission date',progress.submittedDate)}</label></td><td><textarea rows="3" data-university-id="${record.id}" data-university-field="applicationNotes" aria-label="Notes — ${esc(record.name)}" placeholder="Supervisor, fee waiver, documents or next step…">${esc(progress.applicationNotes || '')}</textarea></td></tr>`;
    }).join('')}</tbody></table>${!selected.length ? '<p class="muted">No universities match this filter.</p>' : ''}</div>`;
}
document.addEventListener('change', event => {
  if (event.target.id === 'sop-filter') { sopFilter = event.target.value; render(); return; }
  if (event.target.id === 'university-country') { universityCountry = event.target.value; render(); return; }
  if (event.target.id === 'university-sort') { universitySort = event.target.value; render(); return; }
  if (event.target.id === 'university-filter') { universityFilter = event.target.value; render(); return; }
  const {universityId, universityField} = event.target.dataset;
  if (!universityId || !universityField) return;
  setTrack(universityId, universityField, event.target.type === 'checkbox' ? event.target.checked : event.target.value);
  if (event.target.type === 'checkbox' || ['sopStatus','sopDue','sopDraftLink'].includes(universityField)) render();
});
document.addEventListener('input', event => {
  const {universityId, universityField} = event.target.dataset;
  if (universityId && ['programme','applicationNotes','sopNotes','sopDraftLink'].includes(universityField)) setTrack(universityId, universityField, event.target.value);
});
document.addEventListener('click', event => {
  if (!event.target.closest('[data-university-export]')) return;
  const rows = [['University','Country','Source','Programme','Account created','Account creation date','Application submitted','Submission date','Notes','Application link','Original sheet status','SOP status','SOP target date','SOP draft link','SOP notes'], ...window.UNIVERSITY_PLAN.map(record => {
    const progress = universityProgress(record);
    return [record.name,record.country,record.source,progress.programme ?? record.programme,progress.accountCreated ? 'Yes' : 'Not marked',progress.accountDate || '',progress.applicationSubmitted ? 'Yes' : 'Not marked',progress.submittedDate || '',progress.applicationNotes || '',record.portal,record.sheetStatus,sopProgress(record),progress.sopDue || '',progress.sopDraftLink || '',progress.sopNotes || ''];
  })];
  const quote = value => '"' + String(value ?? '').replace(/^[=+@-]/,"'$&").replaceAll('"','""') + '"';
  exportFile(`${route === 'sop' ? 'sop-tracker' : 'university-applications'}-${today()}.csv`, '\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  toast('Application list exported with your current progress.');
});
