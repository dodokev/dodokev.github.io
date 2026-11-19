// DOM References
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("backdrop");
const closeBtn = document.getElementById("close-drawer");
const stage = document.getElementById("stage");
const world = document.getElementById("world");

// 1. Open Drawer with One Click (reads directly from portfolioData in data.js)
function openNodeDetails(id) {
  const item = portfolioData[id];
  if (!item) return;

  document.getElementById("drawer-category").textContent = item.category;
  document.getElementById("drawer-title").textContent = item.title;
  document.getElementById("drawer-summary").textContent = item.summary;
  document.getElementById("drawer-details").textContent = item.details;

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
}

// 2. Close Drawer
function closeDrawer() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.classList.remove("is-visible");
}

// 3. Bind Node Clicks & Subtle Pan Interaction
function bindEvents() {
  document.querySelectorAll(".node").forEach((node) => {
    node.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = node.getAttribute("data-id");
      openNodeDetails(id);
    });
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
