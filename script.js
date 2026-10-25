// 项目数据:增删一本书只需改这里
const projects = [
  {
    title: '拼贴诗', color: '#E5432D', height: 300, img: 'assets/collage-poem.png',
    meta: '2025—2026 · 合作创业实践 · GSA 毕业设计',
    name: '拼贴诗:从商业出版桌游到 AI 驱动的 APP 产品',
    chips: ['产品设计', 'AI 工作流', 'APP'],
    text: [['概述', '把一款商业出版的拼贴诗桌游,延展成由 AI 参与创作的 APP 产品。']] // TODO: 补充详细案例
  },
  {
    title: '看不见的茶', color: '#5BAA6A', height: 260, img: 'assets/unseen-tea.png',
    meta: '2025—2026 · GSA · 苏格兰公共教育项目 · 小组项目',
    name: '看不见的茶 The Unseen Tea',
    sub: '服务设计 · 为苏格兰中学生开发数字遗产学习资源',
    chips: ['可用性测试', '用户研究', '工作坊', '服务设计'],
    text: [['概述', '围绕茶叶背后的殖民与劳工历史,为苏格兰中学生设计数字遗产学习资源。']]
  },
  {
    title: 'Alley Cat', color: '#2F4FB5', height: 320, img: 'assets/alley-cat.png',
    meta: '2024 · 个人项目',
    name: 'ALLEY CAT · 流浪猫 TNR 资源集成系统',
    chips: ['服务设计', '系统设计', 'UI·UX 设计'],
    text: [['概述', '整合流浪猫 TNR(捕捉、绝育、放归)所需的人员与资源,设计 B 端与 C 端的协作系统。']]
  },
  {
    title: '专属点点', color: '#E58FC4', height: 280, dark: true, img: null, cover: '#E58FC4',
    meta: '小红书 · AI × 社区 · 设计笔试方案',
    name: '专属点点:一个入口,长出两条路线',
    sub: '向内整理你的收藏,向外连接走过的人',
    chips: ['AI × 社区', '交互设计', '可运行 Demo'],
    text: [
      ['洞察', '主题难以积累;点点的回答可能过时;简单提问难以触达知情者。'],
      ['方案', '路线一向内整理:按主题归档收藏,每个专辑有独立的点点对话,用引用卡片定位原笔记。路线二向外连接:答不上时替用户去问走过的人,真人公开回答后被吸收成经验。'],
      ['原则', 'AI 不替社区说话,只负责排好收藏、送出问题、学习真人的答案;亲身经历永远由人完成。']
    ]
  },
  {
    title: '动画工作室', color: '#F4B731', height: 240, dark: true, img: 'assets/animation-studio.png',
    meta: '2021—2023 · 鱼肚白动画',
    name: '动画工作室 · 制片与美术',
    sub: '代表作《女生宿舍日常》 · 《钻石之心》担任动画勾线与上色',
    chips: ['制片', '美术', '动画'],
    text: [['成果', '《钻石之心》获 2025 MUST 国际青年电影节 RED 最佳动画短片,入选神户独立电影节等多个展映。']]
  }
];

// 绘画与小动画:把文件放进 assets/ 后在这里登记即可,没有条目时显示占位
const drawings = [];  // 例: { src: 'assets/draw-01.jpg', caption: '标题' }
const motions = [];   // 例: { src: 'assets/motion-01.mp4', caption: '标题' }

const $ = (s) => document.querySelector(s);

// 书架:移植自拼贴诗 App 主页的 3D 书本轮播
// pos 是浮点"书序";与 pos 距离为 d 的书打开程度 o = 1-d(o=1 正面朝向,o=0 书脊朝向)
// 变换链与原版一致:perspective → rotateZ(倾斜) → rotateY(翻转)
const SPEC = [
  { T: 54, H: 290, phi: 3.3,  tc: '#fdfdfb' },
  { T: 40, H: 240, phi: -2.8, tc: '#fdfdfb' },
  { T: 54, H: 300, phi: 0,    tc: '#fdfdfb' },
  { T: 30, H: 270, phi: -4.4, tc: '#1C1715' },
  { T: 54, H: 250, phi: 5.4,  tc: '#1C1715' }
];
const W = 200, PERSP = 800, BOT = 340, DUR = 900, GAP = 5, DESIGN_H = 380;
const mod = (a, n) => ((a % n) + n) % n;
const ease = (p) => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const books = projects.map((p, i) => {
  const b = { ...p, ...SPEC[i % SPEC.length], i };
  const r = Math.abs(b.phi) * Math.PI / 180;
  b.ex = b.T * Math.cos(r) + b.H * Math.sin(r) - b.T;   // 倾斜书脊多占的宽度
  b.yc = BOT - b.H * Math.cos(r) / 2;                   // 倾斜时底边也落在书架线上
  return b;
});
const N = books.length;
const stage = $('#stage'), wrap = $('#stageWrap'), row = $('#row'), dotsEl = $('#dots');
let pos = 0, anim = null, raf = 0, CX = 280, suppress = false;
const slots = new Map();

function makeSlot(v) {
  const b = books[mod(v, N)], el = document.createElement('div');
  el.className = 'bk'; el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', b.name);
  el.style.width = W + 'px'; el.style.height = b.H + 'px';
  const art = b.img ? `<div class="art" style="background-image:url(${b.img})"></div><div class="veil"></div>` : '';
  el.innerHTML =
    `<div class="face back" style="width:${W}px;height:${b.H}px;background:${b.color};transform:translateZ(${-b.T}px) rotateY(180deg)"></div>` +
    `<div class="face spine" style="--tc:${b.tc};left:${-b.T / 2}px;width:${b.T}px;height:${b.H}px;background:${b.color};transform:translateZ(${-b.T / 2}px) rotateY(-90deg)"><span class="spine-no">0${b.i + 1}</span><span class="spine-txt">${b.title}</span></div>` +
    `<div class="face cover" style="width:${W}px;height:${b.H}px;background:${b.color}">${art}<div class="ttl">${b.title}<small>${b.meta.split('·')[0].trim()}</small></div></div>`;
  el.addEventListener('click', () => {
    if (suppress) return;
    if (!anim && Math.abs(pos - v) < 0.02) openBook(b); else goTo(v);
  });
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
  row.append(el);
  slots.set(v, { v, b, el });
}
function ensure() {
  const a = Math.round(pos);
  for (let v = a - 3; v <= a + 3; v++) if (!slots.has(v)) makeSlot(v);
  for (const [v, s] of slots) if (Math.abs(v - a) > 4) { s.el.remove(); slots.delete(v); }
}
function render() {
  ensure();
  const vs = [...slots.keys()].sort((x, y) => x - y), rel = new Map();
  let x = 0;
  for (const v of vs) {
    const s = slots.get(v), b = s.b, d = Math.abs(pos - v);
    s.o = d < 1 ? 1 - d : 0; s.vis = Math.max(0, Math.min(1, 2.7 - d));
    const th = (1 - s.o) * Math.PI / 2, sin = Math.sin(th), cos = Math.cos(th);
    const w = W * cos + b.T * sin + b.ex * (1 - s.o);
    rel.set(v, { x, w, th, sin });
    x += w + GAP + 10 * s.o;
  }
  const fl = Math.floor(pos), f = pos - fl, cA = rel.get(fl), cB = rel.get(fl + 1);
  const c = (1 - f) * (cA.x + cA.w / 2) + f * (cB.x + cB.w / 2);   // 相邻两本共享中心
  const shift = CX - c;
  for (const v of vs) {
    const s = slots.get(v), r = rel.get(v), b = s.b;
    const pe = b.phi * (1 - s.o), pr = pe * Math.PI / 180;           // 打开时倾斜渐渐消失
    const ox = r.x + shift + b.T * r.sin * Math.cos(pr) + (b.H / 2) * Math.abs(Math.sin(pr));
    const yc = b.yc * (1 - s.o) + (BOT - b.H / 2) * s.o;             // 打开的书稳稳立在书架线上
    s.el.style.transform = `translate3d(${ox.toFixed(2)}px,${(yc - b.H / 2).toFixed(2)}px,0) perspective(${PERSP}px) rotateZ(${pe.toFixed(3)}deg) rotateY(${(r.th * 180 / Math.PI).toFixed(2)}deg)`;
    s.el.style.zIndex = String(1 + Math.round(s.o * 10));
    s.el.style.opacity = s.vis.toFixed(3);
    s.el.style.pointerEvents = s.vis > 0.05 ? 'auto' : 'none';
  }
  const a = mod(Math.round(pos), N);
  [...dotsEl.children].forEach((d, i) => d.classList.toggle('on', i === a));
}
function tick(now) {
  raf = 0;
  if (anim) {
    const p = Math.max(0, Math.min(1, (now - anim.t0) / anim.dur));
    pos = anim.p0 + (anim.target - anim.p0) * ease(p);
    if (p >= 1) { pos = anim.target; anim = null; }
  }
  render();
  if (anim) raf = requestAnimationFrame(tick);
}
function goTo(target) {
  target = Math.round(target);
  const d = Math.abs(target - pos);
  if (d < 1e-4) { render(); return; }
  anim = { p0: pos, target, t0: performance.now(), dur: Math.min(2000, DUR + 220 * Math.max(0, d - 1)) };
  if (!raf) raf = requestAnimationFrame(tick);
}
const cur = () => (anim ? anim.target : Math.round(pos));

// 让设计坐标(宽 = 容器宽 / scale)按容器宽度缩放
function fit() {
  const cw = wrap.clientWidth, s = Math.max(0.62, Math.min(1.35, cw / (cw < 480 ? 430 : 560)));
  const dw = cw / s;
  stage.style.width = dw + 'px'; stage.style.height = DESIGN_H + 'px';
  stage.style.transform = `scale(${s})`;
  wrap.style.height = DESIGN_H * s + 'px';
  stage.querySelector('.shelf-line').style.top = BOT + 10 + 'px';
  CX = dw / 2; render();
}
window.addEventListener('resize', fit);

books.forEach((b, i) => {
  const d = document.createElement('button');
  d.setAttribute('aria-label', b.title); d.addEventListener('click', () => goTo(cur() + mod(i - cur(), N) - (mod(i - cur(), N) > N / 2 ? N : 0)));
  dotsEl.append(d);
});
$('#prev').addEventListener('click', () => goTo(cur() - 1));
$('#next').addEventListener('click', () => goTo(cur() + 1));
document.addEventListener('keydown', (e) => {
  if (!reader.hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') goTo(cur() + 1);
  if (e.key === 'ArrowLeft') goTo(cur() - 1);
});
// 拖动翻书:松手时按方向翻一本
let drag = null;
wrap.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, moved: false }; });
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  if (Math.abs(e.clientX - drag.x) > 8) { drag.moved = true; wrap.classList.add('dragging'); }
});
window.addEventListener('pointerup', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, moved = drag.moved; drag = null; wrap.classList.remove('dragging');
  if (moved) { suppress = true; setTimeout(() => (suppress = false), 0); if (Math.abs(dx) > 30) goTo(cur() + (dx < 0 ? 1 : -1)); }
});

// 绘画 / 动画
function fill(sel, items, kind, hint) {
  const el = $(sel);
  if (!items.length) {
    el.innerHTML = `<div class="slot"><div><b>${kind}即将加入</b>${hint}</div></div>`;
    return;
  }
  items.forEach((it) => {
    const d = document.createElement('figure');
    d.className = 'piece';
    const media = /\.(mp4|webm)$/i.test(it.src)
      ? `<video src="${it.src}" muted loop playsinline autoplay></video>`
      : `<img src="${it.src}" alt="${it.caption || ''}" loading="lazy">`;
    d.innerHTML = `${media}<p>${it.caption || ''}</p>`;
    el.append(d);
  });
}
fill('#drawings', drawings, '绘画', '把图片放进 assets 文件夹,在 script.js 登记');
fill('#motions', motions, '小动画', '支持 mp4 / webm / gif');

// 阅读器
const reader = $('#reader');
let lastFocus;
function openBook(p) {
  lastFocus = document.activeElement;
  const img = $('#r-img');
  if (p.img) { img.src = p.img; img.alt = p.name; img.parentElement.style.background = '#000'; }
  else { img.removeAttribute('src'); img.parentElement.style.background = p.cover; }
  $('#r-meta').textContent = p.meta;
  $('#r-title').textContent = p.name;
  $('#r-sub').textContent = p.sub || '';
  $('#r-chips').innerHTML = (p.chips || []).map((c) => `<span>${c}</span>`).join('');
  $('#r-text').innerHTML = p.text.map(([h, t]) => `<h4>${h}</h4><p>${t}</p>`).join('');
  reader.hidden = false;
  document.body.style.overflow = 'hidden';
  reader.querySelector('.close').focus();
}
function closeBook() {
  reader.hidden = true;
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}
reader.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeBook(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !reader.hidden) closeBook(); });

// 深色模式
const root = document.documentElement;
try { const t = localStorage.getItem('theme'); if (t) root.dataset.theme = t; } catch {}
$('#theme').addEventListener('click', () => {
  const dark = getComputedStyle(root).getPropertyValue('--paper').trim() === '#1C1715';
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch {}
});

fit();
