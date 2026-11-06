'use strict';
/* =====================================================================
   MEA – help chatbot (floating widget on public + parent pages).
   Asks /api/chat (Claude, when ANTHROPIC_API_KEY is set on Netlify) and falls
   back to the built-in answers below when that is unavailable, so it always
   replies. Self-contained: builds its own DOM and listeners.
   ===================================================================== */
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const signedIn = () => { try { return !!(typeof me === 'function' && me()); } catch (e) { return false; } };
  const isParent = () => { try { const u = me(); return !!u && u.role === 'parent'; } catch (e) { return false; } };
  const L = (t, p) => `[${t}](#${p})`;

  /* ---- built-in answers (used when the AI service is off or fails) ---- */
  const disc = () => {
    if (!signedIn()) return '';
    const bits = [];
    if (+SITE.siblingDiscount) bits.push(`${SITE.siblingDiscount}% off for siblings`);
    if (+SITE.multiCourseDiscount && +SITE.multiCourseLessons) bits.push(`${SITE.multiCourseDiscount}% off when a selection reaches ${SITE.multiCourseLessons} lessons`);
    return bits.length ? ` Current discounts: ${bits.join(' and ')}, applied automatically.` : '';
  };
  const INTENTS = [
    { k: ['pay', 'paying', 'payment', 'invoice', 'invoices', 'card', 'bank', 'transfer', 'owe', 'bill', 'billing'], a: () => signedIn()
      ? `To pay, go to ${L('Payments', '/my-mea/payments')}, open the invoice and follow the pay option. Card payments are secure. If you would rather pay by bank transfer, contact us and we will mark it as paid when it arrives. After we accept an enrolment you get a first-payment invoice, and your child’s place is confirmed as soon as it is paid.`
      : `Sign in and go to Payments in My MEA to see and pay your invoices. After we accept an enrolment you receive a first-payment invoice, and the place is confirmed once it is paid. ${L('Sign in', '/account/sign-in')} or ${L('create a free account', '/account/create')}. For bank transfer, contact us.` },
    { k: ['price', 'prices', 'cost', 'fee', 'fees', 'much', 'expensive', 'discount', 'discounts', 'sibling', 'cheap'], a: () => signedIn()
      ? `Prices are per lesson and shown on each course and class card.${disc()} You can see them in ${L('Find a Course', '/my-mea/courses/find')}.`
      : `Prices are shown once you have signed in. ${L('Create a free account', '/account/create')} to see them, no payment needed.` },
    { k: ['trial', 'free', 'taster', 'try'], a: () => `Some courses offer a trial class and show a “Trial class available” label. In ${signedIn() ? L('Find a Course', '/my-mea/courses/find') : L('the Course Finder', '/courses')} you can use the Trial lessons filter to see them. If a course has no label, ask us and we will check.` },
    { k: ['one', 'one-to-one', 'private', '1:1', 'tutor', 'individual'], a: () => `One-to-one lessons give your child a tutor of their own. Choose a subject, pick “One-to-one”, then tick every time you are free (Mon–Fri and Sun, 5–10pm). We then arrange a teacher and weekly time from your slots and send the first invoice. Start from ${signedIn() ? L('Find a Course', '/my-mea/courses/find') : L('the courses', '/courses')}.` },
    { k: ['group', 'class', 'classes', 'slots', 'times', 'timeslot'], a: () => `Group classes are small live online classes at fixed weekly times. Pick a subject and choose “Group sessions” to see every current time slot, then request a place. ${signedIn() ? L('Find a Course', '/my-mea/courses/find') : L('Browse courses', '/courses')}.` },
    { k: ['enrol', 'enroll', 'enrolment', 'register', 'sign', 'signup', 'join', 'start', 'begin'], a: () => `1. ${signedIn() ? 'Add your child in My Children' : L('Create a parent account', '/account/create')} and verify your email.\n2. Add your child’s details.\n3. Find a Course, choose Group or One-to-one, and request a place.\n4. Once accepted, pay the first invoice and the place is confirmed.` },
    { k: ['password', 'forgot', 'login', 'log', 'locked', 'reset'], a: () => `On the ${L('Sign In', '/account/sign-in')} page choose “Forgot password?” and follow the emailed link. If that does not work, contact us and we can reset it for you.` },
    { k: ['child', 'children', 'second', 'another', 'sibling'], a: () => `Yes, one parent account can have several children. Go to My Children > Add Child; your contact details are reused. You can switch between children at any time.` },
    { k: ['timetable', 'schedule', 'join', 'link', 'zoom', 'meeting', 'online', 'live'], a: () => `Classes are live online. Your child joins from ${isParent() ? L('Timetable', '/my-mea/timetable') : 'the Timetable in My MEA'} at lesson time.` },
    { k: ['homework', 'resources', 'worksheet', 'materials', 'learning'], a: () => `Homework and resources are in the Learning Hub in My MEA, organised by course and week.` },
    { k: ['miss', 'missed', 'absent', 'absence', 'ill', 'sick', 'catch'], a: () => `If your child misses a lesson, the resources and homework stay in the Learning Hub. Message the team through Help & Support if you would like advice on catching up.` },
    { k: ['cancel', 'withdraw', 'stop', 'leave', 'quit', 'refund', 'change', 'move', 'switch'], a: () => `To cancel, change class or ask about a refund, please contact the team through ${isParent() ? L('Support', '/my-mea/support') : L('Contact', '/contact')} so we can look at your account.` },
    { k: ['level', 'levels', 'year', 'gcse', 'a-level', 'alevel', 'ks3', 'ks2', 'ks1', 'scotland', 'scottish', 'national', 'higher', 'btec', 'subject', 'subjects', 'maths', 'english', 'science', 'board', 'aqa', 'edexcel', 'ocr', 'sqa'], a: () => `We teach Primary, KS3, GCSE and A-Level (England, Wales, NI) and Primary, S1–S3, National 5, Higher and Advanced Higher (Scotland), with the exam board shown on each course. See what is running in ${L('the Course Finder', '/courses')}.` },
    { k: ['safe', 'safeguarding', 'worried', 'concern', 'bullying', 'abuse', 'unsafe'], a: () => `If you are worried about a child, please contact the MEA team straight away using ${L('Contact', '/contact')}. If a child is in immediate danger, call 999.` },
    { k: ['hours', 'open', 'phone', 'call', 'email', 'contact', 'whatsapp', 'speak', 'person', 'human', 'someone', 'admin', 'talk', 'help'], a: () => `You can reach the team on ${SITE.phone || 'the Contact page'}${SITE.hours ? ' (' + SITE.hours + ')' : ''} or via ${L('Contact', '/contact')}.${SITE.whatsapp ? ' WhatsApp is also available using the button below.' : ''}` },
    { k: ['hello', 'hi', 'hey', 'salam', 'assalamu', 'morning', 'afternoon'], a: () => `Hello! How can I help? You can ask about paying, enrolling, trial lessons, one-to-one or group classes.` },
    { k: ['thanks', 'thank', 'cheers'], a: () => `You’re welcome! Anything else I can help with?` }
  ];
  const STOP = new Set('the a an is are to do i how can what my me of for and in on it we you your with about does this that there be will would get'.split(' '));
  const toks = s => String(s).toLowerCase().replace(/[^a-z0-9:\- ]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w));
  function localAnswer(q) {
    const t = toks(q), set = new Set(t);
    let best = null, bs = 0;
    for (const it of INTENTS) { const s = it.k.reduce((a, w) => a + (set.has(w) ? 1 : 0), 0); if (s > bs) { bs = s; best = it; } }
    // Fall back to the best-matching published FAQ.
    let faq = null, fs = 0;
    try { (S.faqs || []).forEach(f => { const ft = new Set(toks(f.q + ' ' + f.a)); const s = t.reduce((a, w) => a + (ft.has(w) ? 1 : 0), 0) / (1 + Math.log(1 + ft.size) / 3); if (s > fs) { fs = s; faq = f; } }); } catch (e) { }
    if (best && bs >= 1) return best.a();
    if (faq && fs >= 2) return `${faq.a}`;
    return `I’m not sure about that one. The quickest way is to ask the team: ${L('Contact us', '/contact')}${SITE.phone ? ' or call ' + SITE.phone : ''}.`;
  }

  /* ---- widget ---- */
  const KEY = 'mea.chat.v1';
  let msgs = [], open = false, busy = false, root;
  try { msgs = JSON.parse(sessionStorage.getItem(KEY) || '[]').slice(-30); } catch (e) { }
  const persist = () => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-30))); } catch (e) { } };

  function fmt(t) {
    return esc(t).replace(/\[([^\]]+)\]\((#\/[^)\s]*)\)/g, (m, a, href) => `<a href="${href}" data-chat-link>${a}</a>`).replace(/\n/g, '<br>');
  }
  const waHref = () => SITE.whatsapp ? `https://wa.me/${String(SITE.whatsapp).replace(/\D/g, '')}` : '';
  const chips = () => ['How do I pay?', 'Is there a free trial?', 'One-to-one lessons', 'How do I enrol?'];

  function draw() {
    const log = root.querySelector('.cb-log');
    log.innerHTML = (msgs.length ? '' : `<div class="cb-m bot">Hi! I’m the MEA assistant. Ask me about paying, enrolling, trial lessons or classes.</div><div class="cb-chips">${chips().map(c => `<button type="button" data-cb-q="${esc(c)}">${esc(c)}</button>`).join('')}</div>`)
      + msgs.map(m => `<div class="cb-m ${m.role === 'user' ? 'me' : 'bot'}">${fmt(m.content)}</div>`).join('')
      + (busy ? '<div class="cb-m bot cb-typing" aria-label="Typing"><i></i><i></i><i></i></div>' : '');
    log.scrollTop = log.scrollHeight;
    root.querySelector('.cb-panel').hidden = !open;
    root.querySelector('.cb-fab').setAttribute('aria-expanded', open);
    root.querySelector('.cb-fab').classList.toggle('on', open);
    root.querySelector('.cb-send').disabled = busy;
    const wa = root.querySelector('.cb-wa'); wa.hidden = !waHref(); wa.href = waHref() || '#';
  }

  async function ask(text) {
    text = String(text || '').trim().slice(0, 500); if (!text || busy) return;
    msgs.push({ role: 'user', content: text }); busy = true; persist(); draw();
    let reply = null;
    if (typeof LIVE_BACKEND === 'undefined' || LIVE_BACKEND) {
      try {
        const r = await api('chat', { method: 'POST', body: { messages: msgs.slice(-8) } });
        if (r.ok && r.data && r.data.reply) reply = r.data.reply;
        else if (r.data && r.status === 429) reply = r.data.error;
      } catch (e) { }
    }
    if (!reply) reply = localAnswer(text);
    msgs.push({ role: 'assistant', content: reply }); busy = false; persist(); draw();
  }

  function visible() { const hsh = location.hash || '#/'; return !/^#\/(admin|teacher)(\/|$)/.test(hsh); }
  function sync() { if (!root) return; root.hidden = !visible(); }

  function mount() {
    root = document.createElement('div'); root.className = 'cb'; root.hidden = !visible();
    root.innerHTML = `<div class="cb-panel" role="dialog" aria-label="MEA help assistant" hidden>
      <div class="cb-head"><div><strong>MEA assistant</strong><small>Automated answers · usually instant</small></div><button type="button" class="cb-x" aria-label="Close chat">×</button></div>
      <div class="cb-log" aria-live="polite"></div>
      <form class="cb-form" autocomplete="off"><input class="cb-in" type="text" maxlength="500" placeholder="Type your question…" aria-label="Your question"><button class="cb-send" type="submit">Send</button></form>
      <div class="cb-foot"><a href="#/contact" data-chat-link>Talk to a person</a><a class="cb-wa" target="_blank" rel="noopener" hidden>WhatsApp us</a><button type="button" class="cb-clear">Clear chat</button></div></div>
      <button type="button" class="cb-fab" aria-expanded="false" aria-label="Open help chat"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>Help</span></button>`;
    document.body.appendChild(root);
    root.addEventListener('click', e => {
      const q = e.target.closest('[data-cb-q]'); if (q) { ask(q.dataset.cbQ); return; }
      if (e.target.closest('.cb-fab')) { open = !open; draw(); if (open) setTimeout(() => root.querySelector('.cb-in').focus(), 30); return; }
      if (e.target.closest('.cb-x')) { open = false; draw(); root.querySelector('.cb-fab').focus(); return; }
      if (e.target.closest('.cb-clear')) { msgs = []; persist(); draw(); return; }
      if (e.target.closest('[data-chat-link]') && window.innerWidth < 700) { open = false; draw(); }
    });
    root.querySelector('.cb-form').addEventListener('submit', e => { e.preventDefault(); const i = root.querySelector('.cb-in'); const v = i.value; i.value = ''; ask(v); });
    root.addEventListener('keydown', e => { if (e.key === 'Escape' && open) { open = false; draw(); root.querySelector('.cb-fab').focus(); } });
    window.addEventListener('hashchange', sync); setInterval(sync, 400); // some in-app redirects change the route without a hashchange event
    draw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
