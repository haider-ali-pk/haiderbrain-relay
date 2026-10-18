export const DASHBOARD_HTML = String.raw`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HaiderBrain Remote</title>
<style>
  body { font-family: system-ui, sans-serif; background:#111; color:#eee; max-width:860px; margin:0 auto; padding:16px; }
  h1 { font-size:20px; }
  .row { display:flex; gap:8px; margin:10px 0; align-items:center; }
  input[type=password], input[type=text], select { flex:1; padding:10px; border-radius:8px; border:1px solid #444; background:#1c1c1c; color:#eee; }
  button { padding:10px 14px; border-radius:8px; border:0; background:#6750a4; color:#fff; cursor:pointer; }
  label { font-size:13px; color:#bbb; white-space:nowrap; }
  .status span { font-weight:600; }
  .line { padding:6px 8px; margin:4px 0; border-radius:6px; background:#1c1c1c; white-space:pre-wrap; }
  .err { color:#ff8a80; }
  .me { color:#80cbc4; }
  #grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:6px; margin-top:10px; }
  #grid img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:6px; cursor:pointer; }
  #full img { max-width:100%; margin-top:10px; border-radius:8px; }
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
<div class="row">
  <label for="phone">Phone:</label>
  <select id="phone"><option value="">(no phones online)</option></select>
</div>
<div class="row">
  <input id="cmd" type="text" placeholder="Type a command, e.g. show my screenshots">
  <button id="send">Send</button>
  <button id="msgs">Messages</button>
</div>
<div id="full"></div>
<div id="grid"></div>
<div id="log"></div>

<script>
var ws = null, retry = null, pingTimer = null, wantOpen = false;
var phoneNames = {};

function $(id) { return document.getElementById(id); }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

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

function log(text, cls) {
  var d = document.createElement('div');
  d.className = 'line ' + (cls || '');
  d.textContent = text;
  $('log').prepend(d);
}

function selectedPhone() { return $('phone').value; }

function sendObj(obj) {
  if (!ws || ws.readyState !== 1) { log('Not connected', 'err'); return false; }
  var to = selectedPhone();
  if (!to) { log('No phone selected', 'err'); return false; }
  obj.to = to;
  ws.send(JSON.stringify(obj));
  return true;
}

function updateDevices(phones) {
  var sel = $('phone');
  var prev = sel.value;
  sel.innerHTML = '';
  phoneNames = {};
  if (!phones || phones.length === 0) {
    var o = document.createElement('option');
    o.value = ''; o.textContent = '(no phones online)';
    sel.appendChild(o);
    return;
  }
  phones.forEach(function (p) {
    phoneNames[p.id] = p.name;
    var o = document.createElement('option');
    o.value = p.id; o.textContent = p.name;
    sel.appendChild(o);
  });
  var still = phones.some(function (p) { return p.id === prev; });
  sel.value = still ? prev : phones[0].id;
}

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
    if (wantOpen) { clearTimeout(retry); retry = setTimeout(function () { openSocket(token); }, 3000); }
  };
}

function handle(m) {
  if (m.type === 'devices') {
    updateDevices(m.phones);
  } else if (m.type === 'error') {
    log(m.error === 'phone_offline' ? 'That phone is offline' : ('Error: ' + m.error), 'err');
  } else if (m.type === 'result') {
    log((phoneNames[m.from] || 'Phone') + ': ' + (m.reply || ''));
    var grid = $('grid');
    grid.innerHTML = '';
    (m.photos || []).forEach(function (p) {
      var img = document.createElement('img');
      img.src = 'data:image/jpeg;base64,' + p.thumb;
      img.title = p.name || '';
      img.onclick = function () { sendObj({ type: 'get_photo', id: uid(), photoId: p.id }); };
      grid.appendChild(img);
    });
  } else if (m.type === 'photo') {
    var full = $('full');
    full.innerHTML = '';
    var big = document.createElement('img');
    big.src = 'data:image/jpeg;base64,' + m.data;
    big.onclick = function () { full.innerHTML = ''; };
    full.appendChild(big);
  } else if (m.type === 'messages') {
    if (!m.items || m.items.length === 0) { log('No messages'); return; }
    m.items.forEach(function (it) {
      log('[' + (phoneNames[m.from] || 'Phone') + ' / ' + it.app + '] ' + it.sender + ': ' + it.message);
    });
  }
}

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
  wantOpen = true;
  openSocket(token);
};

function sendCommand() {
  var text = $('cmd').value.trim();
  if (!text) return;
  if (sendObj({ type: 'command', id: uid(), text: text })) {
    log('You: ' + text, 'me');
    $('cmd').value = '';
  }
}
$('send').onclick = sendCommand;
$('cmd').onkeydown = function (e) { if (e.key === 'Enter') sendCommand(); };
$('msgs').onclick = function () { sendObj({ type: 'get_messages', id: uid() }); };

(function init() {
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