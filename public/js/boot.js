'use strict';
/* ---- boot ---- */
(function boot() {
  S = loadStore();
  if (!S || S.v !== SEED_V || !S.seedDate || Math.abs(daysBetween(S.seedDate, todayISO())) > 10) { S = buildSeed(); save(); }
  if (!S.settings) S.settings = JSON.parse(JSON.stringify(SITE));      // upgrade older saved demos
  applySiteSettings();
  render();
  // Check for a real, already-signed-in session (e.g. returning visitor with a valid cookie).
  // Silent and non-blocking: the page above renders immediately either way.
  detectBackend().then(async info => {
    if (!info.connected) return;
    await syncCatalog(info.user);
    if (info.user) {
      const user = mirrorSignedInUser(info.user);
      if (user.role === 'parent') await mirrorChildrenFromServer(user.id);
      if (user.role === 'teacher') await mirrorMyStudents();
      await mirrorEnrolments(user);
      await mirrorEnquiries(user);
      await mirrorDirectory(user);
      if (user.role === 'parent') await mirrorAllMyHomework(user.id);
      if (user.role === 'parent') await mirrorMyInvoices();
      await mirrorAllInvoices(user);
    }
    // Don't yank the page out from under someone who is already typing into a
    // form (a full re-render would clear what they've entered so far) — the
    // correct state is saved either way, so the next natural navigation picks
    // it up if we skip re-rendering right now.
    const active = document.activeElement;
    if (!active || !/^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) render();
  });
})();
