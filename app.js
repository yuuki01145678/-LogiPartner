const tags = ["幻想的","温かい","ダーク","ポップ","和風","サイバー","手描き","水彩","アニメ調","リアル","ミニマル","レトロ","高級感","かわいい","クール","ストリート","独創的","透明感"];

const initialState = {
  activeProjectId: null,
  selectedTags: ["幻想的", "温かい", "独創的"],
  projects: [],
  creators: [
    {
      id: "creator_aoi",
      name: "Aoi",
      price: "50,000円〜",
      world: "幻想的、透明感、静かな感情表現、少し儚い雰囲気が得意。",
      policy: "流行よりも、ブランドの奥にある空気を描きたい。",
      tags: ["幻想的", "透明感", "水彩", "温かい"],
      caution: ["成人向け", "AI学習利用"]
    },
    {
      id: "creator_riku",
      name: "Riku",
      price: "80,000円〜",
      world: "ストリート、尖った構図、若者向けの強いビジュアルが得意。",
      policy: "見た瞬間に記憶に残る強さを大切にしています。",
      tags: ["ストリート", "クール", "独創的", "ダーク"],
      caution: ["政治", "宗教"]
    },
    {
      id: "creator_mika",
      name: "Mika",
      price: "40,000円〜",
      world: "かわいい、ポップ、親しみやすいキャラクター表現が得意。",
      policy: "見る人が少し元気になるデザインを作りたい。",
      tags: ["かわいい", "ポップ", "温かい", "アニメ調"],
      caution: ["暴力表現"]
    }
  ],
  proposals: []
};

let state = loadState();
let safetyStatus = "未確認";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadState() {
  const saved = localStorage.getItem("worldview_match_v1");
  return saved ? JSON.parse(saved) : structuredClone(initialState);
}

function saveState() {
  localStorage.setItem("worldview_match_v1", JSON.stringify(state));
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

function renderTags() {
  const area = document.getElementById("projectTagArea");
  if (!area) return;
  area.innerHTML = tags.map(tag => {
    const active = state.selectedTags.includes(tag) ? "on" : "";
    return `<span class="tag ${active}" data-tag="${tag}">${tag}</span>`;
  }).join("");

  area.querySelectorAll(".tag").forEach(element => {
    element.addEventListener("click", () => {
      const tag = element.dataset.tag;
      state.selectedTags = state.selectedTags.includes(tag)
        ? state.selectedTags.filter(item => item !== tag)
        : [...state.selectedTags, tag];
      saveState();
    });
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
        <h3>${creator.name}</h3>
        <p>${creator.world}</p>
        <p class="muted">${creator.policy}</p>
        <div>${creator.tags.map(tag => `<span class="pill">${tag}</span>`).join("")}</div>
        <p class="muted">参考価格：${creator.price}</p>
        <p class="muted">確認が必要な条件：${creator.caution.join(" / ") || "なし"}</p>
      </div>
    </div>
  `).join("");
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
        <button class="primary" data-send-proposal="${creator.id}">案件提案を送る</button>
      </div>
    </div>
  `).join("");

  area.querySelectorAll("[data-send-proposal]").forEach(button => {
    button.addEventListener("click", () => sendProposal(button.dataset.sendProposal));
  });
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

  document.getElementById("checkProjectButton").addEventListener("click", () => {
    const risk = document.getElementById("risk").value;
    const force = document.getElementById("force").value;
    const usage = document.getElementById("usage").value;
    const result = document.getElementById("safetyResult");

    if (risk === "danger" || force === "danger") {
      safetyStatus = "受付不可";
      result.innerHTML = `<span class="ng">受付不可：運営規定に抵触する可能性があります</span>`;
    } else if (usage === "review") {
      safetyStatus = "要確認";
      result.innerHTML = `<span class="status">要確認：運営確認を前提に登録できます</span>`;
    } else {
      safetyStatus = "確認OK";
      result.innerHTML = `<span class="ok">確認OK：登録できます</span>`;
    }
  });

  document.getElementById("projectFormElement").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.target);
    const finalSafety = safetyStatus === "未確認" ? "確認OK" : safetyStatus;

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
      safety: finalSafety,
      status: finalSafety === "受付不可" ? "受付不可" : "候補検索可能",
      createdAt: new Date().toLocaleString("ja-JP")
    };

    state.projects.push(project);
    state.activeProjectId = project.id;
    saveState();
    alert("案件を登録しました。候補検索へ進めます。");
    navigate("projectList");
  });

  document.getElementById("runMatchButton").addEventListener("click", runMatch);
}

setupEvents();
render();
