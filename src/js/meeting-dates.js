/* Renders the next few upcoming Wednesday meeting dates for the Membership
   page, computed client-side at load time so dates never go stale between
   deploys of this static site. Flags the 3rd Wednesday of each month as the
   online committee meeting rather than a regular guest meeting. */
(function () {
  var NZ_TIMEZONE = "Pacific/Auckland";
  var NUMBER_OF_DATES = 6;

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

  function formatDate(date) {
    return new Intl.DateTimeFormat("en-NZ", {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function getUpcomingWednesdays(count) {
    var today = getNZDateParts();
    // Noon UTC avoids any DST edge case when stepping by whole days.
    var cursor = new Date(Date.UTC(today.year, today.month - 1, today.day, 12));

    var WEDNESDAY = 3;
    var diff = (WEDNESDAY - cursor.getUTCDay() + 7) % 7;
    cursor.setUTCDate(cursor.getUTCDate() + diff);

    var dates = [];
    for (var i = 0; i < count; i++) {
      dates.push(new Date(cursor.getTime()));
      cursor.setUTCDate(cursor.getUTCDate() + 7);
    }
    return dates;
  }

  function ordinalWednesdayOfMonth(date) {
    return Math.ceil(date.getUTCDate() / 7);
  }

  function render() {
    var container = document.getElementById("upcoming-meetings");
    if (!container) return;

    var meetingTime = container.dataset.meetingTime || "";
    var committeeTime = container.dataset.committeeTime || "";

    var dates = getUpcomingWednesdays(NUMBER_OF_DATES);

    container.innerHTML = "";
    dates.forEach(function (date) {
      var li = document.createElement("li");
      var isCommitteeMeeting = ordinalWednesdayOfMonth(date) === 3;

      if (isCommitteeMeeting) {
        li.innerHTML =
          "<strong>" + formatDate(date) + "</strong> &mdash; " +
          "<span class=\"meeting-note\">Online committee meeting</span>, " +
          committeeTime + " (committee only, not a guest meeting)";
      } else {
        li.innerHTML =
          "<strong>" + formatDate(date) + "</strong> &mdash; Club meeting, " +
          meetingTime;
      }

      container.appendChild(li);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
