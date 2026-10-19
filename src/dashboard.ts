export const DASHBOARD_HTML = String.raw`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HaiderBrain Remote</title>
<style>
  :root[data-theme="dark"] { --bg:#0d0d0d; --panel:#1a1a1a; --panel2:#222; --border:#2e2e2e; --text:#eee; --muted:#999; --accent:#9a82db; --btn:#6750a4; --danger:#8a2f2f; --me:#3a2d63; }
  :root[data-theme="light"] { --bg:#f4f4f6; --panel:#fff; --panel2:#f0f0f3; --border:#ddd; --text:#1a1a1a; --muted:#666; --accent:#6750a4; --btn:#6750a4; --danger:#c0392b; --me:#e4defa; }
  * { box-sizing:border-box; }
  body { font-family: system-ui, sans-serif; background:var(--bg); color:var(--text); max-width:1100px; margin:0 auto; padding:14px; }
  h1 { font-size:19px; margin:0 0 8px; display:flex; justify-content:space-between; align-items:center; }
  h3 { font-size:14px; margin:0 0 8px; color:var(--muted); }
  .row { display:flex; gap:8px; margin:8px 0; align-items:center; flex-wrap:wrap; }
  input[type=password], input[type=text], select { flex:1; min-width:120px; padding:9px; border-radius:8px; border:1px solid var(--border); background:var(--panel); color:var(--text); }
  button, a.btn { padding:9px 13px; border-radius:8px; border:0; background:var(--btn); color:#fff; cursor:pointer; text-decoration:none; font-size:13px; }
  button.small { padding:4px 9px; font-size:12px; background:var(--panel2); color:var(--text); }
  button.danger { background:var(--danger); }
  label { font-size:12px; color:var(--muted); white-space:nowrap; display:flex; align-items:center; gap:4px; }
  .line { padding:6px 8px; margin:4px 0; border-radius:6px; background:var(--panel); white-space:pre-wrap; display:flex; gap:8px; justify-content:space-between; align-items:center; font-size:13px; }
  .err { color:#ff8a80; }
  .me { color:#80cbc4; }
  #cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:8px; margin:10px 0; }
  .card { padding:10px; border-radius:10px; background:var(--panel); border:1px solid var(--border); cursor:pointer; }
  .card.off { opacity:0.5; cursor:default; }
  .card.sel { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
  .cname { font-weight:600; font-size:14px; }
  .csub { font-size:11px; color:var(--muted); margin-top:3px; }
  .dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; background:#555; }
  .card.on .dot { background:#4caf50; }

  .tabs { display:flex; gap:4px; margin:12px 0 0; border-bottom:1px solid var(--border); overflow-x:auto; }
  .tab { padding:9px 13px; cursor:pointer; font-size:13px; color:var(--muted); border-bottom:2px solid transparent; white-space:nowrap; }
  .tab.active { color:var(--text); border-bottom:2px solid var(--accent); }
  .panel { display:none; padding:12px 0; min-height:200px; }
  .panel.active { display:block; }
  .empty { color:var(--muted); font-size:13px; padding:20px 0; text-align:center; }

  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:6px; }
  .grid img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:6px; cursor:pointer; }
  .vcell { background:var(--panel); border-radius:8px; padding:6px; }
  .vcell img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:6px; margin-bottom:4px; }

  #screenImg { max-width:100%; border-radius:10px; display:block; cursor:crosshair; border:1px solid var(--border); }
  #screenWrap { max-width:420px; margin:0 auto; }
  .callrow { display:flex; justify-content:space-between; padding:7px 9px; background:var(--panel); border-radius:6px; margin:4px 0; font-size:13px; }
  #full img { max-width:100%; margin-top:10px; border-radius:8px; }

  .srow { background:var(--panel); border-radius:8px; padding:12px; margin-bottom:10px; }

  /* chat layout */
  .chatWrap { display:flex; gap:10px; min-height:420px; }
  .contactsCol { width:230px; flex-shrink:0; border-right:1px solid var(--border); padding-right:8px; overflow-y:auto; max-height:520px; }
  .contactRow { padding:8px; border-radius:8px; cursor:pointer; margin-bottom:3px; }
  .contactRow:hover, .contactRow.sel { background:var(--panel); }
  .contactName { font-weight:600; font-size:13px; }
  .contactPrev { font-size:11px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .threadCol { flex:1; display:flex; flex-direction:column; min-width:0; }
  .threadMsgs { flex:1; overflow-y:auto; max-height:440px; padding:6px; }
  .bubble { background:var(--panel); border-radius:10px; padding:8px 10px; margin:5px 0; max-width:80%; font-size:13px; }
  .bubbleTime { font-size:10px; color:var(--muted); margin-top:3px; }
  .backBtn { display:none; }
  .chatBackBtn { display:none; margin-bottom:6px; }

  @media (max-width: 700px) {
    .chatWrap { flex-direction:column; }
    .contactsCol { width:100%; border-right:0; border-bottom:1px solid var(--border); padding-right:0; padding-bottom:6px; max-height:260px; }
    .contactsCol.hideOnMobile { display:none; }
    .threadCol.hideOnMobile { display:none; }
    .chatBackBtn.show { display:inline-block; }
    #cards { grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); }
    .tabs { flex-wrap:wrap; }
  }
</style>
</head>
<body>
<h1><span>HaiderBrain Remote</span><button class="small" id="themeToggle">Theme</button></h1>
<div class="row">
  <input id="token" type="password" placeholder="Pairing token">
  <label><input id="remember" type="checkbox"> Remember on this browser</label>
  <button id="connect">Connect</button>
</div>
<div class="row"><span>Relay: <b id="relay">disconnected</b></span></div>

<div id="cards"></div>

<div class="tabs" id="tabs">
  <div class="tab active" data-tab="screen">Screen</div>
  <div class="tab" data-tab="photos">Photos</div>
  <div class="tab" data-tab="videos">Videos</div>
  <div class="tab" data-tab="whatsapp">WhatsApp</div>
  <div class="tab" data-tab="instagram">Instagram</div>
  <div class="tab" data-tab="sms">SMS</div>
  <div class="tab" data-tab="calls">Calls</div>
  <div class="tab" data-tab="location">Location</div>
  <div class="tab" data-tab="files">Files</div>
  <div class="tab" data-tab="apps">Apps</div>
  <div class="tab" data-tab="settings">Settings</div>
</div>

<div class="row" id="autoRefreshRow" style="display:none">
  <label><input id="autoRefresh" type="checkbox"> Auto-refresh this tab every 30s</label>
</div>

<div class="panel active" id="panel-screen">
  <div class="row"><button class="small" id="scBack">Back</button><button class="small" id="scHome">Home</button><button class="small" id="scRecents">Recents</button>
    <input id="scText" type="text" placeholder="Type into focused field"><button class="small" id="scType">Type</button></div>
  <div id="screenWrap"><img id="screenImg"></div>
  <div class="empty" id="screenEmpty">Select a phone above. Screen mirroring starts automatically.</div>
</div>

<div class="panel" id="panel-photos"><div class="grid" id="photosGrid"></div><div class="empty" id="photosEmpty">Loading...</div></div>
<div class="panel" id="panel-videos"><div class="grid" id="videosGrid"></div><div class="empty" id="videosEmpty">Loading...</div><div class="row" id="videosMoreRow" style="display:none"><button class="small" id="videosMore">Load more videos</button></div></div>

<div class="panel" id="panel-whatsapp">
  <div class="row"><input id="waSearch" type="text" placeholder="Search contacts..."></div>
  <div class="chatWrap">
    <div class="contactsCol" id="waContacts"></div>
    <div class="threadCol" id="waThreadCol">
      <button class="small chatBackBtn" id="waBack">Back to contacts</button>
      <div class="threadMsgs" id="waMsgs"><div class="empty">Select a contact</div></div>
      <div class="row" id="waReplyRow" style="display:none"><input id="waReplyText" type="text" placeholder="Reply..."><button class="small" id="waReplySend">Send</button></div>
    </div>
  </div>
</div>
<div class="panel" id="panel-instagram">
  <div class="row"><input id="igSearch" type="text" placeholder="Search contacts..."></div>
  <div class="chatWrap">
    <div class="contactsCol" id="igContacts"></div>
    <div class="threadCol" id="igThreadCol">
      <button class="small chatBackBtn" id="igBack">Back to contacts</button>
      <div class="threadMsgs" id="igMsgs"><div class="empty">Select a contact</div></div>
      <div class="row" id="igReplyRow" style="display:none"><input id="igReplyText" type="text" placeholder="Reply..."><button class="small" id="igReplySend">Send</button></div>
    </div>
  </div>
</div>

<div class="panel" id="panel-sms"><div id="smsList"></div><div class="empty" id="smsEmpty">Loading...</div></div>
<div class="panel" id="panel-calls"><div id="callsList"></div><div class="empty" id="callsEmpty">Loading...</div></div>
<div class="panel" id="panel-location">
  <div class="row"><button class="small" id="trackStart">Start live tracking</button><button class="small" id="trackStop">Stop tracking</button></div>
  <div id="locBox"><div class="empty">Loading...</div></div>
</div>
<div class="panel" id="panel-files">
  <div class="row"><input id="folderInput" type="text" placeholder="Folder (e.g. Download, DCIM) - blank for all"><button class="small" id="filesGo">Browse</button></div>
  <div id="filesList"></div><div class="empty" id="filesEmpty">Pick a folder and click Browse</div>
</div>
<div class="panel" id="panel-apps"><div id="appsList"></div><div class="empty" id="appsEmpty">Loading...</div></div>

<div class="panel" id="panel-settings">
  <div class="srow"><h3>Phone name</h3><div class="row"><input id="setNick" type="text" placeholder="New name"><button class="small" id="btnNick">Rename</button></div></div>
  <div class="srow"><h3>Clipboard</h3><div class="row"><button class="small" id="btnClipGet">Get clipboard</button><input id="clipSetText" type="text" placeholder="Text to push to phone"><button class="small" id="btnClipSet">Set clipboard</button></div><div id="clipResult" class="csub"></div></div>
  <div class="srow"><h3>Remote control</h3><div class="row"><button class="small" id="btnRing">Ring phone</button><button class="small" id="btnRingStop">Stop ring</button><button class="small" id="btnLock">Lock phone</button><button class="danger" id="btnWipe">Wipe phone</button></div></div>
  <div class="srow"><h3>Security PIN (required before Lock/Wipe run)</h3><div class="row"><input id="pinInput" type="password" placeholder="Set a PIN (4+ digits)"><button class="small" id="btnPin">Save PIN</button><button class="small" id="btnPinClear">Clear PIN</button></div><div class="csub" id="pinStatus"></div></div>
  <div class="srow"><h3>Telegram alerts (every WhatsApp/Instagram message pushes here, even if this page is closed)</h3><div class="row"><input id="tgToken" type="text" placeholder="Bot token"><input id="tgChat" type="text" placeholder="Chat ID"><button class="small" id="btnTg">Save</button></div></div>
  <div class="srow"><h3>Scheduled command</h3><div class="row"><input id="schedMin" type="text" placeholder="Every N minutes (0=off)" style="max-width:160px"><input id="schedCmd" type="text" placeholder="Command, e.g. show my screenshots"><button class="small" id="btnSched">Save</button></div></div>
  <div class="srow"><h3>App usage (today)</h3><button class="small" id="btnUsage">Load</button><div id="usageList"></div></div>
</div>

<div id="full"></div>

<h3>Live messages</h3>
<div id="live"></div>

<h3>Log</h3>
<div id="log"></div>

<script>
var ws = null, retry = null, pingTimer = null, statusTimer = null, autoTimer = null, wantOpen = false;
var online = [], phoneStatus = {}, known = {}, screenTapStart = null, currentTab = 'screen';
var waAll = [], igAll = [], waSel = '', igSel = '', waOffset = 0, igOffset = 0;

function $(id) { return document.getElementById(id); }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined && text !== null) e.textContent = text; return e; }
function esc(s) { return String(s == null ? '' : s); }

function store() {
  try { localStorage.setItem('hb_probe', '1'); localStorage.removeItem('hb_probe'); return localStorage; }
  catch (e) { return sessionStorage; }
}
var laptopId = (function () {
  var s = store(); var id = s.getItem('hb_laptop_id');
  if (!id) { id = 'laptop-' + uid(); s.setItem('hb_laptop_id', id); }
  return id;
})();
try { known = JSON.parse(store().getItem('hb_known') || '{}'); } catch (e) { known = {}; }
function saveKnown() { try { store().setItem('hb_known', JSON.stringify(known)); } catch (e) {} }

// theme
(function initTheme() {
  var t = store().getItem('hb_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();
$('themeToggle').onclick = function () {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  store().setItem('hb_theme', next);
};

function log(text, cls) {
  var d = el('div', 'line ' + (cls || ''), text);
  $('log').prepend(d);
  while ($('log').children.length > 50) $('log').removeChild($('log').lastChild);
}
function nameOf(id) { return known[id] ? known[id].name : 'Phone'; }
function ago(ts) {
  if (!ts) return 'unknown';
  var m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  var h = Math.round(m / 60);
  if (h < 48) return h + ' h ago';
  return Math.round(h / 24) + ' d ago';
}
function notify(title, body) {
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body: body }); } catch (e) {}
}
function selectedId() { return $('cards').dataset.sel || ''; }

function sendTo(ids, obj, quiet) {
  if (!ws || ws.readyState !== 1) { if (!quiet) log('Not connected', 'err'); return false; }
  if (!ids || !ids.length) { if (!quiet) log('Pick a phone first', 'err'); return false; }
  ids.forEach(function (id) {
    var o = {}; for (var k in obj) o[k] = obj[k];
    o.to = id; o.id = uid();
    ws.send(JSON.stringify(o));
  });
  return true;
}
function requestStatus() { sendTo(online.map(function (p) { return p.id; }), { type: 'get_status' }, true); }

// ---------- phone cards ----------
function renderCards() {
  var box = $('cards'); box.innerHTML = '';
  var onlineIds = {}; online.forEach(function (p) { onlineIds[p.id] = true; });
  var sel = box.dataset.sel || '';
  if (!sel && online.length) { sel = online[0].id; box.dataset.sel = sel; }

  Object.keys(known).forEach(function (id) {
    var isOn = !!onlineIds[id];
    var c = el('div', 'card ' + (isOn ? 'on' : 'off') + (id === sel ? ' sel' : ''));
    var title = el('div', 'cname'); title.appendChild(el('span', 'dot')); title.appendChild(document.createTextNode(known[id].name));
    c.appendChild(title);
    var st = phoneStatus[id];
    var line = isOn ? ((st && st.battery >= 0) ? 'Online - battery ' + st.battery + '%' + (st.charging ? ' (charging)' : '') : 'Online')
                     : 'Offline - last seen ' + ago(known[id].lastSeen);
    c.appendChild(el('div', 'csub', line));
    if (isOn && st) {
      var n = el('div', 'csub', st.notifAccess ? 'Notifications: ON' : 'Notifications: OFF');
      if (!st.notifAccess) n.style.color = '#ff8a80'; c.appendChild(n);
      var a = el('div', 'csub', st.accessibilityOn ? 'Screen/control: ON' : 'Screen/control: OFF');
      if (!st.accessibilityOn) a.style.color = '#ff8a80'; c.appendChild(a);
    }
    c.onclick = function () { box.dataset.sel = id; renderCards(); loadTab(currentTab, true); };
    box.appendChild(c);
  });
}

function updateDevices(phones) {
  var now = Date.now(); var newIds = {};
  (phones || []).forEach(function (p) { newIds[p.id] = true; });
  online.forEach(function (p) { if (!newIds[p.id] && known[p.id]) known[p.id].lastSeen = now; });
  online = phones || [];
  online.forEach(function (p) { known[p.id] = { name: p.name, lastSeen: now }; });
  saveKnown();
  renderCards();
  requestStatus();
  if (selectedId() && currentTab) loadTab(currentTab, false);
}

// ---------- tabs ----------
var AUTOREFRESH_TABS = ['calls', 'apps', 'location', 'whatsapp', 'instagram', 'sms'];
function switchTab(tab) {
  if (currentTab === 'screen' && tab !== 'screen') sendTo([selectedId()], { type: 'screen_stop' }, true);
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t.dataset.tab === tab); });
  document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + tab); });
  $('autoRefreshRow').style.display = AUTOREFRESH_TABS.indexOf(tab) >= 0 ? 'flex' : 'none';
  clearInterval(autoTimer);
  if ($('autoRefresh').checked && AUTOREFRESH_TABS.indexOf(tab) >= 0) {
    autoTimer = setInterval(function () { loadTab(tab, false); }, 30000);
  }
  loadTab(tab, true);
}
document.querySelectorAll('.tab').forEach(function (t) { t.onclick = function () { switchTab(t.dataset.tab); }; });
$('autoRefresh').onchange = function () { switchTab(currentTab); };

function loadTab(tab, isSwitch) {
  var id = selectedId();
  if (!id) return;
  if (tab === 'screen') { if (isSwitch) sendTo([id], { type: 'screen_start', intervalMs: 400 }, true); }
  else if (tab === 'photos') sendTo([id], { type: 'command', text: 'show my photos' }, true);
  else if (tab === 'videos') { if (isSwitch) { videoOffsetReset(); } }
  else if (tab === 'whatsapp') sendTo([id], { type: 'get_messages', app: 'whatsapp', limit: 300, offset: 0 }, true);
  else if (tab === 'instagram') sendTo([id], { type: 'get_messages', app: 'instagram', limit: 300, offset: 0 }, true);
  else if (tab === 'sms') sendTo([id], { type: 'get_sms' }, true);
  else if (tab === 'calls') sendTo([id], { type: 'get_call_log' }, true);
  else if (tab === 'location') sendTo([id], { type: 'get_location' }, true);
  else if (tab === 'apps') sendTo([id], { type: 'get_apps' }, true);
  if (tab === 'videos' && isSwitch) sendTo([id], { type: 'get_videos', offset: 0 }, true);
}

// ---------- render: simple tabs ----------
function showFull(data) {
  var full = $('full'); full.innerHTML = '';
  var url = 'data:image/jpeg;base64,' + data;
  var bar = el('div', 'row');
  var dl = el('a', 'btn', 'Download'); dl.href = url; dl.download = 'haiderbrain-photo.jpg';
  var close = el('button', 'small', 'Close'); close.onclick = function () { full.innerHTML = ''; };
  bar.appendChild(dl); bar.appendChild(close);
  var img = document.createElement('img'); img.src = url;
  full.appendChild(bar); full.appendChild(img);
}
function renderPhotos(m) {
  var g = $('photosGrid'); g.innerHTML = '';
  var items = m.photos || [];
  $('photosEmpty').style.display = items.length ? 'none' : 'block';
  $('photosEmpty').textContent = m.reply || 'No photos found';
  items.forEach(function (p) {
    var img = document.createElement('img'); img.src = 'data:image/jpeg;base64,' + p.thumb; img.title = p.name || '';
    img.onclick = function () { sendTo([m.from], { type: 'get_photo', photoId: p.id }); };
    g.appendChild(img);
  });
}
var videoOffset = 0;
function videoOffsetReset() { videoOffset = 0; }
function renderVideos(m, append) {
  var g = $('videosGrid');
  if (!append) g.innerHTML = '';
  var items = m.items || [];
  $('videosEmpty').style.display = (items.length || append) ? 'none' : 'block';
  $('videosMoreRow').style.display = m.hasMore ? 'flex' : 'none';
  items.forEach(function (v) {
    var cell = el('div', 'vcell');
    if (v.thumb) { var img = document.createElement('img'); img.src = 'data:image/jpeg;base64,' + v.thumb; cell.appendChild(img); }
    var dur = Math.round((v.durationMs || 0) / 1000);
    cell.appendChild(el('div', 'csub', esc(v.name) + ' - ' + dur + 's - ' + Math.round(v.sizeBytes / 1024 / 1024) + 'MB'));
    var btn = el('button', 'small', 'Download'); btn.style.marginTop = '4px';
    btn.onclick = function () { log('Requesting video...'); sendTo([m.from], { type: 'get_video', videoId: v.id }); };
    cell.appendChild(btn);
    g.appendChild(cell);
  });
}
function renderCalls(m) {
  var box = $('callsList'); box.innerHTML = '';
  var items = m.items || [];
  $('callsEmpty').style.display = items.length ? 'none' : 'block';
  $('callsEmpty').textContent = 'No call log access or no calls';
  items.forEach(function (it) {
    var row = el('div', 'callrow');
    var left = document.createElement('div');
    left.appendChild(el('div', '', (it.name || '(No contact name)') + ' - ' + it.type));
    left.appendChild(el('div', 'csub', it.number || 'Unknown number'));
    row.appendChild(left);
    row.appendChild(el('span', '', new Date(it.date).toLocaleString() + ' - ' + it.durationSec + 's'));
    box.appendChild(row);
  });
}
function renderLocation(m) {
  var box = $('locBox'); box.innerHTML = '';
  if (m.error) { box.appendChild(el('div', 'empty', 'No location available yet')); return; }
  var link = el('a', 'btn', 'Open in Google Maps');
  link.href = 'https://www.google.com/maps?q=' + m.lat + ',' + m.lng; link.target = '_blank';
  box.appendChild(link);
  box.appendChild(el('div', 'csub', 'Lat ' + m.lat.toFixed(5) + ', Lng ' + m.lng.toFixed(5) + ' (accuracy ' + Math.round(m.accuracy) + 'm)'));
  var iframe = document.createElement('iframe');
  iframe.style.cssText = 'width:100%;height:320px;border:0;border-radius:10px;margin-top:10px';
  iframe.src = 'https://maps.google.com/maps?q=' + m.lat + ',' + m.lng + '&z=15&output=embed';
  box.appendChild(iframe);
}
function renderFiles(m) {
  var box = $('filesList'); box.innerHTML = '';
  var items = m.items || [];
  $('filesEmpty').style.display = items.length ? 'none' : 'block';
  items.forEach(function (f) {
    var row = el('div', 'callrow');
    row.appendChild(el('span', '', esc(f.name) + ' (' + Math.round(f.size / 1024) + 'KB)'));
    var btn = el('button', 'small', 'Download');
    btn.onclick = function () { sendTo([m.from], { type: 'download_file', fileId: f.id }); };
    row.appendChild(btn);
    box.appendChild(row);
  });
}
function renderApps(m) {
  var box = $('appsList'); box.innerHTML = '';
  var items = m.items || [];
  $('appsEmpty').style.display = items.length ? 'none' : 'block';
  items.forEach(function (a) { box.appendChild(el('div', 'callrow', a.name)); });
}
function renderUsage(m) {
  var box = $('usageList'); box.innerHTML = '';
  if (!m.hasAccess) box.appendChild(el('div', 'csub', 'Usage access not granted on phone'));
  (m.items || []).forEach(function (u) { box.appendChild(el('div', 'callrow', u.name + ' - ' + u.minutes + ' min')); });
}
function addLive(m) {
  var d = el('div', 'line');
  d.appendChild(el('div', '', '[' + nameOf(m.from) + ' / ' + m.app + '] ' + esc(m.sender) + ': ' + esc(m.message)));
  var b = el('button', 'small', 'Reply');
  b.onclick = function () {
    var text = prompt('Reply to ' + m.sender + ':');
    if (text && text.trim()) sendTo([m.from], { type: 'send_reply', app: esc(m.app).toLowerCase(), contact: m.sender, text: text.trim() });
  };
  d.appendChild(b);
  $('live').prepend(d);
  while ($('live').children.length > 30) $('live').removeChild($('live').lastChild);
  notify(m.sender + ' (' + nameOf(m.from) + ')', m.message);
  // feed into whichever thread store is relevant
  var appKey = String(m.app || '').toLowerCase();
  if (appKey === 'whatsapp') { waAll.push({ sender: m.sender, message: m.message, timestamp: m.timestamp, app: 'WhatsApp' }); renderContacts('wa'); if (waSel === m.sender) renderThread('wa'); }
  if (appKey === 'instagram') { igAll.push({ sender: m.sender, message: m.message, timestamp: m.timestamp, app: 'Instagram' }); renderContacts('ig'); if (igSel === m.sender) renderThread('ig'); }
}

// ---------- threaded chat (WhatsApp / Instagram) ----------
function groupByContact(items) {
  var map = {};
  items.forEach(function (it) {
    if (!map[it.sender]) map[it.sender] = [];
    map[it.sender].push(it);
  });
  return map;
}
function renderContacts(prefix) {
  var all = prefix === 'wa' ? waAll : igAll;
  var box = $(prefix + 'Contacts');
  var q = ($(prefix + 'Search').value || '').toLowerCase();
  var groups = groupByContact(all);
  var names = Object.keys(groups).filter(function (n) { return n.toLowerCase().indexOf(q) >= 0; });
  names.sort(function (a, b) {
    var la = groups[a][groups[a].length - 1].timestamp, lb = groups[b][groups[b].length - 1].timestamp;
    return lb - la;
  });
  box.innerHTML = '';
  if (!names.length) { box.appendChild(el('div', 'empty', 'No contacts yet')); return; }
  names.forEach(function (n) {
    var msgs = groups[n];
    var last = msgs[msgs.length - 1];
    var row = el('div', 'contactRow' + (n === (prefix === 'wa' ? waSel : igSel) ? ' sel' : ''));
    row.appendChild(el('div', 'contactName', n));
    row.appendChild(el('div', 'contactPrev', last.message));
    row.onclick = function () {
      if (prefix === 'wa') waSel = n; else igSel = n;
      renderContacts(prefix); renderThread(prefix);
      if (window.innerWidth <= 700) {
        $(prefix + 'Contacts').classList.add('hideOnMobile');
        $(prefix + 'ThreadCol').classList.remove('hideOnMobile');
      }
    };
    box.appendChild(row);
  });
}
function renderThread(prefix) {
  var all = prefix === 'wa' ? waAll : igAll;
  var sel = prefix === 'wa' ? waSel : igSel;
  var msgsBox = $(prefix + 'Msgs');
  var replyRow = $(prefix + 'ReplyRow');
  msgsBox.innerHTML = '';
  if (!sel) { msgsBox.appendChild(el('div', 'empty', 'Select a contact')); replyRow.style.display = 'none'; return; }
  var msgs = all.filter(function (m) { return m.sender === sel; }).sort(function (a, b) { return a.timestamp - b.timestamp; });
  msgs.forEach(function (m) {
    var b = el('div', 'bubble');
    b.appendChild(el('div', '', m.message));
    b.appendChild(el('div', 'bubbleTime', new Date(m.timestamp).toLocaleString()));
    msgsBox.appendChild(b);
  });
  msgsBox.scrollTop = msgsBox.scrollHeight;
  replyRow.style.display = 'flex';
}
['wa', 'ig'].forEach(function (prefix) {
  $(prefix + 'Search').oninput = function () { renderContacts(prefix); };
  $(prefix + 'ReplySend').onclick = function () {
    var sel = prefix === 'wa' ? waSel : igSel;
    var text = $(prefix + 'ReplyText').value.trim();
    if (!sel || !text) return;
    sendTo([selectedId()], { type: 'send_reply', app: prefix === 'wa' ? 'whatsapp' : 'instagram', contact: sel, text: text });
    $(prefix + 'ReplyText').value = '';
  };
  $(prefix + 'Back').onclick = function () {
    $(prefix + 'Contacts').classList.remove('hideOnMobile');
    $(prefix + 'ThreadCol').classList.add('hideOnMobile');
  };
});

function handle(m) {
  var from = m.from;
  if (from && known[from]) known[from].lastSeen = Date.now();

  if (m.type === 'devices') updateDevices(m.phones);
  else if (m.type === 'error') {
    if (m.error === 'no_accessibility') { $('screenEmpty').style.display = 'block'; $('screenEmpty').textContent = 'Enable "Screen & remote control" on the phone first.'; }
    else log(m.error === 'phone_offline' ? 'That phone is offline' : ('Error: ' + m.error), 'err');
  }
  else if (m.type === 'status') { phoneStatus[from] = m; renderCards(); }
  else if (m.type === 'info') log(nameOf(from) + ': ' + (m.reply || ''));
  else if (m.type === 'result') renderPhotos({ from: from, photos: m.photos, reply: m.reply });
  else if (m.type === 'photo') showFull(m.data);
  else if (m.type === 'video_data') { var a = document.createElement('a'); a.href = 'data:video/mp4;base64,' + m.data; a.download = 'haiderbrain-video.mp4'; a.click(); log(nameOf(from) + ': video downloaded'); }
  else if (m.type === 'videos') renderVideos({ from: from, items: m.items, hasMore: m.hasMore }, (m.offset || 0) > 0);
  else if (m.type === 'messages') {
    if (m.scope === 'whatsapp') { if ((m.offset || 0) === 0) waAll = (m.items || []).slice(); else waAll = waAll.concat(m.items || []); renderContacts('wa'); if (waSel) renderThread('wa'); if (!waAll.length) { $('waContacts').innerHTML = ''; $('waContacts').appendChild(el('div', 'empty', 'No WhatsApp messages yet. Check Notification access is ON.')); } }
    else if (m.scope === 'instagram') { if ((m.offset || 0) === 0) igAll = (m.items || []).slice(); else igAll = igAll.concat(m.items || []); renderContacts('ig'); if (igSel) renderThread('ig'); if (!igAll.length) { $('igContacts').innerHTML = ''; $('igContacts').appendChild(el('div', 'empty', 'No Instagram messages yet. Check Notification access is ON.')); } }
  }
  else if (m.type === 'new_message') addLive(m);
  else if (m.type === 'call_log') renderCalls({ from: from, items: m.items });
  else if (m.type === 'location') renderLocation(m);
  else if (m.type === 'files') renderFiles({ from: from, items: m.items });
  else if (m.type === 'file_data') { var a2 = document.createElement('a'); a2.href = 'data:application/octet-stream;base64,' + m.data; a2.download = 'haiderbrain-file'; a2.click(); }
  else if (m.type === 'clipboard') $('clipResult').textContent = 'Clipboard: ' + (m.text || '(empty)');
  else if (m.type === 'sms') {
    var box = $('smsList'); box.innerHTML = '';
    var items = m.items || [];
    $('smsEmpty').style.display = items.length ? 'none' : 'block';
    items.forEach(function (s) { box.appendChild(el('div', 'line', esc(s.address) + ' (' + s.type + '): ' + esc(s.body))); });
  }
  else if (m.type === 'apps') renderApps({ from: from, items: m.items });
  else if (m.type === 'usage') renderUsage(m);
  else if (m.type === 'screen_frame') {
    $('screenEmpty').style.display = 'none';
    $('screenImg').style.display = 'block';
    $('screenImg').src = 'data:image/jpeg;base64,' + m.data;
    $('screenImg').dataset.from = from;
  }
}

// ---------- connection ----------
function openSocket(token) {
  if (ws) { try { ws.onclose = null; ws.close(); } catch (e) {} }
  var proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
  var url = proto + location.host + '/ws?role=laptop&id=' + encodeURIComponent(laptopId) + '&name=Laptop&token=' + encodeURIComponent(token);
  ws = new WebSocket(url);
  ws.onopen = function () {
    $('relay').textContent = 'connected';
    clearInterval(pingTimer); pingTimer = setInterval(function () { if (ws && ws.readyState === 1) ws.send('ping'); }, 25000);
    clearInterval(statusTimer); statusTimer = setInterval(requestStatus, 60000);
  };
  ws.onmessage = function (e) { if (e.data === 'pong') return; var m; try { m = JSON.parse(e.data); } catch (x) { return; } handle(m); };
  ws.onclose = function () {
    $('relay').textContent = 'disconnected (check token)';
    online = []; renderCards();
    clearInterval(pingTimer); clearInterval(statusTimer);
    if (wantOpen) { clearTimeout(retry); retry = setTimeout(function () { openSocket(token); }, 3000); }
  };
}
$('connect').onclick = function () {
  var token = $('token').value.trim();
  if (!token) { log('Enter the pairing token', 'err'); return; }
  var s = store();
  if ($('remember').checked) { s.setItem('hb_token', token); s.setItem('hb_remember', '1'); }
  else { s.removeItem('hb_token'); s.removeItem('hb_remember'); }
  try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
  wantOpen = true; openSocket(token);
};

// ---------- screen controls ----------
$('screenImg').addEventListener('mousedown', function (e) {
  var r = e.target.getBoundingClientRect();
  screenTapStart = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
});
$('screenImg').addEventListener('mouseup', function (e) {
  if (!screenTapStart) return;
  var r = e.target.getBoundingClientRect();
  var end = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  var from = e.target.dataset.from;
  if (!from) return;
  var dist = Math.hypot(end.x - screenTapStart.x, end.y - screenTapStart.y);
  if (dist < 0.02) sendTo([from], { type: 'tap', x: end.x, y: end.y });
  else sendTo([from], { type: 'swipe', x1: screenTapStart.x, y1: screenTapStart.y, x2: end.x, y2: end.y });
  screenTapStart = null;
});
$('scBack').onclick = function () { sendTo([selectedId()], { type: 'key', action: 'back' }); };
$('scHome').onclick = function () { sendTo([selectedId()], { type: 'key', action: 'home' }); };
$('scRecents').onclick = function () { sendTo([selectedId()], { type: 'key', action: 'recents' }); };
$('scType').onclick = function () { var t = $('scText').value; if (t) { sendTo([selectedId()], { type: 'type_text', text: t }); $('scText').value = ''; } };

// ---------- location tab ----------
$('trackStart').onclick = function () { sendTo([selectedId()], { type: 'track_location_start' }); };
$('trackStop').onclick = function () { sendTo([selectedId()], { type: 'track_location_stop' }); };

// ---------- files tab ----------
$('filesGo').onclick = function () { sendTo([selectedId()], { type: 'list_files', folder: $('folderInput').value || '' }); };
$('videosMore').onclick = function () { videoOffset += 30; sendTo([selectedId()], { type: 'get_videos', offset: videoOffset }); };

// ---------- settings tab ----------
$('btnNick').onclick = function () { var n = $('setNick').value.trim(); if (n) sendTo([selectedId()], { type: 'set_nickname', name: n }); };
$('btnClipGet').onclick = function () { sendTo([selectedId()], { type: 'get_clipboard' }); };
$('btnClipSet').onclick = function () { var t = $('clipSetText').value; if (t) sendTo([selectedId()], { type: 'set_clipboard', text: t }); };
$('btnRing').onclick = function () { sendTo([selectedId()], { type: 'device_ring' }); };
$('btnRingStop').onclick = function () { sendTo([selectedId()], { type: 'device_ring_stop' }); };

function getPin() { return store().getItem('hb_pin') || ''; }
function requirePin(action) {
  var pin = getPin();
  if (!pin) { action(); return; }
  var entered = prompt('Enter your security PIN to continue:');
  if (entered === pin) action();
  else log('Wrong PIN - action cancelled', 'err');
}
$('btnLock').onclick = function () { requirePin(function () { if (confirm('Lock this phone now?')) sendTo([selectedId()], { type: 'device_lock' }); }); };
$('btnWipe').onclick = function () {
  requirePin(function () {
    if (confirm('This will FACTORY RESET the phone and erase everything. Continue?') && confirm('Really sure? This cannot be undone.'))
      sendTo([selectedId()], { type: 'device_wipe' });
  });
};
function refreshPinStatus() { $('pinStatus').textContent = getPin() ? 'PIN is set - Lock/Wipe require it' : 'No PIN set - Lock/Wipe only need the confirm dialogs'; }
$('btnPin').onclick = function () {
  var p = $('pinInput').value.trim();
  if (p.length < 4) { log('PIN must be at least 4 characters', 'err'); return; }
  store().setItem('hb_pin', p); $('pinInput').value = ''; refreshPinStatus();
};
$('btnPinClear').onclick = function () { store().removeItem('hb_pin'); refreshPinStatus(); };
refreshPinStatus();

$('btnTg').onclick = function () {
  var t = $('tgToken').value.trim(), c = $('tgChat').value.trim();
  if (t && c) sendTo([selectedId()], { type: 'set_telegram', token: t, chatId: c });
};
$('btnSched').onclick = function () {
  var mins = parseInt($('schedMin').value, 10) || 0;
  var cmd = $('schedCmd').value.trim();
  sendTo([selectedId()], { type: 'set_schedule', minutes: mins, command: cmd });
};
$('btnUsage').onclick = function () { sendTo([selectedId()], { type: 'get_usage' }); };

(function init() {
  $('cards').dataset.sel = '';
  var s = store();
  var saved = s.getItem('hb_token');
  if (saved && s.getItem('hb_remember') === '1') {
    $('token').value = saved; $('remember').checked = true; wantOpen = true; openSocket(saved);
  }
})();
</script>
</body>
</html>`;