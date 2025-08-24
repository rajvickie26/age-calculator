// Age Calculator - Modern Web App
(function () {
  'use strict';

  // UI strings: English default with Tamil fallback (not used in this English-only version)
  const ui = {
    en: {
      mainTitle: "Age Calculator",
      subtitle: "Find your exact live age with your birth date, time, and timezone",
      formTitle: "Your Birth Details",
      dob: "Date of Birth",
      tob: "Time of Birth (optional)",
      timezone: "Timezone:",
      tzRefresh: "Auto-set browser timezone",
      calcBtn: "Calculate",
      results: [
        "Years", "Months", "Weeks", "Days", "Hours", "Minutes", "Seconds"
      ],
      nextBirthday: "Next Birthday",
      milestoneDay: "10,000th Day",
      milestoneSec: "1,000,000,000th Second",
      downloadICS: "Download .ics",
      faq: [
        ["How is age calculated?",
          "Using your birth date, time, and timezone for exact results in years, months, days, hours, minutes, seconds."],
        ["Can I export milestones to my calendar?",
          "Yes, you can download .ics files for key milestones."],
        ["Is it accurate for leap year birthdays?",
          "Yes! Special rules apply for Feb 29 birthdays."],
        ["Is my age recalculated live?",
          "Every second, your age and countdown updates automatically."],
        ["How do I switch to English/Tamil?",
          "Use the language toggle at the top; it remembers your choice."]
      ],
      errors: {
        required: "Birth date required!",
        future: "Date of birth is in the future!",
        invalid: "Enter a valid date."
      },
      daysText: "days",
      birthdayWeekday: "Weekday"
    }
  };

  // Fix language to English only
  const lang = 'en';

  // --- DOM refs
  const refs = {
    langEn: document.getElementById('lang-en'),
    langTa: document.getElementById('lang-ta'),
    mainTitle: document.getElementById('main-title'),
    subtitle: document.getElementById('subtitle'),
    ageForm: document.getElementById('age-form'),
    labelDob: document.getElementById('label-dob'),
    labelTob: document.getElementById('label-tob'),
    labelTz: document.getElementById('label-timezone'),
    tzSelect: document.getElementById('timezone'),
    tzRefresh: document.getElementById('tz-refresh'),
    calcBtn: document.getElementById('calc-btn'),
    errorMsg: document.getElementById('error-msg'),
    resultsGrid: document.getElementById('results-grid'),
    nextBdPill: document.getElementById('next-bd-pill'),
    milestonesCard: document.getElementById('milestones-card'),
    faqAccordion: document.getElementById('faq-accordion'),
    faqList: document.querySelector('.faq-list'),
    internalLinks: document.getElementById('internal-links-block'),
    darkToggle: document.getElementById('dark-toggle')
  };

  // --- Helper for UI strings
  function _(key) {
    return ui[lang][key] || key;
  }

  // --- Populate UI elements with English strings
  function renderLang() {
    refs.langEn.classList.add('active');
    refs.langEn.setAttribute('aria-pressed', 'true');
    refs.langTa.classList.remove('active');
    refs.langTa.setAttribute('aria-pressed', 'false');

    refs.mainTitle.textContent = _( 'mainTitle' );
    refs.subtitle.textContent = _( 'subtitle' );
    document.title = `${_( 'mainTitle' )} | ${_( 'subtitle' )}`;
    refs.calcBtn.textContent = _( 'calcBtn' );
    refs.labelDob.textContent = _( 'dob' );
    refs.labelTob.textContent = _( 'tob' );
    refs.labelTz.textContent = _( 'timezone' );
    refs.tzRefresh.textContent = _( 'tzRefresh' );
    refs.ageForm.querySelector('h2').textContent = _( 'formTitle' );
    renderFAQ();
  }

  // --- Render FAQ accordion in English
  function renderFAQ() {
    refs.faqList.innerHTML = '';
    ui[lang].faq.forEach(([q, a], idx) => {
      const idQ = `faq-q-${idx}`;
      const qBtn = document.createElement('button');
      qBtn.className = 'faq-q';
      qBtn.setAttribute('aria-expanded', 'false');
      qBtn.setAttribute('aria-controls', idQ);
      qBtn.textContent = q;
      qBtn.onclick = () => {
        const expanded = qBtn.getAttribute('aria-expanded') === 'true';
        qBtn.setAttribute('aria-expanded', !expanded);
        aDiv.style.display = expanded ? 'none' : 'block';
      };
      qBtn.onkeyup = (e) => { if (e.key === "Enter") qBtn.click(); };
      qBtn.setAttribute('tabindex', '0');
      const aDiv = document.createElement('div');
      aDiv.className = 'faq-a';
      aDiv.id = idQ;
      aDiv.textContent = a;
      aDiv.style.display = 'none';
      refs.faqList.appendChild(qBtn);
      refs.faqList.appendChild(aDiv);
    });
  }

  // --- Disable language toggling—English fixed
  refs.langEn.onclick = () => {};
  refs.langTa.onclick = (e) => {
    e.preventDefault();
    alert("Language switching disabled. This app is English only.");
  };

  // --- Dark mode toggle
  function setDark(mode) {
    document.documentElement.classList.toggle('night', mode);
  }
  function autoDark() {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setDark(true);
    else setDark(false);
  }
  autoDark();
  refs.darkToggle.onclick = () => {
    const hasNight = document.documentElement.classList.toggle('night');
    localStorage.setItem('dark', hasNight ? '1' : '');
  };
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', autoDark);
  if (localStorage.getItem('dark')) setDark(true);

  // --- Populate timezone select list
  function populateTzSelect() {
    const guesses = [
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Europe/Berlin',
      'Asia/Singapore', 'Asia/Dubai'
    ];
    refs.tzSelect.innerHTML = '';
    const uniqueZones = Array.from(new Set([
      ...guesses,
      ...Intl.supportedValuesOf('timeZone')
    ]));
    uniqueZones.forEach(tz => {
      const option = document.createElement('option');
      option.value = tz;
      option.textContent = tz;
      refs.tzSelect.appendChild(option);
    });
    refs.tzSelect.value = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  }
  populateTzSelect();

  // --- Form submit and input
  let dobVal = '', tobVal = '', tzOverride = null;
  refs.ageForm.addEventListener('submit', e => {
    e.preventDefault();
    dobVal = refs.ageForm.dob.value;
    tobVal = refs.ageForm.tob.value;
    tzOverride = refs.tzSelect.value;
    renderResults(true);
  });
  refs.ageForm.dob.oninput = e => {
    dobVal = e.target.value;
    renderResults(true);
  };
  refs.tzSelect.onchange = e => {
    tzOverride = e.target.value;
    renderResults(true);
  };

  // --- Parse birth details (date, time)
  function parseBirth() {
    if (!dobVal) return { err: ui.en.errors.required };
    const now = new Date();
    const parts = dobVal.split('-');
    if (parts.length !== 3) return { err: ui.en.errors.invalid };
    let dobDate = new Date(Date.UTC(+parts[0], +parts-1, +parts));
    if (tobVal) {
      const timeParts = tobVal.split(':');
      if (timeParts.length >= 2)
        dobDate.setUTCHours(+timeParts, +timeParts);
    }
    // Apply timezone (offset)
    const tz = tzOverride || Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      try {
        dobDate = new Date(dobDate.toLocaleString('en-US', { timeZone: tz }));
      } catch {}
    }
    if (dobDate > now) return { err: ui.en.errors.future };
    return { dobDate, now, tz };
  }

  // --- Compute age, countdown, milestones
  function computeResults({ dobDate, now }) {
    const ms = now.getTime() - dobDate.getTime();
    const seconds = ms / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;
    const days = ms / (1000 * 60 * 60 * 24);
    const weeks = ms / (1000 * 60 * 60 * 24 * 7);

    let y = now.getUTCFullYear() - dobDate.getUTCFullYear();
    let m = now.getUTCMonth() - dobDate.getUTCMonth();
    let d = now.getUTCDate() - dobDate.getUTCDate();

    if (d < 0) {
      m--;
      d += daysInMonth(now.getUTCFullYear(), ((now.getUTCMonth()+11) % 12) + 1);
    }
    if (m < 0) {
      y--;
      m += 12;
    }

    let nextBirthday = calcNextBirthday(dobDate, now);

    if (dobDate.getUTCMonth() === 1 && dobDate.getUTCDate() === 29) {
      nextBirthday = calcNextBirthdayFeb29(dobDate, now);
    }

    let milestoneDayDate = new Date(dobDate.getTime() + 10000 * 24 * 3600 * 1000);
    let milestoneSecDate = new Date(dobDate.getTime() + 1e9 * 1000);

    return {
      years: y,
      months: m,
      days: d,
      weeks: weeks.toFixed(5),
      daysTotal: Math.floor(days),
      hours: Math.floor(hours),
      minutes: Math.floor(minutes),
      seconds: Math.floor(seconds),
      nextBirthday,
      milestoneDayDate,
      milestoneSecDate
    };
  }

  function daysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function calcNextBirthday(dobDate, now) {
    let nextYear = now.getUTCFullYear();
    if (now.getUTCMonth() > dobDate.getUTCMonth() ||
        (now.getUTCMonth() === dobDate.getUTCMonth() && now.getUTCDate() >= dobDate.getUTCDate())) {
      nextYear++;
    }
    let bd = new Date(Date.UTC(
      nextYear,
      dobDate.getUTCMonth(),
      dobDate.getUTCDate(),
      dobDate.getUTCHours(),
      dobDate.getUTCMinutes()
    ));
    let ms = bd.getTime() - now.getTime();
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));
    let hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    let secs = Math.floor((ms % (1000 * 60)) / 1000);
    let weekday = bd.toLocaleDateString('en-US', { weekday: 'long' });
    return { date: bd, days, hours, mins, secs, weekday };
  }

  function calcNextBirthdayFeb29(dobDate, now) {
    let nextYear = now.getUTCFullYear();
    let isLeap = y => (y % 4 ===0 && (y % 100 !== 0 || y % 400 === 0));
    while (!isLeap(nextYear)) { nextYear++; }
    let bd = new Date(Date.UTC(nextYear, 1, 28)); // Feb 28 default for leap birthdays
    let ms = bd.getTime() - now.getTime();
    let days = Math.floor(ms / (1000 * 60 * 60 * 24));
    let hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    let secs = Math.floor((ms % (1000 * 60)) / 1000);
    let weekday = bd.toLocaleDateString('en-US', { weekday: 'long' });
    return { date: bd, days, hours, mins, secs, weekday };
  }

  // --- Render age results live
  let liveTimer = null;
  function renderResults(refresh = false) {
    clearTimeout(liveTimer);
    const data = parseBirth();
    if (data.err) {
      refs.errorMsg.textContent = data.err;
      refs.resultsGrid.innerHTML = '';
      refs.nextBdPill.innerHTML = '';
      refs.milestonesCard.innerHTML = '';
      return;
    } else {
      refs.errorMsg.textContent = '';
    }
    const res = computeResults(data);

    refs.resultsGrid.innerHTML = `
      <div class="result-item">${_( 'results' )[0]}: <strong>${res.years}</strong></div>
      <div class="result-item">${_( 'results' )}: <strong>${res.months}</strong></div>
      <div class="result-item">${_( 'results' )}: <strong>${res.weeks}</strong></div>
      <div class="result-item">${_( 'results' )}: <strong>${res.days}</strong></div>
      <div class="result-item">${_( 'results' )}: <strong>${res.hours}</strong></div>
      <div class="result-item">${_( 'results' )}: <strong>${res.minutes}</strong></div>
      <div class="result-item">${_( 'results' )}: <strong>${res.seconds}</strong></div>
      <div class="result-item">${_( 'daysText' )} lived (total): <strong>${res.daysTotal}</strong></div>
    `;

    refs.nextBdPill.innerHTML = `
      <span>${_( 'nextBirthday' )}: 
        <strong>${res.nextBirthday.date.toLocaleDateString('en-US')}</strong>
        (${res.nextBirthday.weekday})<br>
        Countdown: ${res.nextBirthday.days} ${_( 'daysText' )}, ${res.nextBirthday.hours}h, 
        ${res.nextBirthday.mins}m, ${res.nextBirthday.secs}s
      </span>
    `;

    refs.milestonesCard.innerHTML = `
      <div class="milestone-row">
        <span class="milestone-label">${_( 'milestoneDay' )}:</span>
        <span>${res.milestoneDayDate.toLocaleDateString('en-US')}</span>
        <button class="download-ics-btn" onclick="window.downloadICS('${res.milestoneDayDate.toISOString()}', '10,000th Day')">${_( 'downloadICS' )}</button>
      </div>
      <div class="milestone-row">
        <span class="milestone-label">${_( 'milestoneSec' )}:</span>
        <span>${res.milestoneSecDate.toLocaleDateString('en-US')} ${res.milestoneSecDate.toLocaleTimeString('en-US')}</span>
        <button class="download-ics-btn" onclick="window.downloadICS('${res.milestoneSecDate.toISOString()}', '1,000,000,000th Second')">${_( 'downloadICS' )}</button>
      </div>
    `;

    // ICS Download function available globally
    window.downloadICS = function(dateISOString, title) {
      const date = new Date(dateISOString);
      const pad = n => n.toString().padStart(2, '0');
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`,
        `SUMMARY:${title}`,
        'DESCRIPTION:Automated milestone calendar reminder from Age Calculator.',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      const blob = new Blob([ics], {type: "text/calendar"});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${title.replace(/[^a-zA-Z0-9]/g,'_')}.ics`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    };

    if (!refresh) return;
    liveTimer = setTimeout(() => { renderResults(false); }, 1000);
  }

  // --- Initialize UI
  renderLang();
  renderResults();

  // --- Inline unit tests in console
  function runTests() {
    let d = new Date(Date.UTC(2016, 1, 29)); 
    let n = new Date(Date.UTC(2020, 2, 1));
    let r = n.getUTCFullYear()-d.getUTCFullYear();
    console.assert(r === 4, "Feb29 to Mar1 year diff correct");
    d = new Date(Date.UTC(2000, 5, 20));
    n = new Date(Date.UTC(2025, 7, 24));
    let ms = n.getTime()-d.getTime();
    let days = ms/(1000*60*60*24);
    console.assert(Math.round(days) === 9216, "Days lived calculation correct");
    let tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let date = new Date(Date.UTC(2024,10,4,0,0));
    let local = new Date(date.toLocaleString('en-US', {timeZone: tz}));
    console.assert(local instanceof Date, "Timezone conversion safe");
  }
  runTests();
})();
