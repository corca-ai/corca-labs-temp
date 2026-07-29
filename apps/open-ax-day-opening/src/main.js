/** @template {Element} T @param {string} selector @returns {T} */
function requiredElement(selector) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return /** @type {T} */ (element);
}

const slides = /** @type {HTMLElement[]} */ ([...document.querySelectorAll("[data-slide]")]);
const previousButton = /** @type {HTMLButtonElement} */ (requiredElement("#previous"));
const nextButton = /** @type {HTMLButtonElement} */ (requiredElement("#next"));
const currentLabel = requiredElement("#current");
const totalLabel = requiredElement("#total");
const revealPosition = /** @type {HTMLElement} */ (requiredElement("#reveal-position"));
let currentIndex = 0;
let revealedCount = 0;

const responseOrders = [
  [5, 1, 8, 3, 0, 7, 2, 6, 4],
  [2, 7, 0, 5, 3, 8, 1, 4, 6],
  [8, 3, 6, 1, 4, 0, 7, 2, 5],
  [4, 0, 7, 2, 8, 5, 1, 6, 3],
];

document.querySelectorAll(".responses").forEach((list, questionIndex) => {
  const items = [...list.children];
  const order = responseOrders[questionIndex];
  if (!order) return;
  order.forEach((itemIndex) => {
    const item = items[itemIndex];
    if (item) list.append(item);
  });
});

function currentSlide() {
  const slide = slides[currentIndex];
  if (!slide) throw new Error("Missing current slide");
  return slide;
}

/** @param {HTMLElement} slide */
function responsesFor(slide) {
  return /** @type {HTMLElement[]} */ ([...slide.querySelectorAll(".responses li")]);
}

function updateResponses() {
  const slide = currentSlide();
  const responses = responsesFor(slide);
  const list = slide.querySelector(".responses");
  const overview = responses.length > 0 && revealedCount === responses.length + 1;
  list?.classList.toggle("is-overview", overview);
  responses.forEach((item, index) => {
    const revealed = overview || index === revealedCount - 1;
    item.classList.toggle("is-revealed", revealed);
    item.setAttribute("aria-hidden", revealed ? "false" : "true");
  });
  revealPosition.hidden = responses.length === 0;
  revealPosition.textContent = overview
    ? "전체 응답"
    : responses.length
      ? `응답 ${revealedCount} / ${responses.length}`
      : "";
}

function updateControls() {
  const responses = responsesFor(currentSlide());
  currentLabel.textContent = String(currentIndex + 1);
  previousButton.disabled = currentIndex === 0 && revealedCount === 0;
  nextButton.disabled =
    currentIndex === slides.length - 1 && revealedCount === responses.length;
  updateResponses();
}

/** @param {number} index */
function showSlide(index) {
  currentIndex = Math.max(0, Math.min(slides.length - 1, index));
  revealedCount = 0;
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === currentIndex;
    slide.classList.toggle("is-active", active);
    slide.setAttribute("aria-hidden", active ? "false" : "true");
  });
  updateControls();
  window.location.hash = `slide-${currentIndex + 1}`;
}

function initialSlide() {
  const match = window.location.hash.match(/^#slide-(\d+)$/);
  return match ? Number(match[1]) - 1 : 0;
}

function advance() {
  const responses = responsesFor(currentSlide());
  if (revealedCount < responses.length + 1) {
    revealedCount += 1;
    updateControls();
    return;
  }
  if (currentIndex < slides.length - 1) showSlide(currentIndex + 1);
}

function retreat() {
  if (revealedCount > 0) {
    revealedCount -= 1;
    updateControls();
    return;
  }
  if (currentIndex > 0) {
    showSlide(currentIndex - 1);
    const responses = responsesFor(currentSlide());
    revealedCount = responses.length ? responses.length + 1 : 0;
    updateControls();
  }
}

previousButton.addEventListener("click", retreat);
nextButton.addEventListener("click", advance);

document.addEventListener("keydown", (event) => {
  if (["ArrowRight", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    advance();
  }
  if (["ArrowLeft", "PageUp"].includes(event.key)) {
    event.preventDefault();
    retreat();
  }
  if (event.key === "Home") {
    showSlide(0);
  }
  if (event.key === "End") {
    showSlide(slides.length - 1);
  }
});

totalLabel.textContent = String(slides.length);
showSlide(initialSlide());
