(async () => {
  const id = new URLSearchParams(location.search).get('tabId');
  if (!id) return;
  const data = (await browser.storage.local.get(id))[id];
  if (!data) return;

  document.getElementById('fullUrl').textContent = data.url || '';
  const badge = document.getElementById('riskBadge');
  badge.textContent = data.res.level;
  badge.className = 'badge ' + (data.res.level === "High Risk" ? 'high' : data.res.level === "Suspicious" ? 'sus' : 'safe');
  document.getElementById('score').textContent = String(data.res?.score ?? '-');

  // Pros vs Cons
  const pros = data.res.level === "Safe" ? ["Secure HTTPS connection", "No detected risks"] : [];
  const cons = data.res.issues || ["No issues found"];
  document.getElementById('pros').innerHTML = pros.join("<br>") || "—";
  document.getElementById('cons').innerHTML = cons.join("<br>") || "—";

  // URL Breakdown
  try {
    const u = new URL(data.url);
    document.getElementById('urlParts').textContent = `
protocol: ${u.protocol}
host: ${u.host}
hostname: ${u.hostname}
port: ${u.port || '(default)'}
path: ${u.pathname || '/'}
query: ${u.search || '(none)'}
hash: ${u.hash || '(none)'}`;
  } catch { document.getElementById('urlParts').textContent = 'Unable to parse URL.'; }

  // History
  const history = document.getElementById('history');
  (data.hist || []).forEach(h => {
    const li = document.createElement('li');
    li.textContent = `[${h.level}] ${new Date(h.time).toLocaleString()} - ${h.url}`;
    history.appendChild(li);
  });
})();
