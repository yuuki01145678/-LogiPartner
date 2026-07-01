const tags = ["幻想的","温かい","ダーク","ポップ","和風","サイバー","手描き","水彩","アニメ調","リアル","ミニマル","レトロ","高級感","かわいい","クール","ストリート","独創的","透明感"];
const ngOptions = ["政治","宗教","成人向け","暴力表現","AI学習利用","実績非公開","短納期","無償修正多数","著作権譲渡必須","その他"];

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
      name: "Aoi",
      email: "",
      url: "",
      price: "50,000円〜",
      leadTime: "2〜3週間",
      world: "幻想的、透明感、静かな感情表現、少し儚い雰囲気が得意。",
      policy: "流行よりも、ブランドの奥にある空気を描きたい。",
      tags: ["幻想的", "透明感", "水彩", "温かい"],
      caution: ["成人向け", "AI学習利用"],
      ngText: "AI学習利用は不可。",
      works: ["透明感のある人物イラスト", "夜明けの背景イラスト", "幻想的なブランドビジュアル"]
    },
    {
      id: "creator_riku",
      name: "Riku",
      email: "",
      url: "",
      price: "80,000円〜",
      leadTime: "3〜5週間",
      world: "ストリート、尖った構図、若者向けの強いビジュアルが得意。",
      policy: "見た瞬間に記憶に残る強さを大切にしています。",
      tags: ["ストリート", "クール", "独創的", "ダーク"],
      caution: ["政治", "宗教"],
      ngText: "政治・宗教案件は要確認。",
      works: ["ストリート系キービジュアル", "音楽イベントポスター", "ダークトーンの人物画"]
    },
    {
      id: "creator_mika",
      name: "Mika",
      email: "",
      url: "",
      price: "40,000円〜",
      leadTime: "1〜2週間",
      world: "かわいい、ポップ、親しみやすいキャラクター表現が得意。",
      policy: "見る人が少し元気になるデザインを作りたい。",
      tags: ["かわいい", "ポップ", "温かい", "アニメ調"],
      caution: ["暴力表現"],
      ngText: "強い暴力表現は不可。",
      works: ["SNSアイコン", "親しみやすいキャラクター", "ポップな広告用イラスト"]
    }
  ],
  proposals: []
};

let state = loadState();

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadState() {
  const saved = localStorage.getItem("worldview_match_v1_1");
  return saved ? JSON.parse(saved) : structuredClone(initialState);
}

function saveState() {
  localStorage.setItem("worldview_match_v1_1", JSON.stringify(state));
  render();
}

function navigate(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
  document.querySelectorAll(".menu button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === pageId);
  });
  const mobile = document.getElementById("mobileMenu");
  if (mobile) mobile.value = pageId;
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

function renderProjects() {
  const area = document.getElementById("projectListArea");
  if (!area) return;

  if (state.projects.length === 0) {
    area.innerHTML = `<p class="muted">案件はまだ登録されていません。まずは案件登録からお進みください。</p>`;
    return;
  }

  area.innerHTML = state.projects.map(project => `
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

  area.innerHTML = state.creators.map(creator => `
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
        <button class="primary" data-confirm-proposal="${creator.id}">このクリエイターへ案件提案</button>
      </div>
    </div>
  `;

  document.querySelector("[data-confirm-proposal]").addEventListener("click", () => openProposalConfirm(creatorId));
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

  if (project.status === "受付不可") {
    alert("この案件は受付不可です。");
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
  state.pendingProposalCreatorId = creatorId;

  document.getElementById("proposalConfirmArea").innerHTML = `
    <div class="grid">
      <div class="card col-6">
        <h3>提案先クリエイター</h3>
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
        <p class="muted">この時点では正式契約ではありません。運営確認後、クリエイター本人へ案件内容を共有し、面談・条件合意へ進みます。</p>
        <button class="primary" id="finalSendProposal">案件提案を送信する</button>
        <button class="ghost" data-jump="creatorSearch">候補検索へ戻る</button>
      </div>
    </div>
  `;

  document.getElementById("finalSendProposal").addEventListener("click", () => sendProposal(creatorId));
  document.querySelectorAll("[data-jump]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.jump));
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
    memo: "案件提案を受け付けました。運営確認後、クリエイターへ共有します。",
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

  if (state.proposals.length === 0) {
    area.innerHTML = `<p class="muted">案件提案はまだありません。クリエイター検索から案件提案を送ることができます。</p>`;
    return;
  }

  area.innerHTML = state.proposals.map(proposal => `
    <div class="match-card">
      <div>
        <h3>${proposal.creatorName}</h3>
        <p>${proposal.company} / ${proposal.projectTitle}</p>
        <p>進行状況：<span class="status">${proposal.status}</span></p>
        <p class="muted">${proposal.memo}</p>
        <div class="flow">
          <span class="now">運営確認</span>
          <span>クリエイター確認</span>
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

function render() {
  renderTags();
  renderProjects();
  renderCreators();
  renderProposals();
  renderActiveProject();
}


let creatorWizardStep = 1;
const creatorDraftImages = { face: "", work1: "", work2: "", work3: "" };

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

function setupEvents() {
  document.querySelectorAll(".menu button").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.page));
  });

  document.querySelectorAll("[data-jump]").forEach(button => {
    button.addEventListener("click", () => navigate(button.dataset.jump));
  });

  document.getElementById("mobileMenu").addEventListener("change", event => {
    navigate(event.target.value);
  });



  document.getElementById("projectFormElement").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const project = {
      id: uid(),
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

    const requiredChecks = [
      "confirmNoAntiSocial",
      "confirmLegal",
      "confirmRights",
      "confirmNg"
    ];

    const allConfirmed = requiredChecks.every(id => document.getElementById(id)?.checked);
    if (!allConfirmed) {
      alert("登録前の確認事項にすべて同意してください。");
      return;
    }

    const form = new FormData(event.target);

    const creator = {
      id: uid(),
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
    alert("クリエイタープロフィールを登録しました。");
    navigate("creatorList");
  });


  document.getElementById("creatorBackButton").addEventListener("click", () => setCreatorWizardStep(creatorWizardStep - 1));
  document.getElementById("creatorNextButton").addEventListener("click", () => setCreatorWizardStep(creatorWizardStep + 1));

  const creatorForm = document.getElementById("creatorFormElement");
  creatorForm.elements["faceImage"].addEventListener("change", event => previewImage(event.target, "facePreview", "face"));
  creatorForm.elements["workFile1"].addEventListener("change", event => previewImage(event.target, "workPreview1", "work1"));
  creatorForm.elements["workFile2"].addEventListener("change", event => previewImage(event.target, "workPreview2", "work2"));
  creatorForm.elements["workFile3"].addEventListener("change", event => previewImage(event.target, "workPreview3", "work3"));

  setCreatorWizardStep(1);

  document.getElementById("runMatchButton").addEventListener("click", runMatch);
}

setupEvents();
render();
