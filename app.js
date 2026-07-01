let html5QrCode = null;
let scannerRunning = false;
let packages = JSON.parse(localStorage.getItem("logipartner_packages") || "[]");

window.addEventListener("load", () => {
  scanPreview();
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
  if (cpt < 90 || stay >= 120) return { level: "warning", label: "🟡 注意", priority: 2 };
  return { level: "safe", label: "🟢 安全", priority: 3 };
}

function nowTime() {
  const now = new Date();
  return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
}

function scanPreview() {
  const barcode = document.getElementById("barcode").value || "未入力";
  const cpt = Number(document.getElementById("cpt").value);
  const stay = Number(document.getElementById("stay").value);
  const checker = document.getElementById("checker").value;
  const result = document.getElementById("result");
  const status = document.getElementById("status");
  const judged = judge(cpt, stay);

  result.className = "result";
  if (judged.level === "danger") result.classList.add("danger");
  if (judged.level === "warning") result.classList.add("warning");

  status.textContent = judged.label;
  document.getElementById("outBarcode").textContent = barcode;
  document.getElementById("outCpt").textContent = "あと" + cpt + "分";
  document.getElementById("outStay").textContent = formatMinutes(stay);
  document.getElementById("outChecker").textContent = checker;
  document.getElementById("outTime").textContent = nowTime();
}

function addOrUpdatePackage() {
  scanPreview();

  const barcode = document.getElementById("barcode").value || "未入力";
  const cpt = Number(document.getElementById("cpt").value);
  const stay = Number(document.getElementById("stay").value);
  const checker = document.getElementById("checker").value;
  const checkedAt = nowTime();
  const judged = judge(cpt, stay);

  const record = {
    barcode,
    cpt,
    stay,
    checker,
    checkedAt,
    level: judged.level,
    label: judged.label,
    priority: judged.priority
  };

  const existingIndex = packages.findIndex(p => p.barcode === barcode);
  if (existingIndex >= 0) {
    packages[existingIndex] = record;
  } else {
    packages.push(record);
  }

  packages.sort((a, b) => a.priority - b.priority || a.cpt - b.cpt || b.stay - a.stay);
  localStorage.setItem("logipartner_packages", JSON.stringify(packages));
  renderDashboard();
}

function renderDashboard() {
  const list = document.getElementById("packageList");
  const red = packages.filter(p => p.level === "danger").length;
  const yellow = packages.filter(p => p.level === "warning").length;
  const green = packages.filter(p => p.level === "safe").length;

  document.getElementById("redCount").textContent = red;
  document.getElementById("yellowCount").textContent = yellow;
  document.getElementById("greenCount").textContent = green;

  if (packages.length === 0) {
    list.innerHTML = '<div class="package-item"><strong>まだ記録がありません</strong><span>スキャンまたはテストスキャン後に「記録する」を押してください。</span></div>';
    return;
  }

  list.innerHTML = packages.map(p => `
    <div class="package-item ${p.level}">
      <strong>${p.label}｜${p.barcode}</strong>
      <span>CPTまで：あと${p.cpt}分 / 滞留：${formatMinutes(p.stay)}</span>
      <span>最終確認：${p.checker} ${p.checkedAt}</span>
    </div>
  `).join("");
}

function fakeCptAndStayFromBarcode(barcode) {
  let sum = 0;
  for (let i = 0; i < barcode.length; i++) sum += barcode.charCodeAt(i);
  document.getElementById("cpt").value = 20 + (sum % 140);
  document.getElementById("stay").value = 15 + (sum % 210);
}

function demoScan() {
  const demoCode = "DEMO-" + Math.floor(100000 + Math.random() * 900000);
  document.getElementById("barcode").value = demoCode;
  fakeCptAndStayFromBarcode(demoCode);
  addOrUpdatePackage();
}

async function startScanner() {
  const scannerWrap = document.getElementById("scannerWrap");
  const stopButton = document.getElementById("stopButton");
  const scanMessage = document.getElementById("scanMessage");

  scannerWrap.style.display = "block";
  stopButton.style.display = "block";
  scanMessage.textContent = "カメラを起動しています。許可が出たら許可を押してください。";

  if (!window.Html5Qrcode) {
    scanMessage.textContent = "読み取り機能の読み込みに失敗しました。通信環境を確認してください。";
    return;
  }

  if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
  if (scannerRunning) return;

  try {
    await html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 260, height: 170 },
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
      async (decodedText) => {
        document.getElementById("barcode").value = decodedText;
        fakeCptAndStayFromBarcode(decodedText);
        addOrUpdatePackage();
        scanMessage.textContent = "読み取り成功：" + decodedText;
        await stopScanner();
      },
      () => {}
    );
    scannerRunning = true;
    scanMessage.textContent = "バーコードをカメラに映してください。";
  } catch (err) {
    scanMessage.textContent = "カメラを起動できませんでした。HTTPSで開いているか、カメラ許可を確認してください。";
    scannerRunning = false;
  }
}

async function stopScanner() {
  const scannerWrap = document.getElementById("scannerWrap");
  const stopButton = document.getElementById("stopButton");

  if (html5QrCode && scannerRunning) {
    try { await html5QrCode.stop(); } catch (err) {}
  }

  scannerRunning = false;
  scannerWrap.style.display = "none";
  stopButton.style.display = "none";
}
