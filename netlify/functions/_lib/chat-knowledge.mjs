import faq from "./chat-faq.json" with { type: "json" };
import { getPricing } from "./pricing-settings.mjs";

const LEVELS = {
  ks1: "KS1", ks2: "KS2", ks3: "KS3", gcse: "GCSE", alevel: "A-Level", btec: "BTEC",
  sprimary: "Scottish Primary", s1s3: "S1–S3", n5: "National 5", higher: "Higher", adv: "Advanced Higher",
};

const CORE = `ABOUT
Ma3an Education Academies (MEA) is a UK online tuition provider. All lessons are live and online, taught by qualified teachers, aligned to the UK curriculum. Levels: KS1, KS2, KS3, GCSE, A-Level and BTEC (England, Wales, Northern Ireland) and Primary, S1–S3, National 5, Higher and Advanced Higher (Scotland). Exam boards such as AQA, Edexcel, OCR and SQA are shown on each course.

TWO WAYS TO LEARN
Group sessions: small live classes at fixed weekly times. A parent picks the subject, chooses "Group sessions", and sees every current time slot for that course.
One-to-one lessons: a tutor just for the child. The parent picks the subject, chooses "One-to-one", and ticks every time they are free (Monday to Friday and Sunday, 5pm to 10pm; no Saturdays). MEA then arranges a teacher and a weekly time from those slots, and sends a first-payment invoice.
Both are reached from My MEA > Find a Course, or by pressing Enrol on any course.

SIGNING UP AND ENROLLING
1. Create a parent account (Create Parent Account) and verify the email.
2. Add each child (My MEA > My Children > Add Child) with their school year.
3. Find a Course, choose Group or One-to-one, and request enrolment. For group classes MEA confirms the request.
4. Once accepted, MEA sends a first-payment invoice. The child's place is held ("Awaiting Payment") and becomes active as soon as that invoice is paid. Lessons start after payment.
If a class is full the Enrol button becomes Join Waitlist and the family is told if a place opens.
One parent account can manage several children.

PAYING
Go to My MEA > Payments. Invoices are listed there; open one to see the breakdown and pay. Card payments are processed securely by Stripe where online payment is switched on. Payment by bank transfer can be arranged by contacting MEA, and MEA marks the invoice as paid once received. Fees can be billed monthly, termly, or as a custom block of lessons chosen at enrolment. Payment is due before lessons begin.

DISCOUNTS
A sibling discount and a multi-course discount may apply; the current percentages are given below if they are set. They are applied automatically when enrolling.

TRIAL LESSONS
Some courses offer a trial class. These show a "Trial class available" label, and the Course Finder has a Trial lessons filter. If a course shows no label the family can ask the team.

TIMETABLE, CLASSES AND HOMEWORK
My MEA > Timetable shows each child's lessons; the family joins live from there. Homework and resources are in My MEA > Learning Hub, organised by course and week. Missed lessons: resources stay in the Learning Hub and the family can message the team for catch-up advice.

ACCOUNT HELP
Forgotten password: use "Forgot password?" on the Sign In page and follow the emailed link. If that does not work, contact MEA, who can reset it.
Withdrawing or changing class: contact the team via Help & Support in My MEA.

PAGES YOU CAN LINK TO (use exactly this form: [text](#/path))
Courses: #/courses  | Create account: #/account/create | Sign in: #/account/sign-in | Contact: #/contact | FAQs: #/faqs
For signed-in parents: Find a Course #/my-mea/courses/find | My Courses #/my-mea/courses | Payments #/my-mea/payments | Timetable #/my-mea/timetable | Support #/my-mea/support`;

export async function buildKnowledge({ signedIn, role }) {
  let out = CORE + "\n\nFAQ\n" + faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
  if (signedIn) {
    const p = await getPricing().catch(() => null);
    const lp = (p && p.levelPrices) || {};
    const lines = Object.entries(lp).filter(([id]) => LEVELS[id]).map(([id, v]) => `${LEVELS[id]}: group £${v.group} per lesson, one-to-one £${v.one2one} per lesson`);
    out += "\n\nPRICES (the user is signed in, so they may be told these)\n" + (lines.length ? lines.join("\n") : "Prices are shown on each course page.");
    if (p && p.siblingDiscount) out += `\nSibling discount: ${p.siblingDiscount}%.`;
    if (p && p.multiCourseDiscount && p.multiCourseLessons) out += `\nMulti-course discount: ${p.multiCourseDiscount}% once a selection reaches ${p.multiCourseLessons} lessons.`;
    out += `\nThe user is signed in as a ${role}.`;
  } else {
    out += "\n\nPRICES\nThe user is NOT signed in. Do not state any prices, fees or discounts. Say prices are visible after creating a free account or signing in.";
  }
  return out;
}
