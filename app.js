const tags = ["幻想的","温かい","ダーク","ポップ","和風","サイバー","ミニマル","レトロ","高級感","かわいい","クール","ストリート","独創的","透明感","廃退感"];
const ngOptions = ["政治","宗教","成人向け","暴力表現","AI学習利用","実績非公開","短納期","無償修正多数","著作権譲渡必須","その他"];

const rolePasswords = {
  client: "client123",
  creator: "creator123",
  admin: "admin123"
};

const roleMenus = {
  client: [
    ["home", "ホーム", "概要"],
    ["projectForm", "案件登録", "入力"],
    ["projectList", "案件一覧", "確認"],
    ["creatorSearch", "表現者検索", "候補"],
    ["proposalStatus", "提案状況", "進行"],
    ["creatorList", "表現者一覧", "世界観"]
  ],
  creator: [
    ["home", "ホーム", "概要"],
    ["creatorRegister", "プロフィール登録", "本人入力"],
    ["creatorList", "表現者一覧", "表示確認"],
    ["proposalStatus", "提案状況", "確認"]
  ],
  admin: [
    ["home", "ホーム", "概要"],
    ["adminDashboard", "運営ダッシュボード", "全体"],
    ["projectForm", "案件登録", "代行"],
    ["projectList", "案件一覧", "全件"],
    ["creatorRegister", "表現者登録", "代行"],
    ["creatorList", "表現者一覧", "全件"],
    ["creatorSearch", "表現者検索", "候補"],
    ["proposalStatus", "提案状況", "全件"]
  ]
};

const roleLabels = {
  client: "企業側",
  creator: "表現者側",
  admin: "運営側"
};

const initialState = {
  activeProjectId: null,
  selectedTags: ["幻想的", "温かい", "独創的"],
  creatorSelectedTags: ["高級感", "ミニマル", "ダーク"],
  creatorNgTags: ["AI学習利用", "著作権譲渡必須"],
  pendingProposalCreatorId: null,
  projects: [],
  creators: [
    {
      id: "creator_aoi",
      ownerRole: "sample",
      name: "Aoi",
      email: "",
      url: "",
      price: "50,000円〜",
      leadTime: "2〜3週間",
      world: "幻想的、透明感、静かな感情表現、少し儚い雰囲気が得意。",
      policy: "流行よりも、ブランドの奥にある空気を描きたい。",
      tags: ["幻想的", "透明感", "温かい"],
      caution: ["成人向け", "AI学習利用"],
      ngText: "AI学習利用は不可。",
      works: ["透明感のある人物イラスト", "夜明けの背景イラスト", "幻想的なブランドビジュアル"]
    },
    {
      id: "creator_riku",
      ownerRole: "sample",
      name: "Riku",
      email: "",
      url: "",
      price: "80,000円〜",
      leadTime: "3〜5週間",
      world: "ストリート、尖った構図、若者向けの強いビジュアルが得意。",
      policy: "見た瞬間に記憶に残る強さを大切にしています。",
      tags: ["ストリート", "クール", "独創的", "ダーク", "廃退感"],
      caution: ["政治", "宗教"],
      ngText: "政治・宗教案件は要確認。",
      works: ["ストリート系キービジュアル", "音楽イベントポスター", "ダークトーンの人物画"]
    },
    {
      id: "creator_mika",
      ownerRole: "sample",
      name: "Mika",
      email: "",
      url: "",
      price: "40,000円〜",
      leadTime: "1〜2週間",
      world: "かわいい、ポップ、親しみやすいキャラクター表現が得意。",
      policy: "見る人が少し元気になるデザインを作りたい。",
      tags: ["かわいい", "ポップ", "温かい"],
      caution: ["暴力表現"],
      ngText: "強い暴力表現は不可。",
      works: ["SNSアイコン", "親しみやすいキャラクター", "ポップな広告用イラスト"]
    }
  ],
  proposals: []
};

let state = loadState();
let currentRole = null;
let selectedLoginRole = "client";
let creatorWizardStep = 1;
const creatorDraftImages = { face: "", work1: "", work2: "", work3: "" };

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadState() {
  const saved = localStorage.getItem("worldview_match_v1_4");
  return saved ? JSON.parse(saved) : structuredClone(initialState);
}

function saveState() {
  localStorage.setItem("worldview_match_v1_4", JSON.stringify(state));
  render();
}

function login(role) {
  const password = document.getElementById("passwordInput").value;
  if (password !== rolePasswords[role]) {
    alert("パスワードが違います。");
    return;
  }
  currentRole = role;
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  setupRoleView();
  navigate("home");
}

function logout() {
  currentRole = null;
  document.getElementById("passwordInput").value = "";
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
}

function setupRoleView() {
  document.getElementById("roleLabel").textContent = roleLabels[currentRole];
  const menu = document.getElementById("sideMenu");
  const mobile = document.getElementById("mobileMenu");
  const items = roleMenus[currentRole];

  let html = `<div class="menu-title">${roleLabels[currentRole]}</div>`;
  html += items.map(([page, label, sub]) => `<button data-page="${page}">${label} <small>${sub}</small></button>`).join("");
  menu.innerHTML = html;

  mobile.innerHTML = items.map(([page, label]) => `<option value="${page}">${label}</option>`).join("");

  menu.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.page));
  });

  document.querySelectorAll("[data-role-show]").forEach(el => {
    const allowed = el.dataset.roleShow.split(" ");
    el.classList.toggle("hidden", !allowed.includes(currentRole));
  });

  const title = document.getElementById("homeTitle");
  const text = document.getElementById("homeText");
  const actions = document.getElementById("homeActions");

  if (currentRole === "client") {
    title.textContent = "才能ではなく、世界観でつながる。";
    text.textContent = "企業が求める雰囲気・思想・ブランドイメージを入力すると、世界観の近い表現者候補を抽出します。";
    actions.innerHTML = `<button class="primary" data-jump="projectForm">案件を登録する</button><button class="ghost" data-jump="creatorList">表現者を見る</button>`;
  } else if (currentRole === "creator") {
    title.textContent = "あなたの個性を、必要としている企業へ。";
    text.textContent = "顔・名前・得意なイメージ・作品を登録し、自分の世界観に合う案件提案を受け取れます。";
    actions.innerHTML = `<button class="primary" data-jump="creatorRegister">プロフィールを登録する</button><button class="ghost" data-jump="proposalStatus">提案状況を見る</button>`;
  } else {
    title.textContent = "案件・表現者・提案を一元管理。";
    text.textContent = "運営側では企業側、表現者側、案件提案の全体を確認し、審査と進行管理を行います。";
    actions.innerHTML = `<button class="primary" data-jump="adminDashboard">運営ダッシュボード</button><button class="ghost" data-jump="projectList">案件一覧を見る</button>`;
  }

  document.querySelectorAll("[data-jump]").forEach(button => {
    button.onclick = () => navigate(button.dataset.jump);
  });
}

function allowedPage(pageId) {
  return roleMenus[currentRole]?.some(([page]) => page === pageId) || ["creatorDetail", "proposalConfirm"].includes(pageId);
}

function navigate(pageId) {
  if (!allowedPage(pageId)) {
    alert("この画面を見る権限がありません。");
    pageId = "home";
  }

  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");

  document.querySelectorAll(".menu button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });

  const mobile = document.getElementById("mobileMenu");
  if (mobile && [...mobile.options].some(o => o.value === pageId)) mobile.value = pageId;

  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getActiveProject() {
  return state.projects.find(project => project.id === state.activeProjectId) || null;
}

function makeTags(areaId, sourceTags, selected, onClick) {
  const area = document.getElementById(areaId);
  if (!area) return;
  area.innerHTML = sourceTags.map(tag => {
    const active = selected.includes(tag) ? "on" : "";
    return `<span class="tag ${active}" data-tag="${tag}">${tag}</span>`;
  }).join("");

  area.querySelectorAll(".tag").forEach(element => {
    element.addEventListener("click", () => onClick(element.dataset.tag));
  });
}

function renderTags() {
  makeTags("projectTagArea", tags, state.selectedTags, tag => {
    state.selectedTags = state.selectedTags.includes(tag)
      ? state.selectedTags.filter(item => item !== tag)
      : [...state.selectedTags, tag];
    saveState();
  });

  makeTags("creatorTagArea", tags, state.creatorSelectedTags, tag => {
    state.creatorSelectedTags = state.creatorSelectedTags.includes(tag)
      ? state.creatorSelectedTags.filter(item => item !== tag)
      : [...state.creatorSelectedTags, tag];
    saveState();
  });

  makeTags("creatorNgArea", ngOptions, state.creatorNgTags, tag => {
    state.creatorNgTags = state.creatorNgTags.includes(tag)
      ? state.creatorNgTags.filter(item => item !== tag)
      : [...state.creatorNgTags, tag];
    saveState();
  });
}

function visibleProjects() {
  return state.projects;
}

function visibleCreators() {
  return state.creators;
}

function visibleProposals() {
  return state.proposals;
}

function renderProjects() {
  const area = document.getElementById("projectListArea");
  if (!area) return;

  const projects = visibleProjects();
  if (projects.length === 0) {
    area.innerHTML = `<p class="muted">案件はまだ登録されていません。</p>`;
    return;
  }

  area.innerHTML = projects.map(project => `
    <div class="match-card">
      <div>
        <h3>${project.title}</h3>
        <p>${project.company} / ${project.person}</p>
        <p class="muted">${project.detail}</p>
        <div>${project.tags.map(tag => `<span class="pill">${tag}</span>`).join("")}</div>
        <p class="muted">予算：${project.budget} / 納期：${project.deadline}</p>
        <p>進行状況：<span class="status">${project.status}</span></p>
      </div>
      <div>
        <button class="primary" data-select-project="${project.id}">この案件で候補を見る</button>
      </div>
    </div>
  `).join("");

  area.querySelectorAll("[data-select-project]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeProjectId = button.dataset.selectProject;
      saveState();
      navigate("creatorSearch");
    });
  });
}

function renderCreators() {
  const area = document.getElementById("creatorListArea");
  if (!area) return;

  const creators = visibleCreators();
  area.innerHTML = creators.map(creator => `
    <div class="match-card">
      <div>
        <div class="creator-row">
          ${creator.faceImage ? `<img class="creator-avatar" src="${creator.faceImage}" alt="${creator.name}" />` : `<div class="creator-avatar empty">No Image</div>`}
          <div>
            <h3>${creator.name}</h3>
            <p>${creator.world}</p>
          </div>
        </div>
        <p class="muted">${creator.policy}</p>
        <div>${creator.tags.map(tag => `<span class="pill">${tag}</span>`).join("")}</div>
        <p class="muted">参考価格：${creator.price} / 納期目安：${creator.leadTime || "要相談"}</p>
        <p class="muted">確認が必要な条件：${creator.caution.join(" / ") || "なし"}</p>
      </div>
      <div>
        <button class="primary" data-detail-creator="${creator.id}">詳細を見る</button>
      </div>
    </div>
  `).join("");

  area.querySelectorAll("[data-detail-creator]").forEach(button => {
    button.addEventListener("click", () => showCreatorDetail(button.dataset.detailCreator));
  });
}

function showCreatorDetail(creatorId) {
  const creator = state.creators.find(item => item.id === creatorId);
  document.getElementById("detailName").textContent = creator.name;
  document.getElementById("detailSub").textContent = `${creator.price} / 納期目安：${creator.leadTime || "要相談"}`;

  document.getElementById("creatorDetailArea").innerHTML = `
    <div class="grid">
      <div class="card col-7">
        <div class="creator-row detail">
          ${creator.faceImage ? `<img class="creator-avatar large" src="${creator.faceImage}" alt="${creator.name}" />` : `<div class="creator-avatar large empty">No Image</div>`}
          <div>
            <h3>世界観</h3>
            <p>${creator.world}</p>
          </div>
        </div>
        <h3>制作ポリシー</h3>
        <p class="muted">${creator.policy}</p>
        <div>${creator.tags.map(tag => `<span class="pill">${tag}</span>`).join("")}</div>
        <h3>作品ギャラリー</h3>
        <div class="gallery">
          ${(creator.workImages || []).map((img, idx) => img ? `<div class="work image"><img src="${img}" alt="work ${idx + 1}" /></div>` : "").join("") || (creator.works || []).map(work => `<div class="work">${work}</div>`).join("") || `<div class="work">作品未登録</div>`}
        </div>
        ${creator.workNote ? `<p class="muted">${creator.workNote}</p>` : ""}
      </div>
      <div class="card col-5">
        <h3>依頼前の確認</h3>
        <p class="muted">確認が必要な条件：${creator.caution.join(" / ") || "なし"}</p>
        <p class="muted">${creator.ngText || ""}</p>
        <p class="muted">ポートフォリオ：${creator.url ? `<a href="${creator.url}" target="_blank">${creator.url}</a>` : "未登録"}</p>
        ${currentRole !== "creator" ? `<button class="primary" data-confirm-proposal="${creator.id}">この表現者へ案件提案</button>` : ""}
      </div>
    </div>
  `;

  const proposalButton = document.querySelector("[data-confirm-proposal]");
  if (proposalButton) proposalButton.addEventListener("click", () => openProposalConfirm(creatorId));
  navigate("creatorDetail");
}

function scoreCreator(creator, project) {
  const matched = creator.tags.filter(tag => project.tags.includes(tag)).length;
  return Math.round((matched / Math.max(project.tags.length, 1)) * 100);
}

function runMatch() {
  const project = getActiveProject();
  const area = document.getElementById("matchArea");

  if (!project) {
    alert("先に案件一覧から案件を選んでください。");
    return;
  }

  const rankedCreators = state.creators
    .map(creator => ({ ...creator, score: scoreCreator(creator, project) }))
    .sort((a, b) => b.score - a.score);

  area.innerHTML = rankedCreators.map(creator => `
    <div class="match-card">
      <div>
        <h3>${creator.name}</h3>
        <p>${creator.world}</p>
        <p class="muted">${creator.policy}</p>
        <div>${creator.tags.map(tag => `<span class="pill">${tag}</span>`).join("")}</div>
        <p class="muted">参考価格：${creator.price}</p>
      </div>
      <div>
        <div class="score">${creator.score}%</div>
        <button class="ghost" data-detail-creator="${creator.id}">詳細を見る</button>
        <button class="primary" data-confirm-proposal="${creator.id}">案件提案へ</button>
      </div>
    </div>
  `).join("");

  area.querySelectorAll("[data-detail-creator]").forEach(button => {
    button.addEventListener("click", () => showCreatorDetail(button.dataset.detailCreator));
  });
  area.querySelectorAll("[data-confirm-proposal]").forEach(button => {
    button.addEventListener("click", () => openProposalConfirm(button.dataset.confirmProposal));
  });
}

function openProposalConfirm(creatorId) {
  const project = getActiveProject();
  if (!project) {
    alert("先に案件を選択してください。");
    return;
  }

  const creator = state.creators.find(item => item.id === creatorId);

  document.getElementById("proposalConfirmArea").innerHTML = `
    <div class="grid">
      <div class="card col-6">
        <h3>提案先表現者</h3>
        <p class="status">${creator.name}</p>
        <p>${creator.world}</p>
        <p class="muted">参考価格：${creator.price} / 納期目安：${creator.leadTime || "要相談"}</p>
        <div>${creator.tags.map(tag => `<span class="pill">${tag}</span>`).join("")}</div>
      </div>
      <div class="card col-6">
        <h3>提案案件</h3>
        <p class="status">${project.title}</p>
        <p>${project.company} / ${project.person}</p>
        <p class="muted">${project.detail}</p>
        <p class="muted">予算：${project.budget} / 納期：${project.deadline}</p>
      </div>
      <div class="card col-12">
        <h3>確認事項</h3>
        <p class="muted">この時点では正式契約ではありません。運営確認後、表現者本人へ案件内容を共有し、面談・条件合意へ進みます。</p>
        <button class="primary" id="finalSendProposal">案件提案を送信する</button>
        <button class="ghost" data-jump="creatorSearch">候補検索へ戻る</button>
      </div>
    </div>
  `;

  document.getElementById("finalSendProposal").addEventListener("click", () => sendProposal(creatorId));
  document.querySelectorAll("[data-jump]").forEach(button => {
    button.onclick = () => navigate(button.dataset.jump);
  });

  navigate("proposalConfirm");
}

function sendProposal(creatorId) {
  const project = getActiveProject();
  const creator = state.creators.find(item => item.id === creatorId);

  state.proposals.push({
    id: uid(),
    creatorId,
    creatorName: creator.name,
    projectId: project.id,
    company: project.company,
    projectTitle: project.title,
    status: "運営確認中",
    flow: 1,
    memo: "案件提案を受け付けました。運営確認後、表現者へ共有します。",
    createdAt: new Date().toLocaleString("ja-JP")
  });

  project.status = "案件提案済み";
  saveState();
  alert(`${creator.name}さんへの案件提案を受け付けました。`);
  navigate("proposalStatus");
}

function renderProposals() {
  const area = document.getElementById("proposalArea");
  if (!area) return;

  const proposals = visibleProposals();
  if (proposals.length === 0) {
    area.innerHTML = `<p class="muted">案件提案はまだありません。</p>`;
    return;
  }

  area.innerHTML = proposals.map(proposal => `
    <div class="match-card">
      <div>
        <h3>${proposal.creatorName}</h3>
        <p>${proposal.company} / ${proposal.projectTitle}</p>
        <p>進行状況：<span class="status">${proposal.status}</span></p>
        <p class="muted">${proposal.memo}</p>
        <div class="flow">
          <span class="now">運営確認</span>
          <span>表現者確認</span>
          <span>面談調整</span>
          <span>面談</span>
          <span>条件合意</span>
          <span>正式契約</span>
        </div>
      </div>
    </div>
  `).join("");
}

function renderActiveProject() {
  const element = document.getElementById("activeProjectName");
  if (!element) return;
  const project = getActiveProject();
  element.textContent = project ? project.title : "未選択";
}

function renderAdminDashboard() {
  const p = document.getElementById("adminProjectCount");
  const c = document.getElementById("adminCreatorCount");
  const pr = document.getElementById("adminProposalCount");
  if (p) p.textContent = state.projects.length;
  if (c) c.textContent = state.creators.length;
  if (pr) pr.textContent = state.proposals.length;
}

function setCreatorWizardStep(step) {
  creatorWizardStep = Math.max(1, Math.min(4, step));
  document.querySelectorAll("[data-wizard-page]").forEach(page => {
    page.classList.toggle("hidden", page.dataset.wizardPage !== String(creatorWizardStep));
  });
  document.querySelectorAll("[data-step-indicator]").forEach(item => {
    item.classList.toggle("on", item.dataset.stepIndicator === String(creatorWizardStep));
  });

  const back = document.getElementById("creatorBackButton");
  const next = document.getElementById("creatorNextButton");
  const submit = document.getElementById("creatorSubmitButton");
  if (back) back.style.visibility = creatorWizardStep === 1 ? "hidden" : "visible";
  if (next) next.classList.toggle("hidden", creatorWizardStep === 4);
  if (submit) submit.classList.toggle("hidden", creatorWizardStep !== 4);
}

function previewImage(input, targetId, key) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    creatorDraftImages[key] = event.target.result;
    const target = document.getElementById(targetId);
    target.innerHTML = `<img src="${event.target.result}" alt="preview" />`;
  };
  reader.readAsDataURL(file);
}

function render() {
  renderTags();
  renderProjects();
  renderCreators();
  renderProposals();
  renderActiveProject();
  renderAdminDashboard();
}

function setupEvents() {
  document.querySelectorAll("[data-role-select]").forEach(button => {
    button.addEventListener("click", () => {
      selectedLoginRole = button.dataset.roleSelect;
      document.querySelectorAll("[data-role-select]").forEach(b => b.classList.remove("on"));
      button.classList.add("on");
    });
  });

  document.getElementById("loginButton").addEventListener("click", () => login(selectedLoginRole));
  document.getElementById("logoutButton").addEventListener("click", logout);

  document.getElementById("mobileMenu").addEventListener("change", event => {
    navigate(event.target.value);
  });

  document.getElementById("projectFormElement").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.target);

    const project = {
      id: uid(),
      ownerRole: currentRole,
      company: form.get("company"),
      person: form.get("person"),
      title: form.get("title"),
      budget: form.get("budget"),
      deadline: form.get("deadline"),
      detail: form.get("detail"),
      worldText: form.get("worldText"),
      tags: [...state.selectedTags],
      safety: "運営確認前",
      status: "候補検索可能",
      createdAt: new Date().toLocaleString("ja-JP")
    };

    state.projects.push(project);
    state.activeProjectId = project.id;
    saveState();
    alert("案件を登録しました。候補検索へ進めます。");
    navigate("projectList");
  });

  document.getElementById("creatorFormElement").addEventListener("submit", event => {
    event.preventDefault();

    const requiredChecks = ["confirmNoAntiSocial", "confirmLegal", "confirmRights", "confirmNg"];
    const allConfirmed = requiredChecks.every(id => document.getElementById(id)?.checked);
    if (!allConfirmed) {
      alert("登録前の確認事項にすべて同意してください。");
      return;
    }

    const form = new FormData(event.target);

    const creator = {
      id: uid(),
      ownerRole: currentRole,
      name: form.get("name"),
      email: form.get("email"),
      url: form.get("url"),
      price: form.get("price"),
      leadTime: "要相談",
      world: form.get("world"),
      policy: form.get("policy"),
      tags: [...state.creatorSelectedTags],
      caution: [...state.creatorNgTags],
      ngText: "登録時の確認事項に同意済み",
      works: ["提出作品1", "提出作品2", "提出作品3"],
      workImages: [creatorDraftImages.work1, creatorDraftImages.work2, creatorDraftImages.work3].filter(Boolean),
      faceImage: creatorDraftImages.face,
      workNote: form.get("workNote"),
      complianceConfirmed: true,
      complianceConfirmedAt: new Date().toLocaleString("ja-JP")
    };

    state.creators.push(creator);
    saveState();
    alert("表現者プロフィールを登録しました。");
    navigate("creatorList");
  });

  document.getElementById("creatorBackButton").addEventListener("click", () => setCreatorWizardStep(creatorWizardStep - 1));
  document.getElementById("creatorNextButton").addEventListener("click", () => setCreatorWizardStep(creatorWizardStep + 1));

  const creatorForm = document.getElementById("creatorFormElement");
  creatorForm.elements["faceImage"].addEventListener("change", event => previewImage(event.target, "facePreview", "face"));
  creatorForm.elements["workFile1"].addEventListener("change", event => previewImage(event.target, "workPreview1", "work1"));
  creatorForm.elements["workFile2"].addEventListener("change", event => previewImage(event.target, "workPreview2", "work2"));
  creatorForm.elements["workFile3"].addEventListener("change", event => previewImage(event.target, "workPreview3", "work3"));

  document.getElementById("runMatchButton").addEventListener("click", runMatch);

  setCreatorWizardStep(1);
}

setupEvents();
render();


function setupBrandIntro() {
  const intro = document.getElementById("brandIntro");
  const login = document.getElementById("loginScreen");
  if (!intro || !login) return;

  const seen = localStorage.getItem("wm_brand_intro_seen_v16");
  if (seen) {
    intro.style.display = "none";
    login.classList.remove("intro-wait");
    login.classList.add("ready");
    return;
  }

  setTimeout(() => {
    intro.classList.add("hide");
    localStorage.setItem("wm_brand_intro_seen_v16", "1");
    setTimeout(() => {
      intro.style.display = "none";
      login.classList.remove("intro-wait");
      login.classList.add("ready");
    }, 1200);
  }, 6500);
}

setupBrandIntro();
