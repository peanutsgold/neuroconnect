// ===== Helpers =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function store(key, value) {
  try {
    if (value === undefined) return JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return null;
  }
}

// ===== Footer year =====
$("#year").textContent = new Date().getFullYear();

// ===== Mobile nav =====
const navToggle = $(".nav-toggle");
const navLinks = $("#nav-links");

navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
$$("#nav-links a").forEach((link) =>
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", false);
  })
);

// ===== Reveal on scroll =====
const revealTargets = $$(".card, .flip-card, .tip, .timeline li, .accordion details, .severity");
revealTargets.forEach((el) => el.classList.add("reveal"));
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
revealTargets.forEach((el) => revealObserver.observe(el));

// ===== Animated hero numbers =====
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count);
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
});
$$("[data-count]").forEach((el) => counterObserver.observe(el));

// ===== Flip cards =====
$$(".flip-card").forEach((card) =>
  card.addEventListener("click", () => card.classList.toggle("flipped"))
);

// ===== Symptom tabs =====
const tabs = $$('[role="tab"]');
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") selectTab(tabs[(i + 1) % tabs.length], true);
    if (e.key === "ArrowLeft") selectTab(tabs[(i - 1 + tabs.length) % tabs.length], true);
  });
});

function selectTab(tab, focus = false) {
  tabs.forEach((t) => {
    const active = t === tab;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", active);
    t.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(t.getAttribute("aria-controls"));
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  if (focus) tab.focus();
}

// ===== Interactive brain map =====
const brainRegions = {
  frontal: {
    title: "Frontal lobe",
    job: "The brain’s “control centre” — planning, decision-making, personality, self-control, speech production, and voluntary movement.",
    effects: [
      "Trouble planning, organising, or starting tasks",
      "Impulsive behaviour or poor judgement",
      "Personality and mood changes",
      "Difficulty speaking (expressive aphasia)",
      "Weakness on the opposite side of the body",
    ],
  },
  parietal: {
    title: "Parietal lobe",
    job: "Processes touch, temperature, and pain, and helps you know where your body is in space.",
    effects: [
      "Numbness or loss of feeling",
      "Difficulty with reading, writing, or maths",
      "Poor hand–eye coordination",
      "Ignoring one side of the body or space (neglect)",
      "Getting lost or confused about directions",
    ],
  },
  temporal: {
    title: "Temporal lobe",
    job: "Hearing, understanding language, memory, and recognising faces and objects.",
    effects: [
      "Memory problems, especially new memories",
      "Difficulty understanding speech (receptive aphasia)",
      "Trouble recognising faces",
      "Hearing changes",
      "Seizures and emotional changes",
    ],
  },
  occipital: {
    title: "Occipital lobe",
    job: "The brain’s vision centre — makes sense of everything you see.",
    effects: [
      "Blind spots or loss of part of the vision",
      "Difficulty recognising colours or objects",
      "Visual hallucinations",
      "Trouble reading or seeing movement",
    ],
  },
  cerebellum: {
    title: "Cerebellum",
    job: "Coordinates movement, balance, and posture, and helps with fine motor skills.",
    effects: [
      "Poor balance and unsteady walking",
      "Shaky hands (tremor)",
      "Slurred speech",
      "Difficulty with precise movements like writing",
      "Dizziness",
    ],
  },
  brainstem: {
    title: "Brainstem",
    job: "Controls automatic life functions — breathing, heart rate, blood pressure, swallowing, and sleep/wake cycles.",
    effects: [
      "Breathing and heart rate problems",
      "Difficulty swallowing",
      "Sleep problems",
      "Dizziness and nausea",
      "Reduced consciousness or coma in severe injuries",
    ],
  },
};

const brainSvg = $(".brain-svg");
const legendButtons = $$(".brain-legend button");

legendButtons.forEach((btn) =>
  btn.style.setProperty("--dot", `var(--r-${btn.dataset.region})`)
);

function showRegion(key) {
  const info = brainRegions[key];
  $("#region-title").textContent = info.title;
  $("#region-job").textContent = info.job;
  $("#region-effects").innerHTML =
    "<h4>If this area is injured, a person may have:</h4><ul>" +
    info.effects.map((e) => `<li>${e}</li>`).join("") +
    "</ul>";

  brainSvg.classList.add("has-active");
  $$(".region").forEach((r) => r.classList.toggle("active", r.dataset.region === key));
  legendButtons.forEach((b) => b.classList.toggle("active", b.dataset.region === key));
}

$$(".region").forEach((r) => {
  r.addEventListener("click", () => showRegion(r.dataset.region));
  r.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      showRegion(r.dataset.region);
    }
  });
});
legendButtons.forEach((b) => b.addEventListener("click", () => showRegion(b.dataset.region)));

// ===== Symptom tracker (tracker page only) =====
if ($("#tracker-form")) initTracker();

function initTracker() {
  const TRACKER_KEY = "nc-tracker";
  let entries = store(TRACKER_KEY) || [];

  const form = $("#tracker-form");
  const list = $("#tr-list");
  const dateInput = $("#tr-date");
  dateInput.valueAsDate = new Date();

  ["headache", "fatigue", "mood"].forEach((name) => {
    const input = $(`#tr-${name}`);
    const out = $(`#o-${name}`);
    input.addEventListener("input", () => (out.textContent = input.value));
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderLog() {
    list.innerHTML = "";
    $("#tr-empty").hidden = entries.length > 0;
    $("#tr-clear").hidden = entries.length === 0;

    entries
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((entry) => {
        const li = document.createElement("li");
        const date = new Date(entry.date + "T00:00").toLocaleDateString(undefined, {
          weekday: "short", month: "short", day: "numeric", year: "numeric",
        });
        li.innerHTML = `
          <span class="log-date">${date}</span>
          <button class="log-del" aria-label="Delete entry" data-id="${entry.id}">×</button>
          <div class="log-meta">
            <span>Headache ${entry.headache}/10</span>
            <span>Fatigue ${entry.fatigue}/10</span>
            <span>Mood ${entry.mood}/10</span>
            <span>Sleep ${entry.sleep}h</span>
          </div>
          ${entry.notes ? `<p class="log-notes">${escapeHtml(entry.notes)}</p>` : ""}
        `;
        list.appendChild(li);
      });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    entries.push({
      id: Date.now(),
      date: dateInput.value,
      headache: Number($("#tr-headache").value),
      fatigue: Number($("#tr-fatigue").value),
      mood: Number($("#tr-mood").value),
      sleep: Number($("#tr-sleep").value),
      notes: $("#tr-notes").value.trim(),
    });
    store(TRACKER_KEY, entries);
    $("#tr-notes").value = "";
    renderLog();
  });

  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".log-del");
    if (!btn) return;
    entries = entries.filter((x) => x.id !== Number(btn.dataset.id));
    store(TRACKER_KEY, entries);
    renderLog();
  });

  $("#tr-clear").addEventListener("click", () => {
    if (!confirm("Delete all tracker entries?")) return;
    entries = [];
    store(TRACKER_KEY, entries);
    renderLog();
  });

  renderLog();
}

// ===== Back to top =====
const toTop = $(".to-top");
window.addEventListener("scroll", () => toTop.classList.toggle("show", window.scrollY > 600), { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0 }));

// ===== Donate (donate page only) =====
if ($("#donate-form")) initDonate();

function initDonate() {
  const form = $("#donate-form");
  const amountField = $("#donate-amount");
  const customInput = $("#custom-amount");
  const button = $("#donate-btn");
  const presets = $$(".amount");
  const isConfigured = !form.merchant_id.value.startsWith("YOUR_");

  if (new URLSearchParams(location.search).has("thanks")) $("#donate-thanks").hidden = false;

  function setAmount(value) {
    const amount = Number(value);
    const valid = amount >= 10;
    amountField.value = valid ? amount.toFixed(2) : "";
    button.textContent = isConfigured
      ? valid ? `Donate R${amount.toLocaleString("en-ZA")}` : "Enter at least R10"
      : "Donations opening soon";
    button.disabled = !isConfigured || !valid;
  }

  presets.forEach((btn) =>
    btn.addEventListener("click", () => {
      presets.forEach((b) => b.classList.toggle("active", b === btn));
      customInput.value = "";
      setAmount(btn.dataset.amount);
    })
  );

  customInput.addEventListener("input", () => {
    presets.forEach((b) => b.classList.remove("active"));
    setAmount(customInput.value);
  });

  setAmount(100);
}
