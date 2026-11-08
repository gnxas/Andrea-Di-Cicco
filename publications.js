/* Prof. Andrea Di Cicco — publications page interactions */
(function () {
  "use strict";

  const toolbar = document.getElementById("toolbar");
  const searchInput = document.getElementById("pub-search");
  const sortBtn = document.getElementById("sort-toggle");
  const resultCount = document.getElementById("result-count");
  const chips = Array.from(document.querySelectorAll(".chip[data-filter]"));
  const pubYears = document.getElementById("pub-years");
  const emptyState = document.getElementById("empty-state");
  const resetBtn = document.getElementById("reset-filters");
  const yearLinks = Array.from(document.querySelectorAll("#year-index a[data-year-link]"));
  const floatTop = document.getElementById("float-top");

  if (!pubYears) return;

  const yearGroups = Array.from(pubYears.querySelectorAll(".year-group"));
  const allPubs = Array.from(pubYears.querySelectorAll(".pub"));
  const totalCount = allPubs.length;

  // Precompute lowercase text for fast search
  const pubTextMap = new Map();
  allPubs.forEach((pub) => {
    pubTextMap.set(pub, pub.textContent.toLowerCase());
  });

  let currentFilter = "all";
  let currentQuery = "";

  const updateFilter = () => {
    const q = currentQuery.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/) : [];
    let visibleTotal = 0;

    yearGroups.forEach((group) => {
      const pubs = Array.from(group.querySelectorAll(".pub"));
      let visibleInYear = 0;

      pubs.forEach((pub) => {
        const types = (pub.dataset.types || "").split(/\s+/);
        const matchType = currentFilter === "all" || types.includes(currentFilter);
        let matchQuery = true;
        if (tokens.length > 0) {
          const text = pubTextMap.get(pub);
          matchQuery = tokens.every((tok) => text.includes(tok));
        }

        const show = matchType && matchQuery;
        pub.hidden = !show;
        if (show) {
          visibleInYear++;
          visibleTotal++;
        }
      });

      group.hidden = visibleInYear === 0;
      const countEl = group.querySelector(".year-count");
      if (countEl) {
        countEl.textContent = visibleInYear + (visibleInYear === 1 ? " entry" : " entries");
      }

      const year = group.dataset.year;
      const yLink = document.querySelector(`#year-index a[data-year-link="${year}"]`);
      if (yLink) {
        yLink.classList.toggle("is-empty", visibleInYear === 0);
        const span = yLink.querySelector("span");
        if (span) span.textContent = visibleInYear;
      }
    });

    if (resultCount) {
      resultCount.innerHTML = `<b>${visibleTotal}</b> of ${totalCount}`;
    }
    if (emptyState) {
      emptyState.hidden = visibleTotal > 0;
    }
  };

  /* Search input */
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      currentQuery = searchInput.value;
      updateFilter();
    });

    // Keyboard shortcut "/" to focus search
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== searchInput && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  /* Category filter chips */
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.toggle("is-active", c === chip));
      currentFilter = chip.dataset.filter || "all";
      updateFilter();
    });
  });

  /* Reset filters button */
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      currentQuery = "";
      currentFilter = "all";
      chips.forEach((c) => c.classList.toggle("is-active", c.dataset.filter === "all"));
      updateFilter();
    });
  }

  /* Sort toggle (Newest first / Oldest first) */
  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      const isDesc = sortBtn.dataset.order === "desc";
      const nextOrder = isDesc ? "asc" : "desc";
      sortBtn.dataset.order = nextOrder;
      const label = sortBtn.querySelector("span");
      if (label) label.textContent = nextOrder === "desc" ? "Newest first" : "Oldest first";

      const sortedGroups = [...yearGroups].sort((a, b) => {
        const ya = parseInt(a.dataset.year, 10);
        const yb = parseInt(b.dataset.year, 10);
        return nextOrder === "desc" ? yb - ya : ya - yb;
      });

      sortedGroups.forEach((group) => {
        pubYears.insertBefore(group, emptyState);
        const list = group.querySelector(".pub-list");
        if (list) {
          const items = Array.from(list.querySelectorAll(".pub")).reverse();
          items.forEach((it) => list.appendChild(it));
        }
      });

      const yearIndexList = document.getElementById("year-index");
      if (yearIndexList) {
        const yItems = Array.from(yearIndexList.children).reverse();
        yItems.forEach((li) => yearIndexList.appendChild(li));
      }
    });
  }

  /* Sticky toolbar shadow & floating back-to-top */
  const onScroll = () => {
    if (toolbar) {
      const rect = toolbar.getBoundingClientRect();
      toolbar.classList.toggle("is-stuck", rect.top <= 70);
    }
    if (floatTop) {
      floatTop.classList.toggle("is-visible", window.scrollY > 500);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Active year in sidebar */
  if ("IntersectionObserver" in window && yearLinks.length) {
    const yearObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const y = entry.target.dataset.year;
            yearLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.yearLink === y));
          }
        });
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    yearGroups.forEach((g) => yearObs.observe(g));
  }
})();
