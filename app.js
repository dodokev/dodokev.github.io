// DOM References
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const closeBtn = document.getElementById("close-drawer");
const stage = document.getElementById("stage");
const world = document.getElementById("world");
let activeNode = null;

// Preload sounds so there is zero delay when clicking
const sounds = {
  hover: new Audio("assets/sound/paper.mp3"),
  open: new Audio("assets/sound/paper.mp3"),
  close: new Audio("assets/sound/paper.mp3")
};

// Adjust volume (0.0 = mute, 1.0 = full volume)
sounds.hover.volume = 0.25;
sounds.open.volume = 0.5;
sounds.close.volume = 0.4;

function playSound(name) {
  const audio = sounds[name];
  if (!audio) return;
  audio.currentTime = 0; // Rewinds immediately so rapid hovers/clicks replay cleanly
  audio.play().catch(() => {
    // Ignores browser warnings if user hovers before clicking the page once
  });
}

// 1. Open Drawer with One Click (reads directly from portfolioData in data.js)
function openNodeDetails(id, clickedNode) {
  const item = portfolioData[id];
  if (!item) return;

  document.getElementById("drawer-category").textContent = item.category;
  document.getElementById("drawer-title").textContent = item.title;
  document.getElementById("drawer-summary").textContent = item.summary;
  document.getElementById("drawer-details").textContent = item.details;

  if (activeNode) activeNode.classList.remove("is-active");
  if (clickedNode) {
    activeNode = clickedNode;
    activeNode.classList.add("is-active");
  }

  document.querySelectorAll(".node").forEach((node) => {
    if (node === clickedNode) return; // Skip the active button sliding to the bottom

    const direction = Math.random() < 0.5 ? -1 : 1;
    const angle = direction * (Math.random() * 10 + 5).toFixed(1);
    
    node.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)" },
        { transform: "translate(-50%, -50%) rotate(0deg)", offset: 0.25 },
        { transform: `translate(-50%, calc(-50% - 5px)) rotate(${angle}deg)`, offset: 0.50 },
        { transform: `translate(-50%, calc(-50% + 5px)) rotate(${(angle * -0.45).toFixed(1)}deg)`, offset: 0.80 },
        { transform: "translate(-50%, -50%) rotate(0deg)" }
      ],
      {
        duration: 1500,
        easing: "cubic-bezier(0.22, 1.5, 0.36, 1)"
      }
    );
  });

  // Render tags
  const tagsContainer = document.getElementById("drawer-tags");
  tagsContainer.innerHTML = "";
  (item.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tagsContainer.appendChild(span);
  });

  // Render optional CTA link
  const linkEl = document.getElementById("drawer-link");
  if (item.link) {
    linkEl.href = item.link;
    linkEl.textContent = item.linkText || "View Details →";
    linkEl.style.display = "inline-block";
  } else {
    linkEl.style.display = "none";
  }

  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  backdrop.classList.add("is-visible");
  stage.classList.add("is-shifted");
  document.body.classList.add("is-shifted");

  playSound("open");
}

// 2. Close Drawer
function closeDrawer() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("is-visible");
  stage.classList.remove("is-shifted");
  document.body.classList.remove("is-shifted");

  if (activeNode) {
    activeNode.classList.remove("is-active");
    activeNode = null;
  }

  playSound("open");
}

// 3. Bind Node Clicks & Subtle Pan Interaction
function bindEvents() {
  document.querySelectorAll(".node").forEach((node) => {
    node.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = node.getAttribute("data-id");
      openNodeDetails(id, node);
    });
    // node.addEventListener("mouseenter", () => {
    //   playSound("hover");
    // });
  });

  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // Subtle mouse-parallax pan effect on the stage
  stage.addEventListener("mousemove", (e) => {
    const xRatio = (e.clientX / window.innerWidth - 0.5) * -24;
    const yRatio = (e.clientY / window.innerHeight - 0.5) * -24;
    world.style.transform = `translate(${xRatio}px, ${yRatio}px)`;
  });

  
}

// Start immediately—no server or fetch required
bindEvents();

// --- Live Curved Thread Updater ---
const connectionsSvg = document.getElementById("connections");
const threadPaths = document.querySelectorAll("#connections path");
const threadPins = document.querySelectorAll("#connections .thread-pin");

// Helper to get the exact thread attachment coordinates of a button
function getAnchorPoint(nodeEl, worldRect) {
  const rect = nodeEl.getBoundingClientRect();
  return {
    x: rect.left - worldRect.left + rect.width / 2,
    y: rect.top - worldRect.top + rect.height * 0.22
  };
}

function updateThreads() {
  const worldRect = world.getBoundingClientRect();

  // 1. Update the 4 curved threads
  threadPaths.forEach((path) => {
    const fromEl = document.querySelector(`.node[data-id="${path.dataset.from}"]`);
    const toEl = document.querySelector(`.node[data-id="${path.dataset.to}"]`);
    if (!fromEl || !toEl) return;

    if (fromEl.classList.contains("is-active") || toEl.classList.contains("is-active")) {
      return; // Freeze thread when active
    }

    const p1 = getAnchorPoint(fromEl, worldRect);
    p1.y -= 25;
    const p2 = getAnchorPoint(toEl, worldRect);
    p2.y -= 25;

    const midX = (p1.x + p2.x) / 2;
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const midY = (p1.y + p2.y) / 2 + dist * 0.22;

    path.setAttribute("d", `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`);
  });

  // 2. Update the 5 pin images at each node's attachment point
  threadPins.forEach((pin) => {
    const nodeEl = document.querySelector(`.node[data-id="${pin.dataset.node}"]`);
    if (!nodeEl) return;

    // Freeze pin in place when its button is active (matches frozen thread)
    if (nodeEl.classList.contains("is-active")) {
      return;
    }

    const pt = getAnchorPoint(nodeEl, worldRect);
    pt.y -= 25;
    const w = parseFloat(pin.getAttribute("width")) || 24;
    const h = parseFloat(pin.getAttribute("height")) || 24;

    // Center the image right over the thread endpoint
    pin.setAttribute("x", pt.x - w / 2);
    pin.setAttribute("y", pt.y - h / 2);
  });

  requestAnimationFrame(updateThreads);
}

updateThreads();