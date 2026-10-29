/* =========================================================
   main.js: loads every section from the Sections folder,
   then starts the page (router, typing line, background,
   project cards).

   To add a section:
     1. create Sections/<name>.html (root element: class="view" id="<name>")
     2. optionally create Sections/<name>.css and link it in index.html
     3. add "<name>" to SECTIONS below and a nav button in index.html
   ========================================================= */

const SECTIONS = ["home", "experience", "education", "projects", "skills", "contact"];
const GITHUB_USER = "Digioref";
const TYPING_LINES = [
  "Deep learning · Generative AI · LLMs",
  "Reinforcement learning · Multi-agent systems · Robotics"
];

/* ---------- 1. load the sections ---------- */
async function loadSections() {
  const app = document.getElementById("app");
  const parts = await Promise.all(SECTIONS.map(async name => {
    const res = await fetch(`Sections/${name}.html`);
    if (!res.ok) throw new Error(`Sections/${name}.html: ${res.status}`);
    return res.text();
  }));
  app.innerHTML = parts.join("\n");
}

/* ---------- 2. router: show one view at a time ---------- */
function startRouter() {
  const views = [...document.querySelectorAll(".view")];
  const links = [...document.querySelectorAll("nav.top ul a")];
  function show() {
    const id = (location.hash || "#home").slice(1);
    const target = views.find(v => v.id === id) || views[0];
    views.forEach(v => v.classList.toggle("active", v === target));
    links.forEach(a => {
      if (a.getAttribute("href") === "#" + target.id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    const cur = links.find(a => a.hasAttribute("aria-current"));
    if (cur) cur.parentElement.parentElement.scrollLeft = cur.offsetLeft - 60; // keep the active button visible on phones
    document.title = (target.id === "home" ? "" : target.id[0].toUpperCase() + target.id.slice(1) + " · ") + "Francesco Di Giore";
    window.scrollTo(0, 0);
    if (target.id === "home") dispatchEvent(new Event("resize")); // redraw the background at the right size
  }
  addEventListener("hashchange", show);
  show();
}

/* ---------- 3. typing line under the name ---------- */
function startTyping() {
  const el = document.getElementById("typed");
  if (!el) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = TYPING_LINES[0]; return; }
  let li = 0, ci = 0, del = false;
  (function tick() {
    const line = TYPING_LINES[li];
    el.textContent = line.slice(0, ci);
    if (!del && ci < line.length) { ci++; return setTimeout(tick, 45); }
    if (!del) { del = true; return setTimeout(tick, 1800); }
    if (ci > 0) { ci--; return setTimeout(tick, 18); }
    del = false; li = (li + 1) % TYPING_LINES.length; setTimeout(tick, 300);
  })();
}

/* ---------- 4. neural-network background in the hero ---------- */
function startNetwork() {
  const c = document.getElementById("net");
  if (!c) return;
  const x = c.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w, h, nodes = [];
  const dpr = Math.min(devicePixelRatio || 1, 2);
  function resize() {
    w = c.offsetWidth; h = c.offsetHeight;
    c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, w * h / 16000));
    nodes = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25 }));
  }
  function draw() {
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) { x.strokeStyle = `rgba(0,245,255,${(1 - d / 140) * .35})`; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); }
      }
    }
    for (const n of nodes) {
      x.fillStyle = "rgba(122,0,255,.9)"; x.beginPath(); x.arc(n.x, n.y, 2.2, 0, Math.PI * 2); x.fill();
      if (!reduce) { n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > w) n.vx *= -1; if (n.y < 0 || n.y > h) n.vy *= -1; }
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  addEventListener("resize", () => { resize(); if (reduce) draw(); });
  resize(); draw();
}

/* ---------- 5. project cards; language and stars come live from GitHub ---------- */
function buildProjects() {
  document.querySelectorAll(".projects[data-repos]").forEach(list => {
    JSON.parse(list.dataset.repos).forEach(([name, text]) => {
      const a = document.createElement("a");
      a.className = "project"; a.href = `https://github.com/${GITHUB_USER}/${name}`;
      a.innerHTML = `<h3></h3><p></p><div class="meta"><span class="tag"></span><span class="stars"></span></div>`;
      a.querySelector("h3").textContent = name;
      a.querySelector("p").textContent = text;
      list.appendChild(a);
      fetch(`https://api.github.com/repos/${GITHUB_USER}/${name}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d) return;
          if (d.language) a.querySelector(".tag").textContent = d.language;
          if (d.stargazers_count) a.querySelector(".stars").textContent = `★ ${d.stargazers_count}`;
        }).catch(() => {});
    });
  });
}

/* ---------- start ---------- */
loadSections()
  .then(() => {
    buildProjects();
    startRouter();
    startTyping();
    startNetwork();
    document.getElementById("year").textContent = new Date().getFullYear();
  })
  .catch(err => {
    console.error(err);
    document.getElementById("app").innerHTML =
      `<p class="load-error">The sections could not be loaded (${err.message}). If you opened index.html by double-clicking it,
       run <code>python -m http.server</code> in the site folder and open <code>http://localhost:8000</code> instead.</p>`;
  });
