let html5QrCode = null;
let scannerRunning = false;
let packages = JSON.parse(localStorage.getItem("logipartner_packages_v12") || "[]");
let lastScannedText = "";
let lastScannedAt = 0;

window.addEventListener("load", () => {
  renderDashboard();
});

function formatMinutes(min) {
  const safeMin = Number.isFinite(min) ? Math.max(0, Math.floor(min)) : 0;
  const h = Math.floor(safeMin / 60);
  const m = safeMin % 60;
  if (h <= 0) return m + "分";
  return h + "時間" + m + "分";
}

function judge(cpt, stay) {
  if (cpt < 30 || stay >= 180) return { level: "danger", label: "🔴 危険", priority: 1 };
  if (cpt < 60 || stay >= 120) return { level: "warning", label: "🟡 注意", priority: 2 };
  return { level: "safe", label: "🟢 安全", priority: 3 };
}

function nowTime() {
  const now = new Date();
  return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
}

function makeRecord(barcode, cpt, stay, checker) {
  const judged = judge(Number(cpt), Number(stay));
  return {
    barcode,
    cpt: Number(cpt),
    stay: Number(stay),
    checker,
    checkedAt: nowTime(),
    level: judged.level,
    label: judged.label,
    priority: judged.priority
  };
}

function savePackages() {
  packages.sort((a, b) => a.priority - b.priority || a.cpt - b.cpt || b.stay - a.stay);
  localStorage.setItem("logipartner_packages_v12", JSON.stringify(packages));
}

function addOrUpdatePackage() {
  const barcode = document.getElementById("barcode").value || "未入力";
  const cpt = Number(document.getElementById("cpt").value);
  const stay = Number(document.getElementById("stay").value);
  const checker = document.getElementById("checker").value;

  const record = makeRecord(barcode, cpt, stay, checker);
  const existingIndex = packages.findIndex(p => p.barcode === barcode);

  if (existingIndex >= 0) packages[existingIndex] = record;
  else packages.push(record);

  savePackages();
  renderDashboard();
}

function renderDashboard() {
  document.getElementById("redCount").textContent = packages.filter(p => p.level === "danger").length + "件";
  document.getElementById("yellowCount").textContent = packages.filter(p => p.level === "warning").length + "件";
  document.getElementById("greenCount").textContent = packages.filter(p => p.level === "safe").length + "件";

  const list = document.getElementById("packageList");

  if (packages.length === 0) {
    list.innerHTML = '<div class="package-item"><div class="package-main"><strong>まだ記録がありません</strong></div><span>スキャンするとここに表示されます。</span></div>';
    return;
  }

  list.innerHTML = packages.map(p => `
    <div class="package-item ${p.level}">
      <div class="package-main">
        <strong>${p.barcode}</strong>
        <div class="remaining">あと${p.cpt}分</div>
      </div>
      <span>${p.label} / 滞留：${formatMinutes(p.stay)}</span>
      <span>最終確認：${p.checker} ${p.checkedAt}</span>
    </div>
  `).join("");
}

function fakeCptAndStayFromBarcode(barcode) {
  let sum = 0;
  for (let i = 0; i < barcode.length; i++) sum += barcode.charCodeAt(i);
  document.getElementById("cpt").value = 10 + (sum % 100);
  document.getElementById("stay").value = 15 + (sum % 210);
}

function handleScannedCode(decodedText) {
  const now = Date.now();

  if (decodedText === lastScannedText && now - lastScannedAt < 1800) return;
  lastScannedText = decodedText;
  lastScannedAt = now;

  document.getElementById("barcode").value = decodedText;
  fakeCptAndStayFromBarcode(decodedText);
  addOrUpdatePackage();

  if (navigator.vibrate) navigator.vibrate(120);

  document.getElementById("scanMessage").textContent =
    "読み取り成功：" + decodedText + "　次の荷物をそのまま映してください。";
}

function demoScan() {
  const demoCode = "DEMO-" + Math.floor(100000 + Math.random() * 900000);
  handleScannedCode(demoCode);
}

async function startScanner() {
  const scannerWrap = document.getElementById("scannerWrap");
  const scanMessage = document.getElementById("scanMessage");

  scannerWrap.style.display = "block";
  scanMessage.textContent = "カメラを起動しています。許可が出たら許可を押してください。";

  if (!window.Html5Qrcode) {
    scanMessage.textContent = "読み取り機能の読み込みに失敗しました。少し待ってから再読み込みしてください。";
    return;
  }

  if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

  if (scannerRunning) {
    scanMessage.textContent = "すでにスキャン中です。バーコードを映してください。";
    return;
  }

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 260, height: 160 },
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
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
    scanMessage.textContent = "スキャン中です。読み取ってもカメラは開いたままです。";
  } catch (err) {
    scanMessage.textContent = "カメラを起動できませんでした。ページ更新・カメラ許可・HTTPSを確認してください。";
    scannerRunning = false;
  }
}

async function stopScanner() {
  if (html5QrCode && scannerRunning) {
    try { await html5QrCode.stop(); } catch (err) {}
  }

  scannerRunning = false;
  document.getElementById("scanMessage").textContent = "スキャンを停止しました。";
}
