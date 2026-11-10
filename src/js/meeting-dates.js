/* Renders the club's real meeting schedule (from the committee's planning
   sheet) as a scrollable list on the Membership page — past meetings and
   upcoming ones together, auto-scrolled so "today" sits at the top. This
   mirrors the Samdee calendar pattern used on the homepage project.

   The schedule itself is static/known in advance (it's a real roster, not
   an algorithmic "every Wednesday" pattern — committee meetings land on
   the 4th Wednesday most months, but there are exceptions), so dates are
   hardcoded here rather than computed. Update MEETINGS when the committee
   publishes the next block of dates. */
(function () {
  var NZ_TIMEZONE = "Pacific/Auckland";

  // One row per meeting. type: "regular" | "committee" | "cancelled".
  // note: optional short extra detail (contest, special format, etc).
  var MEETINGS = [
    { date: "2026-07-01", type: "committee" },
    { date: "2026-07-08", type: "regular" },
    { date: "2026-07-15", type: "regular" },
    { date: "2026-07-22", type: "committee" },
    { date: "2026-07-29", type: "regular" },
    { date: "2026-08-05", type: "regular" },
    { date: "2026-08-12", type: "regular", note: "3-minute thesis meeting" },
    { date: "2026-08-19", type: "cancelled" },
    { date: "2026-08-26", type: "committee" },
    { date: "2026-09-02", type: "regular" },
    { date: "2026-09-09", type: "regular" },
    { date: "2026-09-16", type: "regular" },
    { date: "2026-09-23", type: "committee" },
    { date: "2026-09-30", type: "regular" },
    { date: "2026-10-07", type: "regular" },
    { date: "2026-10-14", type: "regular" },
    { date: "2026-10-21", type: "regular", note: "Contest" },
    { date: "2026-10-28", type: "committee" },
    { date: "2026-11-04", type: "regular" },
    { date: "2026-11-11", type: "regular" },
    { date: "2026-11-18", type: "regular" },
    { date: "2026-11-25", type: "regular", note: "Contest" },
    { date: null, type: "committee" },
    { date: "2026-12-02", type: "regular" },
    { date: "2026-12-09", type: "regular", note: "Outdoor meeting @ Liffey Stream, 7:30–8:30pm" },
  ];

  var TYPE_META = {
    regular: { icon: "🎙️", label: "Club Meeting" }, // 🎙️
    committee: { icon: "💻", label: "Committee Meeting (online)" }, // 💻
    cancelled: { icon: "❌", label: "Meeting Cancelled" }, // ❌
  };

  function getNZDateParts() {
    var parts = new Intl.DateTimeFormat("en-NZ", {
      timeZone: NZ_TIMEZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(new Date());

    var get = function (type) {
      var found = parts.find(function (p) {
        return p.type === type;
      });
      return found ? parseInt(found.value, 10) : null;
    };

    return { year: get("year"), month: get("month"), day: get("day") };
  }

  function todayMidnightMs() {
    var t = getNZDateParts();
    return new Date(t.year, t.month - 1, t.day).getTime();
  }

  function formatDate(isoDate) {
    var d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("en-NZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function render(containerId) {
    var ul = document.getElementById(containerId);
    if (!ul) return;

    var meetingTime = ul.dataset.meetingTime || "";
    var committeeTime = ul.dataset.committeeTime || "";
    var limit = ul.dataset.limit ? parseInt(ul.dataset.limit, 10) : null;
    var todayMs = todayMidnightMs();

    var sorted = MEETINGS.slice().sort(function (a, b) {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    });

    var toRender = sorted;
    if (limit) {
      // Compact view (e.g. homepage "Next meeting"): only show from the
      // first non-past entry onward, capped at `limit` items.
      var firstUpcomingIndex = sorted.findIndex(function (m) {
        if (!m.date) return true; // TBC counts as "not past"
        return new Date(m.date + "T00:00:00").getTime() >= todayMs;
      });
      if (firstUpcomingIndex === -1) firstUpcomingIndex = sorted.length;
      toRender = sorted.slice(firstUpcomingIndex, firstUpcomingIndex + limit);
    }

    if (toRender.length === 0) {
      ul.innerHTML = '<li class="meeting-empty">No meetings scheduled right now.</li>';
      return;
    }

    ul.innerHTML = "";
    var foundNext = false;

    toRender.forEach(function (m, index) {
      var isTBC = !m.date;
      var isPast = false;
      var isToday = false;

      if (!isTBC) {
        var evMs = new Date(m.date + "T00:00:00").getTime();
        isPast = evMs < todayMs;
        isToday = evMs === todayMs;
      }

      var isNext = !isPast && !isTBC && !foundNext;
      if (isNext) foundNext = true;

      var meta = TYPE_META[m.type] || TYPE_META.regular;
      var timeText = m.type === "committee" ? committeeTime : meetingTime;

      var classes = ["meeting-item", "meeting-" + m.type];
      if (isToday) classes.push("is-today");
      else if (isNext) classes.push("is-next");
      if (isPast) classes.push("is-past");
      if (isTBC) classes.push("is-tbc");

      var dateText = isTBC ? "Date TBC" : formatDate(m.date);
      var noteHtml = m.note
        ? '<span class="meeting-note">' + m.note + "</span>"
        : "";

      var li = document.createElement("li");
      li.className = classes.join(" ");
      li.style.animationDelay = index * 25 + "ms";
      li.innerHTML =
        '<span class="meeting-icon" aria-hidden="true">' + meta.icon + "</span>" +
        '<span class="meeting-body">' +
        '<span class="meeting-label">' + meta.label +
        (timeText && m.type !== "cancelled" ? ", " + timeText : "") +
        "</span>" +
        '<span class="meeting-date">' + dateText + "</span>" +
        noteHtml +
        "</span>";

      ul.appendChild(li);
    });

    // Scroll so the first non-past entry (today, or the next upcoming
    // meeting) sits at the top of the scrollable list.
    requestAnimationFrame(function () {
      var firstCurrent = ul.querySelector(".meeting-item:not(.is-past)");
      if (firstCurrent) ul.scrollTop = firstCurrent.offsetTop;
    });
  }

  function init() {
    render("upcoming-meetings");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
