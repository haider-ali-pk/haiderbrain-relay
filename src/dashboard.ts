export const DASHBOARD_HTML = String.raw`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HaiderBrain Remote</title>
<style>
  body { font-family: system-ui, sans-serif; background:#111; color:#eee; max-width:960px; margin:0 auto; padding:16px; }
  h1 { font-size:20px; margin:0 0 8px; }
  h3 { font-size:15px; margin:16px 0 6px; color:#bbb; }
  .row { display:flex; gap:8px; margin:10px 0; align-items:center; flex-wrap:wrap; }
  input[type=password], input[type=text], select { flex:1; min-width:160px; padding:10px; border-radius:8px; border:1px solid #444; background:#1c1c1c; color:#eee; }
  button, a.btn { padding:10px 14px; border-radius:8px; border:0; background:#6750a4; color:#fff; cursor:pointer; text-decoration:none; font-size:14px; }
  button.small { padding:4px 10px; font-size:12px; background:#3a3a3a; }
  label { font-size:13px; color:#bbb; white-space:nowrap; }
  .status span { font-weight:600; }
  .line { padding:6px 8px; margin:4px 0; border-radius:6px; background:#1c1c1c; white-space:pre-wrap; display:flex; gap:8px; justify-content:space-between; align-items:center; }
  .err { color:#ff8a80; }
  .me { color:#80cbc4; }
  #cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px; margin:10px 0; }
  .card { padding:10px; border-radius:10px; background:#1c1c1c; border:1px solid #333; cursor:pointer; }
  .card.off { opacity:0.55; cursor:default; }
  .card.sel { border-color:#9a82db; }
  .cname { font-weight:600; }
  .csub { font-size:12px; color:#aaa; margin-top:4px; }
  .dot { display:inline-block; width:9px; height:9px; border-radius:50%; margin-right:6px; background:#555; }
  .card.on .dot { background:#4caf50; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:6px; margin-top:6px; }
  .grid img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:6px; cursor:pointer; }
  #full img { max-width:100%; margin-top:10px; border-radius:8px; }
  #full .row { margin:10px 0 0; }
</style>
</head>
<body>
<h1>HaiderBrain Remote</h1>
<div class="row">
  <input id="token" type="password" placeholder="Pairing token">
  <label><input id="remember" type="checkbox"> Remember on this browser</label>
  <button id="connect">Connect</button>
</div>
<div class="status">Relay: <span id="relay">disconnected</span></div>

<div id="cards"></div>

<div class="row">
  <label for="phone">Phone:</label>
  <select id="phone"><option value="">(no phones online)</option></select>
  <label><input id="all" type="checkbox"> Search all phones</label>
  <button id="rename" class="small">Rename phone</button>
</div>
<div class="row">
  <input id="cmd" type="text" placeholder="Type a command, e.g. show my screenshots">
  <button id="send">Send</button>
  <button id="msgs">Messages</button>
</div>

<div id="full"></div>
<div id="results"></div>

<h3>Live messages</h3>
<div id="live"></div>

<h3>Log</h3>
<div id="log"></div>

<script>
var ws = null, retry = null, pingTimer = null, statusTimer = null, wantOpen = false;
var online = [];     // [{id, name}] phones online now
var phoneStatus = {}; // id -> {battery, charging}
var known = {};      // id -> {name, lastSeen}

function $(id) { return document.getElementById(id); }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined && text !== null) e.textContent = text;
  return e;
}

function store() {
  try { localStorage.setItem('hb_probe', '1'); localStorage.removeItem('hb_probe'); return localStorage; }
  catch (e) { return sessionStorage; }
}

var laptopId = (function () {
  var s = store();
  var id = s.getItem('hb_laptop_id');
  if (!id) { id = 'laptop-' + uid(); s.setItem('hb_laptop_id', id); }
  return id;
})();

try { known = JSON.parse(store().getItem('hb_known') || '{}'); } catch (e) { known = {}; }
function saveKnown() { try { store().setItem('hb_known', JSON.stringify(known)); } catch (e) {} }

function log(text, cls) {
  var d = el('div', 'line ' + (cls || ''), text);
  $('log').prepend(d);
  while ($('log').children.length > 60) $('log').removeChild($('log').lastChild);
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
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: body });
    }
  } catch (e) {}
}

// ---------- sending ----------

function targets() {
  if ($('all').checked) return online.map(function (p) { return p.id; });
  var v = $('phone').value;
  return v ? [v] : [];
}

function sendTo(ids, obj, quiet) {
  if (!ws || ws.readyState !== 1) { if (!quiet) log('Not connected', 'err'); return false; }
  if (!ids.length) { if (!quiet) log('No phone online', 'err'); return false; }
  ids.forEach(function (id) {
    var o = {};
    for (var k in obj) o[k] = obj[k];
    o.to = id;
    o.id = uid();
    ws.send(JSON.stringify(o));
  });
  return true;
}

function requestStatus() {
  sendTo(online.map(function (p) { return p.id; }), { type: 'get_status' }, true);
}

// ---------- phone list / cards ----------

function renderCards() {
  var box = $('cards');
  box.innerHTML = '';
  var onlineIds = {};
  online.forEach(function (p) { onlineIds[p.id] = true; });
  var selected = $('phone').value;

  Object.keys(known).forEach(function (id) {
    var isOn = !!onlineIds[id];
    var c = el('div', 'card ' + (isOn ? 'on' : 'off') + (isOn && id === selected ? ' sel' : ''));
    var title = el('div', 'cname');
    title.appendChild(el('span', 'dot'));
    title.appendChild(document.createTextNode(known[id].name));
    c.appendChild(title);

    var st = phoneStatus[id];
    var line;
    if (isOn) {
      line = (st && st.battery >= 0)
        ? 'Online - battery ' + st.battery + '%' + (st.charging ? ' (charging)' : '')
        : 'Online';
    } else {
      line = 'Offline - last seen ' + ago(known[id].lastSeen);
    }
    c.appendChild(el('div', 'csub', line));

    if (isOn) {
      c.onclick = function () { $('phone').value = id; renderCards(); };
    } else {
      var f = el('button', 'small', 'Forget');
      f.style.marginTop = '6px';
      f.onclick = function () { delete known[id]; saveKnown(); renderCards(); };
      c.appendChild(f);
    }
    box.appendChild(c);
  });
}

function updateDevices(phones) {
  var now = Date.now();
  var newIds = {};
  (phones || []).forEach(function (p) { newIds[p.id] = true; });
  online.forEach(function (p) {
    if (!newIds[p.id] && known[p.id]) known[p.id].lastSeen = now; // just went offline
  });
  online = phones || [];
  online.forEach(function (p) { known[p.id] = { name: p.name, lastSeen: now }; });
  saveKnown();

  var sel = $('phone');
  var prev = sel.value;
  sel.innerHTML = '';
  if (online.length === 0) {
    var o = el('option', '', '(no phones online)');
    o.value = '';
    sel.appendChild(o);
  } else {
    online.forEach(function (p) {
      var o2 = el('option', '', p.name);
      o2.value = p.id;
      sel.appendChild(o2);
    });
    var still = online.some(function (p) { return p.id === prev; });
    sel.value = still ? prev : online[0].id;
  }
  renderCards();
  requestStatus();
}

// ---------- results ----------

function section(id) {
  var s = document.getElementById('sec-' + id);
  if (!s) {
    s = el('div', 'sec');
    s.id = 'sec-' + id;
    s.appendChild(el('h3', 'sh', nameOf(id)));
    s.appendChild(el('div', 'grid'));
    $('results').appendChild(s);
  }
  return s;
}

function showFull(m) {
  var full = $('full');
  full.innerHTML = '';
  var url = 'data:image/jpeg;base64,' + m.data;
  var bar = el('div', 'row');
  var dl = el('a', 'btn', 'Download');
  dl.href = url;
  dl.download = 'haiderbrain-photo.jpg';
  var close = el('button', 'small', 'Close');
  close.onclick = function () { full.innerHTML = ''; };
  bar.appendChild(dl);
  bar.appendChild(close);
  var img = document.createElement('img');
  img.src = url;
  full.appendChild(bar);
  full.appendChild(img);
}

function addLive(m) {
  var d = el('div', 'line');
  d.appendChild(el('div', '', '[' + nameOf(m.from) + ' / ' + m.app + '] ' + m.sender + ': ' + m.message));
  var b = el('button', 'small', 'Reply');
  b.onclick = function () {
    var text = prompt('Reply to ' + m.sender + ':');
    if (text && text.trim()) {
      sendTo([m.from], { type: 'send_reply', app: String(m.app || '').toLowerCase(), contact: m.sender, text: text.trim() });
    }
  };
  d.appendChild(b);
  $('live').prepend(d);
  while ($('live').children.length > 30) $('live').removeChild($('live').lastChild);
  notify(m.sender + ' (' + nameOf(m.from) + ')', m.message);
}

function handle(m) {
  var from = m.from;
  if (from && known[from]) known[from].lastSeen = Date.now();

  if (m.type === 'devices') {
    updateDevices(m.phones);
  } else if (m.type === 'error') {
    log(m.error === 'phone_offline' ? 'That phone is offline' : ('Error: ' + m.error), 'err');
  } else if (m.type === 'status') {
    phoneStatus[from] = { battery: m.battery, charging: m.charging };
    renderCards();
  } else if (m.type === 'info') {
    log(nameOf(from) + ': ' + (m.reply || ''));
  } else if (m.type === 'result') {
    var s = section(from);
    s.querySelector('.sh').textContent = nameOf(from) + ' - ' + (m.reply || '');
    var g = s.querySelector('.grid');
    g.innerHTML = '';
    (m.photos || []).forEach(function (p) {
      var img = document.createElement('img');
      img.src = 'data:image/jpeg;base64,' + p.thumb;
      img.title = p.name || '';
      img.onclick = function () { sendTo([from], { type: 'get_photo', photoId: p.id }); };
      g.appendChild(img);
    });
  } else if (m.type === 'photo') {
    showFull(m);
  } else if (m.type === 'messages') {
    if (!m.items || m.items.length === 0) { log(nameOf(from) + ': no messages'); return; }
    m.items.forEach(function (it) {
      log('[' + nameOf(from) + ' / ' + it.app + '] ' + it.sender + ': ' + it.message);
    });
  } else if (m.type === 'new_message') {
    addLive(m);
  }
}

// ---------- connection ----------

function openSocket(token) {
  if (ws) { try { ws.onclose = null; ws.close(); } catch (e) {} }
  var proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
  var url = proto + location.host + '/ws?role=laptop&id=' + encodeURIComponent(laptopId) +
            '&name=Laptop&token=' + encodeURIComponent(token);
  ws = new WebSocket(url);
  ws.onopen = function () {
    $('relay').textContent = 'connected';
    clearInterval(pingTimer);
    pingTimer = setInterval(function () { if (ws && ws.readyState === 1) ws.send('ping'); }, 25000);
    clearInterval(statusTimer);
    statusTimer = setInterval(requestStatus, 60000);
  };
  ws.onmessage = function (e) {
    if (e.data === 'pong') return;
    var m;
    try { m = JSON.parse(e.data); } catch (x) { return; }
    handle(m);
  };
  ws.onclose = function () {
    $('relay').textContent = 'disconnected (check token)';
    updateDevices([]);
    clearInterval(pingTimer);
    clearInterval(statusTimer);
    if (wantOpen) { clearTimeout(retry); retry = setTimeout(function () { openSocket(token); }, 3000); }
  };
}

// ---------- buttons ----------

$('connect').onclick = function () {
  var token = $('token').value.trim();
  if (!token) { log('Enter the pairing token', 'err'); return; }
  var s = store();
  if ($('remember').checked) {
    s.setItem('hb_token', token);
    s.setItem('hb_remember', '1');
  } else {
    s.removeItem('hb_token');
    s.removeItem('hb_remember');
  }
  try {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  } catch (e) {}
  wantOpen = true;
  openSocket(token);
};

function sendCommand() {
  var text = $('cmd').value.trim();
  if (!text) return;
  var ids = targets();
  if (sendTo(ids, { type: 'command', text: text })) {
    $('results').innerHTML = '';
    $('full').innerHTML = '';
    log('You (' + (ids.length > 1 ? 'all phones' : nameOf(ids[0])) + '): ' + text, 'me');
    $('cmd').value = '';
  }
}
$('send').onclick = sendCommand;
$('cmd').onkeydown = function (e) { if (e.key === 'Enter') sendCommand(); };
$('msgs').onclick = function () { sendTo(targets(), { type: 'get_messages' }); };
$('phone').onchange = renderCards;

$('rename').onclick = function () {
  var id = $('phone').value;
  if (!id) { log('Pick a phone first', 'err'); return; }
  var n = prompt('New name for this phone:', nameOf(id));
  if (n && n.trim()) sendTo([id], { type: 'set_nickname', name: n.trim() });
};

(function init() {
  renderCards();
  var s = store();
  var saved = s.getItem('hb_token');
  if (saved && s.getItem('hb_remember') === '1') {
    $('token').value = saved;
    $('remember').checked = true;
    wantOpen = true;
    openSocket(saved);
  }
})();
</script>
</body>
</html>`;