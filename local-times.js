'use strict';
// Campus-based IANA zones let Intl apply current daylight-saving rules.
const CAMPUS_ZONES = [
  [/Deakin|RMIT|Melbourne|La Trobe/, 'Australia/Melbourne', 'Melbourne'],
  [/Canberra|Australian National/, 'Australia/Sydney', 'Canberra'],
  [/Queensland|Griffith/, 'Australia/Brisbane', 'Brisbane'],
  [/Sydney|New South Wales|Newcastle/, 'Australia/Sydney', 'Sydney / NSW'],
  [/Murdoch/, 'Australia/Perth', 'Perth'],
  [/Adelaide/, 'Australia/Adelaide', 'Adelaide'],
  [/Vancouver|Simon Fraser/, 'America/Vancouver', 'Vancouver'],
  [/Alberta|Calgary/, 'America/Edmonton', 'Alberta'],
  [/Saskatchewan/, 'America/Regina', 'Saskatoon'],
  [/Manitoba/, 'America/Winnipeg', 'Winnipeg'],
  [/McGill|Montreal/, 'America/Toronto', 'Montréal'],
  [/Western University|McMaster|Toronto Metropolitan|Windsor/, 'America/Toronto', 'Ontario'],
  [/UCLA/, 'America/Los_Angeles', 'Los Angeles'],
  [/Colorado/, 'America/Denver', 'Colorado'],
  [/Alaska Anchorage/, 'America/Anchorage', 'Anchorage'],
  [/Texas|Houston/, 'America/Chicago', 'Texas'],
  [/DePaul|Wisconsin|Illinois|Minnesota/, 'America/Chicago', 'Central US'],
  [/Indiana|Hopkins|Florida|Miami|Old Dominion|Massachusetts|George Mason|Rensselaer|Penn State/, 'America/New_York', 'Eastern US'],
];
const COUNTRY_ZONES = {
  'United Kingdom': ['Europe/London', 'UK'],
  Ireland: ['Europe/Dublin', 'Ireland'],
  France: ['Europe/Paris', 'France'],
  Switzerland: ['Europe/Zurich', 'Switzerland'],
  Finland: ['Europe/Helsinki', 'Finland'],
  Portugal: ['Europe/Lisbon', 'Lisbon'],
  Singapore: ['Asia/Singapore', 'Singapore'],
  'South Korea': ['Asia/Seoul', 'South Korea'],
  'Hong Kong': ['Asia/Hong_Kong', 'Hong Kong'],
};
function zoneForLead(record) {
  if (record.timeZone) {
    try { new Intl.DateTimeFormat('en', {timeZone: record.timeZone}); return [record.timeZone, record.timeZone]; } catch { return null; }
  }
  const campus = CAMPUS_ZONES.find(([pattern]) => pattern.test(record.university || ''));
  return campus ? campus.slice(1) : COUNTRY_ZONES[record.country] || null;
}
function timeAtZone(zone, now) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short',
  }).format(now);
}
function offsetAtZone(zone, now) {
  const value = new Intl.DateTimeFormat('en', {timeZone: zone, timeZoneName: 'longOffset'})
    .formatToParts(now).find(part => part.type === 'timeZoneName').value;
  if (value === 'GMT') return 0;
  const match = value.match(/GMT([+-])(\d{2}):(\d{2})/);
  return match ? (match[1] === '+' ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
}
function localTimeText(zone, now = new Date()) {
  const difference = offsetAtZone(zone, now) - offsetAtZone('Asia/Colombo', now);
  const minutes = Math.abs(difference);
  const amount = [Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h` : '', minutes % 60 ? `${minutes % 60}m` : ''].filter(Boolean).join(' ');
  return `${timeAtZone(zone, now)} · ${difference ? `${amount} ${difference > 0 ? 'ahead of' : 'behind'} Sri Lanka` : 'same time as Sri Lanka'}`;
}
function localTimeMarkup(record) {
  const location = zoneForLead(record);
  if (!location) return '<p class="local-time unknown">Local time · location to confirm</p>';
  const [zone, label] = location;
  return `<p class="local-time" title="${zone}"><span class="local-time-label">Local time · ${label}</span><span data-local-zone="${zone}">${localTimeText(zone)}</span></p>`;
}
function updateLocalTimes() {
  const now = new Date();
  document.querySelectorAll('[data-local-zone]').forEach(element => {
    element.textContent = localTimeText(element.dataset.localZone, now);
  });
}
setInterval(updateLocalTimes, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateLocalTimes(); });
