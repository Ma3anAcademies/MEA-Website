import { getNamedStore } from "./store.mjs";

const store = () => getNamedStore("settings");
const KEY = "pricing";

/** Server-side pricing + discount settings, so what admin sets is what every
    parent sees and what invoices are actually costed from (previously these
    lived only in the admin's own browser). levelPrices is keyed by level id
    (ks1, gcse, alevel, n5 ...) -> { group, one2one } in GBP per lesson. */
export async function getPricing() {
  const rec = await store().get(KEY, { type: "json" }).catch(() => null);
  return rec || { levelPrices: {}, multiCourseLessons: null, multiCourseDiscount: null, siblingDiscount: null };
}

const num = (v, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null; };

export async function savePricing(body) {
  const cur = await getPricing();
  const levelPrices = { ...cur.levelPrices };
  for (const [lv, p] of Object.entries(body.levelPrices || {})) {
    if (!/^[a-z0-9]{1,20}$/.test(lv) || !p) continue;
    const group = num(p.group, 0, 1000), one2one = num(p.one2one, 0, 1000);
    levelPrices[lv] = { group: group ?? levelPrices[lv]?.group ?? 0, one2one: one2one ?? levelPrices[lv]?.one2one ?? 0 };
  }
  const next = {
    levelPrices,
    multiCourseLessons: body.multiCourseLessons !== undefined ? num(body.multiCourseLessons, 0, 500) : cur.multiCourseLessons,
    multiCourseDiscount: body.multiCourseDiscount !== undefined ? num(body.multiCourseDiscount, 0, 100) : cur.multiCourseDiscount,
    siblingDiscount: body.siblingDiscount !== undefined ? num(body.siblingDiscount, 0, 100) : cur.siblingDiscount,
    updatedAt: Date.now(),
  };
  await store().setJSON(KEY, next);
  return next;
}
