const jobSearch = document.querySelector("#job-search");
const queryInput = document.querySelector("#query");
const locationInput = document.querySelector("#location");
const jobCards = [...document.querySelectorAll(".job-card")];
const jobCount = document.querySelector("#job-count");
const emptyState = document.querySelector("#empty-state");
const sortSelect = document.querySelector("#sort-jobs");
const jobList = document.querySelector("#job-list");

function filterJobs() {
  const query = queryInput.value.trim().toLowerCase();
  const location = locationInput.value.trim().toLowerCase();
  let visibleCount = 0;

  for (const card of jobCards) {
    const subject = card.dataset.subject ?? "";
    const school = card.querySelector(".school-name")?.textContent.toLowerCase() ?? "";
    const city = card.querySelector(".school-location")?.textContent.toLowerCase() ?? "";
    const matchesQuery = !query || subject.includes(query) || school.includes(query);
    const matchesLocation = !location || city.includes(location);
    const isVisible = matchesQuery && matchesLocation;

    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  }

  jobCount.textContent = String(visibleCount);
  emptyState.hidden = visibleCount !== 0;
}

jobSearch.addEventListener("submit", (event) => {
  event.preventDefault();
  filterJobs();
  document.querySelector("#jobs").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-search]").forEach((chip) => {
  chip.addEventListener("click", () => {
    queryInput.value = chip.dataset.search;
    filterJobs();
  });
});

document.querySelectorAll(".save-button").forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    const isSaved = button.classList.toggle("is-saved");
    button.setAttribute("aria-pressed", String(isSaved));
    button.textContent = isSaved ? "♥" : "♡";
  });
});

sortSelect.addEventListener("change", () => {
  const sorted = [...jobCards].sort((a, b) => {
    if (sortSelect.value === "salary") {
      return Number(b.dataset.salary) - Number(a.dataset.salary);
    }
    return jobCards.indexOf(a) - jobCards.indexOf(b);
  });
  sorted.forEach((card) => jobList.append(card));
});

const menuButton = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
menuButton.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  mainNav.classList.toggle("is-open", !isOpen);
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    mainNav.classList.remove("is-open");
  });
});
