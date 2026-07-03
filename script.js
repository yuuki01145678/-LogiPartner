const data = {
  core: {
    title: 'EIRAUM',
    text: '仕事をつなぐ会社ではない。人の中にある世界を見つけ、その世界を作品へと昇華させる会社。',
    tags: ['会社の脳', '文化', '世界観']
  },
  world: {
    title: '世界と出会う',
    text: '人を探すのではなく、世界と出会う。創造宣言、世界観カルテ、思想、表現を通して、一人の世界を旅する。',
    tags: ['創造宣言', '世界観カルテ', 'この世界を巡る']
  },
  creation: {
    title: '創造',
    text: '創造の時間 ― 邂逅 ― で二人の表現者が出会い、創造開始から作品の誕生へ向かう。創造は、止まらない。',
    tags: ['邂逅', '創造開始', '作品の誕生']
  },
  resonance: {
    title: '共鳴',
    text: 'AIは評価しない。世界観を理解し、世界観の核を見つけ、なぜ共鳴するのかを静かに伝える。',
    tags: ['Resonance Engine', '理解', '共鳴理由']
  },
  memory: {
    title: 'EIRAUM memory',
    text: '完成品だけではなく、作品が生まれる時間そのものを残す。会話、ラフ、写真、創造の日が、作品の人生になる。',
    tags: ['創造の記録', '作品の人生', '創造の軌跡']
  },
  owner: {
    title: 'Owner',
    text: 'オーナーは管理者ではなく、EIRAUMという文化の守り手。世界が生まれ、育ち、残っていく様子を見守る。',
    tags: ['文化の守り手', 'Sub Owner', 'VAELIS']
  }
};

const nodes = document.querySelectorAll('.node');
const title = document.getElementById('panelTitle');
const text = document.getElementById('panelText');
const tags = document.getElementById('panelTags');

nodes.forEach(node => {
  node.addEventListener('click', () => {
    nodes.forEach(n => n.classList.remove('active'));
    node.classList.add('active');
    const item = data[node.dataset.key];
    title.textContent = item.title;
    text.textContent = item.text;
    tags.innerHTML = item.tags.map(t => `<span>${t}</span>`).join('');
  });
});
