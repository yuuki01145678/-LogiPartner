let html5QrCode = null;
let scannerRunning = false;
let nativeStream = null;
let nativeDetector = null;
let nativeLoopRunning = false;

let totes = JSON.parse(localStorage.getItem("logipartner_totes_v22") || "[]");
let lastScannedText = "";
let lastScannedAt = 0;

const CPT_TIMES = ["13:00", "15:00", "16:00", "17:30", "17:45", "17:50", "17:55"];

const TOTE_SAMPLE_DB = {
  "tsOBdy2F089": {
    cpt: "15:00",
    items: ["モバイルバッテリー", "医薬品", "精密機器"]
  },
  "DEMO-TOTE-001": {
    cpt: "17:30",
    items: ["食品", "大型商品"]
  },
  "DEMO-TOTE-002": {
    cpt: "17:45",
    items: ["ギフト商品", "割れ物", "高単価商品", "当日優先品"]
  }
};

window.addEventListener("load", () => {
  renderDashboard();
});

function minutesUntil(timeText) {
  const now = new Date();
  const [h, m] = timeText.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.round((target - now) / 60000);
}

function judgeByCpt(cpt) {
  const remain = minutesUntil(cpt);
  if (remain <= 120) return { level: "danger", label: "🔴 危険", priority: 1 };
  return { level: "safe", label: "🟢 通常", priority: 2 };
}

function nowTime() {
  const now = new Date();
  return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
}

function formatRemain(min) {
  if (min < 0) return "超過" + Math.abs(min) + "分";
  if (min < 60) return "あと" + min + "分";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return "あと" + h + "時間" + m + "分";
}

function makeRecord(toteId, cpt, items, checker) {
  const judged = judgeByCpt(cpt);
  return {
    toteId,
    cpt,
    remain: minutesUntil(cpt),
    items,
    priorityCount: items.length,
    checker,
    checkedAt: nowTime(),
    level: judged.level,
    label: judged.label,
    priority: judged.priority
  };
}

function saveTotes() {
  totes.sort((a, b) => a.priority - b.priority || a.remain - b.remain || b.priorityCount - a.priorityCount);
  localStorage.setItem("logipartner_totes_v22", JSON.stringify(totes));
}

function addOrUpdateTote(toteId, cpt, items, checker) {
  const record = makeRecord(toteId, cpt, items, checker);
  const existingIndex = totes.findIndex(t => t.toteId === toteId);

  if (existingIndex >= 0) totes[existingIndex] = record;
  else totes.push(record);

  saveTotes();
  showCurrent(record);
  renderDashboard();
}

function showCurrent(record) {
  const card = document.getElementById("currentTote");
  card.className = "current-card " + record.level;

  document.getElementById("currentStatus").textContent = record.label;
  document.getElementById("currentToteId").textContent = record.toteId;
  document.getElementById("currentCpt").textContent = record.cpt;
  document.getElementById("currentRemain").textContent = formatRemain(record.remain);
  document.getElementById("currentPriorityCount").textContent = record.priorityCount + "個";

  document.getElementById("priorityItems").innerHTML =
    record.items.length
      ? record.items.map(item => `<div class="item-chip">${item}</div>`).join("")
      : "優先商品なし";
}

function renderDashboard() {
  totes = totes.map(t => makeRecord(t.toteId, t.cpt, t.items, t.checker));
  saveTotes();

  document.getElementById("redCount").textContent = totes.filter(t => t.level === "danger").length + "件";
  document.getElementById("greenCount").textContent = totes.filter(t => t.level === "safe").length + "件";

  const list = document.getElementById("toteList");

  if (totes.length === 0) {
    list.innerHTML = '<div class="tote-item"><div class="tote-main"><strong>まだ記録がありません</strong></div><span>トートをスキャンするとここに表示されます。</span></div>';
    return;
  }

  list.innerHTML = totes.map(t => `
    <div class="tote-item ${t.level}">
      <div class="tote-main">
        <strong>${t.label}｜${t.toteId}</strong>
        <div class="remaining">${formatRemain(t.remain)}</div>
      </div>
      <span>CPT：${t.cpt} / 優先商品：${t.priorityCount}個</span>
      <span>商品名：${t.items.slice(0, 3).join("、")}${t.items.length > 3 ? " ほか" : ""}</span>
      <span>最終確認：${t.checker} ${t.checkedAt}</span>
    </div>
  `).join("");
}

function getToteInfo(toteId) {
  if (TOTE_SAMPLE_DB[toteId]) return TOTE_SAMPLE_DB[toteId];

  let sum = 0;
  for (let i = 0; i < toteId.length; i++) sum += toteId.charCodeAt(i);

  const cpt = CPT_TIMES[sum % CPT_TIMES.length];
  const itemPool = ["医薬品", "食品", "モバイルバッテリー", "精密機器", "大型商品", "割れ物", "ギフト商品", "当日優先品"];
  const count = 1 + (sum % 4);
  const items = [];
  for (let i = 0; i < count; i++) items.push(itemPool[(sum + i) % itemPool.length]);

  return { cpt, items };
}

function handleScannedCode(decodedText) {
  const now = Date.now();
  const cleanText = decodedText.trim();

  if (!cleanText) return;
  if (cleanText === lastScannedText && now - lastScannedAt < 1800) return;

  lastScannedText = cleanText;
  lastScannedAt = now;

  const checker = document.getElementById("checker").value;
  const info = getToteInfo(cleanText);

  document.getElementById("quickToteInput").value = cleanText;
  document.getElementById("toteInput").value = cleanText;
  document.getElementById("cptInput").value = info.cpt;
  document.getElementById("itemsInput").value = info.items.join(", ");

  addOrUpdateTote(cleanText, info.cpt, info.items, checker);

  if (navigator.vibrate) navigator.vibrate(120);

  document.getElementById("scanMessage").textContent =
    "読み取り成功：" + cleanText + "　次のトートをそのまま映してください。";
}

function quickManualAdd() {
  const toteId = document.getElementById("quickToteInput").value || "未入力";
  const checker = document.getElementById("checker").value;
  const info = getToteInfo(toteId);
  addOrUpdateTote(toteId, info.cpt, info.items, checker);
}

function manualAdd() {
  const toteId = document.getElementById("toteInput").value || "未入力";
  const cpt = document.getElementById("cptInput").value;
  const items = document.getElementById("itemsInput").value.split(",").map(s => s.trim()).filter(Boolean);
  const checker = document.getElementById("checker").value;
  addOrUpdateTote(toteId, cpt, items, checker);
}

async function startNativeScanner() {
  await stopHtmlScanner();

  const scanMessage = document.getElementById("scanMessage");
  const nativeScanner = document.getElementById("nativeScanner");
  const htmlScanner = document.getElementById("htmlScanner");
  const video = document.getElementById("video");

  nativeScanner.style.display = "block";
  htmlScanner.style.display = "none";
  scanMessage.textContent = "高精度カメラを起動しています。";

  if (!("BarcodeDetector" in window)) {
    scanMessage.textContent = "このブラウザは高精度方式に未対応です。「別方式で試す」を押してください。";
    return;
  }

  try {
    nativeDetector = new BarcodeDetector({
      formats: ["code_128", "code_39", "itf", "codabar", "ean_13", "ean_8", "upc_a", "upc_e"]
    });

    nativeStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        focusMode: "continuous"
      },
      audio: false
    });

    video.srcObject = nativeStream;
    await video.play();

    nativeLoopRunning = true;
    scanMessage.textContent = "高精度スキャン中。バーコード全体を緑枠に合わせてください。";
    nativeScanLoop();
  } catch (err) {
    scanMessage.textContent = "高精度カメラを起動できませんでした。「別方式で試す」を押してください。";
  }
}

async function nativeScanLoop() {
  const video = document.getElementById("video");

  while (nativeLoopRunning) {
    try {
      const barcodes = await nativeDetector.detect(video);
      if (barcodes && barcodes.length > 0) {
        const value = barcodes[0].rawValue || "";
        handleScannedCode(value);
      }
    } catch (err) {}

    await new Promise(resolve => setTimeout(resolve, 180));
  }
}

async function startHtmlScanner() {
  await stopNativeScanner();

  const htmlScanner = document.getElementById("htmlScanner");
  const nativeScanner = document.getElementById("nativeScanner");
  const scanMessage = document.getElementById("scanMessage");

  htmlScanner.style.display = "block";
  nativeScanner.style.display = "none";
  scanMessage.textContent = "別方式カメラを起動しています。";

  if (!window.Html5Qrcode) {
    scanMessage.textContent = "読み取り機能の読み込みに失敗しました。少し待ってから再読み込みしてください。";
    return;
  }

  if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

  if (scannerRunning) {
    scanMessage.textContent = "すでにスキャン中です。";
    return;
  }

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: { width: 320, height: 95 },
        aspectRatio: 1.7777778,
        disableFlip: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E
        ]
      },
      (decodedText) => handleScannedCode(decodedText),
      () => {}
    );

    scannerRunning = true;
    scanMessage.textContent = "別方式でスキャン中。バーコード全体を横長枠へ。";
  } catch (err) {
    scanMessage.textContent = "カメラを起動できませんでした。ページ更新・カメラ許可・HTTPSを確認してください。";
    scannerRunning = false;
  }
}

async function stopNativeScanner() {
  nativeLoopRunning = false;

  if (nativeStream) {
    nativeStream.getTracks().forEach(track => track.stop());
    nativeStream = null;
  }

  const video = document.getElementById("video");
  if (video) video.srcObject = null;
}

async function stopHtmlScanner() {
  if (html5QrCode && scannerRunning) {
    try { await html5QrCode.stop(); } catch (err) {}
  }
  scannerRunning = false;
}

async function stopAllScanners() {
  await stopNativeScanner();
  await stopHtmlScanner();

  document.getElementById("scanMessage").textContent = "スキャンを停止しました。";
}
