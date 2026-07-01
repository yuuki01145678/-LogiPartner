let toteRecords = [];
let currentFilter = "all";

const DEMO_CSV = `コンテナ,CPT,ASIN,商品名,数量
tsOBdy1F150,15:00,B0CPLNTR5C,モバイルバッテリー,1
tsOBdy1F150,15:00,B0CPLNTR5C,モバイルバッテリー,1
tsOBdy1F150,15:00,B0AAA111,医薬品,1
tsOBdy1F151,16:00,B0BBB222,食品,2
tsOBdy1F151,16:00,B0CCC333,精密機器,1
tsOBdy1F152,17:30,B0DDD444,大型商品,1
tsOBdy1F153,17:45,B0EEE555,ギフト商品,1
tsOBdy1F153,17:45,B0FFF666,割れ物,1
tsOBdy1F154,17:55,B0GGG777,当日優先品,3`;

function loadDemoData() {
  processCsv(DEMO_CSV);
  document.getElementById("loadMessage").textContent = "デモCSVを読み込みました。";
}

function loadCsv(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    processCsv(reader.result);
    document.getElementById("loadMessage").textContent = file.name + " を読み込みました。";
  };
  reader.readAsText(file, "UTF-8");
}

function processCsv(text) {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    alert("CSVの中身が読み込めませんでした。");
    return;
  }

  const headers = rows[0].map(h => normalizeHeader(h));
  const dataRows = rows.slice(1).filter(r => r.some(c => String(c).trim() !== ""));

  const idx = {
    tote: findIndex(headers, ["コンテナ", "container", "tote", "トート"]),
    cpt: findIndex(headers, ["cpt", "CPT", "出荷時間", "締め時間"]),
    asin: findIndex(headers, ["asin", "ASIN"]),
    title: findIndex(headers, ["商品名", "title", "asin_titles", "ASIN_TITLES", "品名"]),
    qty: findIndex(headers, ["数量", "quantity", "qty", "個数"])
  };

  if (idx.tote < 0) {
    alert("トート/コンテナ列が見つかりませんでした。");
    return;
  }

  const grouped = {};

  for (const row of dataRows) {
    const tote = getCell(row, idx.tote) || "不明トート";
    const cpt = getCell(row, idx.cpt) || guessCptFromNow();
    const title = getCell(row, idx.title) || getCell(row, idx.asin) || "商品名なし";
    const qty = Number(getCell(row, idx.qty)) || 1;

    if (!grouped[tote]) {
      grouped[tote] = {
        toteId: tote,
        cpt,
        items: {},
        totalQty: 0,
        checked: false
      };
    }

    grouped[tote].cpt = grouped[tote].cpt || cpt;
    grouped[tote].items[title] = (grouped[tote].items[title] || 0) + qty;
    grouped[tote].totalQty += qty;
  }

  toteRecords = Object.values(grouped).map(makeToteRecord);
  sortRecords();
  renderAll();
}

function normalizeHeader(h) {
  return String(h || "").trim().replace(/^\ufeff/, "");
}

function findIndex(headers, names) {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  for (const name of names) {
    const exact = lowerHeaders.indexOf(String(name).toLowerCase());
    if (exact >= 0) return exact;
  }
  for (let i = 0; i < lowerHeaders.length; i++) {
    for (const name of names) {
      if (lowerHeaders[i].includes(String(name).toLowerCase())) return i;
    }
  }
  return -1;
}

function getCell(row, idx) {
  if (idx < 0 || idx >= row.length) return "";
  return String(row[idx] || "").trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function makeToteRecord(raw) {
  const remain = minutesUntil(raw.cpt);
  const level = getLevel(remain);
  const itemEntries = Object.entries(raw.items).sort((a, b) => b[1] - a[1]);

  return {
    ...raw,
    remain,
    level,
    priority: level === "danger" ? 1 : level === "warning" ? 2 : 3,
    itemEntries,
    priorityCount: itemEntries.reduce((sum, item) => sum + item[1], 0)
  };
}

function minutesUntil(cpt) {
  const now = new Date();
  const time = String(cpt).trim();
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 9999;

  const target = new Date(now);
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return Math.round((target - now) / 60000);
}

function getLevel(remain) {
  if (remain <= 120) return "danger";
  if (remain <= 180) return "warning";
  return "safe";
}

function formatRemain(min) {
  if (min === 9999) return "不明";
  if (min < 0) return "超過" + Math.abs(min) + "分";
  if (min < 60) return "あと" + min + "分";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return "あと" + h + "時間" + m + "分";
}

function guessCptFromNow() {
  const cpts = ["13:00", "15:00", "16:00", "17:30", "17:45", "17:50", "17:55"];
  for (const cpt of cpts) {
    if (minutesUntil(cpt) >= 0) return cpt;
  }
  return cpts[cpts.length - 1];
}

function sortRecords() {
  toteRecords.sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return a.priority - b.priority || a.remain - b.remain || b.priorityCount - a.priorityCount;
  });
}

function renderAll() {
  renderSummary();
  renderCptSummary();
  renderToteList();
}

function renderSummary() {
  document.getElementById("dangerCount").textContent = toteRecords.filter(t => t.level === "danger").length;
  document.getElementById("warningCount").textContent = toteRecords.filter(t => t.level === "warning").length;
  document.getElementById("safeCount").textContent = toteRecords.filter(t => t.level === "safe").length;
}

function renderCptSummary() {
  const box = document.getElementById("cptSummary");
  if (!toteRecords.length) {
    box.innerHTML = '<div class="empty">CSVを読み込むと表示されます。</div>';
    return;
  }

  const grouped = {};
  for (const t of toteRecords) {
    if (!grouped[t.cpt]) grouped[t.cpt] = { cpt: t.cpt, totes: 0, qty: 0, danger: 0, remain: t.remain };
    grouped[t.cpt].totes++;
    grouped[t.cpt].qty += t.totalQty;
    if (t.level === "danger") grouped[t.cpt].danger++;
  }

  const list = Object.values(grouped).sort((a, b) => a.remain - b.remain);

  box.innerHTML = list.map(g => `
    <div class="cpt-item">
      <div class="cpt-main">
        <strong>CPT ${g.cpt}</strong>
        <span>${formatRemain(g.remain)}</span>
      </div>
      <small>トート ${g.totes}件 / 商品 ${g.qty}個 / 危険 ${g.danger}件</small>
    </div>
  `).join("");
}

function setFilter(filter) {
  currentFilter = filter;
  renderToteList();
}

function renderToteList() {
  const box = document.getElementById("toteList");

  if (!toteRecords.length) {
    box.innerHTML = '<div class="empty">CSVを読み込むと表示されます。</div>';
    return;
  }

  let list = [...toteRecords];
  if (currentFilter === "danger") list = list.filter(t => t.level === "danger");
  if (currentFilter === "unchecked") list = list.filter(t => !t.checked);

  if (!list.length) {
    box.innerHTML = '<div class="empty">該当するトートはありません。</div>';
    return;
  }

  box.innerHTML = list.map(t => `
    <div class="tote-item ${t.level} ${t.checked ? "checked" : ""}">
      <div class="tote-top">
        <strong>${statusLabel(t.level)} ${t.toteId}</strong>
        <div class="remaining">${formatRemain(t.remain)}</div>
      </div>
      <div class="tote-meta">CPT：${t.cpt} / 商品合計：${t.totalQty}個 / 優先商品：${t.priorityCount}個</div>
      <div class="item-list">
        ${t.itemEntries.slice(0, 5).map(([name, qty]) => `<div class="item-chip">${escapeHtml(name)} ×${qty}</div>`).join("")}
      </div>
      <button class="check-btn" onclick="toggleChecked('${escapeAttr(t.toteId)}')">${t.checked ? "未確認に戻す" : "確認済みにする"}</button>
    </div>
  `).join("");
}

function statusLabel(level) {
  if (level === "danger") return "🔴";
  if (level === "warning") return "🟡";
  return "🟢";
}

function toggleChecked(toteId) {
  const target = toteRecords.find(t => t.toteId === toteId);
  if (!target) return;
  target.checked = !target.checked;
  sortRecords();
  renderAll();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

function escapeAttr(str) {
  return String(str).replace(/'/g, "\\'");
}
