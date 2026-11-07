import faq from "./chat-faq.json" with { type: "json" };
import { getPricing } from "./pricing-settings.mjs";

const LEVELS = {
  ks1: "KS1", ks2: "KS2", ks3: "KS3", gcse: "GCSE", alevel: "A-Level", btec: "BTEC",
  sprimary: "Scottish Primary", s1s3: "S1–S3", n5: "National 5", higher: "Higher", adv: "Advanced Higher",
};

const CORE = `ABOUT MEA
Ma3an Education Academies (MEA) is a UK online tuition and academic support provider ("Ma3an" means "Together"). Every lesson is live and online, taught by qualified, experienced teachers and aligned to the UK curriculum. There is no travel: students join from a device at home. Lessons are in UK time.
Levels: KS1, KS2, KS3, GCSE, A-Level and BTEC (England, Wales, Northern Ireland) and Primary, S1–S3, National 5, Higher and Advanced Higher (Scotland, SQA). Exam boards such as AQA, Edexcel, OCR and SQA are shown on each course.
Subjects (where classes are running): Mathematics, English, Science, Biology, Chemistry, Physics, Computing, Arabic, French, Business, History. Not every subject runs at every level; the Course Finder shows what is available now.
Students need a device with a camera and microphone, a stable internet connection, and pen and paper.
Accounts are for PARENTS. A parent account manages all their children. Students do not have their own logins. Teachers have separate accounts.

TWO WAYS TO LEARN
Group sessions: live small-group classes at fixed weekly times. The parent picks a subject, chooses "Group sessions", and sees every current time slot for that course, then requests a place in the one they prefer.
One-to-one lessons: a tutor just for the child. The parent picks the subject, chooses "One-to-one", and ticks every time they are free (Monday to Friday and Sunday, 5pm to 10pm; no Saturdays). The more slots ticked, the easier it is to match a tutor. This is a request, not an instant booking: MEA picks a teacher and a weekly time from the ticked slots, the lesson appears in the timetable, and a first-payment invoice is sent. The parent can see the request on My Courses and cancel it while it is still awaiting arrangement.
Both start from My MEA > Find a Course, or by pressing Enrol on any course. Enrol always asks Group or One-to-one first.

HOW TO SIGN UP AND ENROL (step by step)
1. Create a parent account (Create Parent Account). Enter name, email, UK phone number and a password (at least 8 characters including a number), and accept the Terms and Privacy Policy. Verify the email from the message sent.
2. Add each child: My MEA > My Children > Add Child. Choose the education system (England/Wales/NI or Scotland), the child's school year, and enter their name (date of birth and school are optional).
3. Find a Course: pick the child, pick a subject, choose Group or One-to-one. Group: choose a time slot and request enrolment. Several group courses can be selected together (use Select, then review the selection) and billed together.
4. At enrolment the parent chooses how to pay: monthly, termly, or a custom number of lessons (or lessons until a date).
5. MEA confirms the request. After acceptance MEA sends a first-payment invoice and the place is held ("Awaiting Payment"). When the invoice is paid the place becomes Active and the child can attend. Lessons start after payment.
Statuses on My Courses: Pending Confirmation (waiting for MEA to accept), Waitlisted (class full, will be offered a place if one opens), Awaiting Payment (accepted, seat held, pay the first invoice), Active (attending), Completed, Withdrawn, Declined (could not be accepted; contact support).
If a class is full, Enrol becomes Join Waitlist and the family is notified if a place opens.
Parents can choose which child they are viewing with the child picker at the top of most pages.

MANAGING CHILDREN
Add another child any time (My Children > Add Child); contact details are reused. Edit a child's name, school year (e.g. when they move up a year), date of birth or school from My Children > the child's profile > Edit. The education system (England/Wales/NI or Scotland) can't be changed there; contact the team if it was chosen wrongly.
Parents cannot delete or remove a child profile themselves. To remove a child (for example they have stopped or were added by mistake), send the team a message from Help & Support (Course / enrolment topic) or the Contact page with the child's name and ask for the profile to be removed. Any active classes should be cancelled at the same time (see Cancelling).

PAYING AND FEES
Pay at My MEA > Payments. Invoices are listed with their status (Due or Paid); open one (View Invoice) to see the breakdown and pay. Card payments are processed securely by Stripe when online payment is switched on. Bank transfer or other methods can be arranged by contacting MEA, and MEA marks the invoice as paid when the money arrives. Do not send card details in chat.
Fees are per lesson and depend on the level, and on whether it is group or one-to-one. Prices are visible to signed-in parents on each course and class card. Billing is monthly, termly or a custom block of lessons, chosen at enrolment. Payment is due in advance, before lessons.
A sibling discount and a multi-course discount may apply (the current amounts are given below if they are set). They are applied automatically when enrolling.
If a payment fails or an invoice looks wrong, contact the team through Help & Support (Payments topic) with the invoice number.
Receipts and invoices stay in Payments.

CANCELLING, PAUSING, CHANGING, REFUNDS
Cancelling a request that is still Pending Confirmation, Waitlisted or Awaiting Payment: My MEA > My Courses > open the course > "Cancel this request" (this also releases the held seat).
Cancelling or pausing an active course: the Terms say families may cancel or pause with 7 days' notice. Contact the team through Help & Support so it is processed.
Changing class or time: contact support from My MEA (Timetable / class changes topic) saying which class to move to; the team confirms whether a place is available.
Refunds: the full refund wording is being finalised by MEA, so do not promise a refund. Direct the parent to contact the team with the invoice details.

TRIAL LESSONS
Some courses offer a trial class. They show a "Trial class available" label, and Find a Course has a Trial lessons filter. If a course does not show the label, the family can ask the team.

TIMETABLE, JOINING CLASSES, HOMEWORK, PROGRESS
Timetable: My MEA > Timetable shows each child's lessons by week (switch child and week). Open a lesson and use Join class to enter the live lesson. Join from a laptop, tablet or computer with camera and microphone. If a join link is not shown yet, check again closer to lesson time or contact the team.
Learning Hub: My MEA > Learning Hub has lesson resources, homework and class announcements, organised by course and week.
Homework: My MEA > Homework lists homework for each child (To do, Due soon, Overdue, Submitted). Open an item to read it and submit work.
Progress: My MEA > Progress shows attendance, homework completed, assessment scores, upcoming assessments and teacher feedback for each child and course.
Missed a lesson: resources and homework stay in the Learning Hub; message the team or teacher for catch-up advice.
Timetable changes are updated in My MEA and families get a notification and an email.

MESSAGES, NOTIFICATIONS, ACCOUNT
Messages: My MEA > Messages. Parents can message the MEA team and their child's assigned teachers. There is no private messaging between teachers and students, for safeguarding.
Notifications: My MEA > Notifications lists updates (enrolment decisions, invoices, timetable changes, announcements).
Account Settings (My MEA > Settings) has four tabs: Profile (name, phone, WhatsApp), Security (change password), Notifications (email, messages, class and homework reminders, announcements), Privacy & consent (marketing emails on or off).
Changing the email address on an account: contact the team.
Forgot password: on the Sign In page choose "Forgot password?", enter the email, and follow the emailed link. If that fails, contact MEA and an admin can reset it.
Email not verified: use the verification link from the sign-up email, or contact the team.
Data and privacy: parents can ask for access to, correction of, or deletion of their data via Help & Support (Data & privacy topic). Parents only see their own children's information; teachers only see the classes they teach.

SAFEGUARDING AND SAFETY
MEA is committed to keeping children safe. Teacher communication with families happens through approved MEA channels. Teacher phone numbers and personal emails are never shared. Anyone with a concern about a child's wellbeing should contact the MEA team straight away via the Contact page. If a child is in immediate danger, call 999.

CONTACTING MEA
Contact page (#/contact) has an enquiry form, phone and email. Signed-in parents can use My MEA > Help & Support (topics: Course / enrolment, Timetable / class changes, Homework / resources, Payments, Technical / account access, Data & privacy) or Messages. A "Talk to a person" link and a WhatsApp button are in this chat window. Do not invent opening hours or phone numbers; refer to the Contact page.

HELPFUL READING (guides on the site)
The UK education system at a glance; Key Stages, GCSEs and A-Levels explained; How GCSE grades work; National 5, Higher and Advanced Higher explained; A-Levels or Highers; Choosing GCSE and National 5 subjects; Helping your child succeed in exams; Exam preparation checklist; After school: post-16 and university pathways; Not sure which level is right? All are in Resources. Student success stories are on the Student Success page. If a parent is unsure which level suits their child, suggest the "Not sure which level?" guide and that they contact the team.

PAGES YOU CAN LINK TO (use exactly this form: [text](#/path))
Courses: #/courses | Timetables and fees: #/timetables-fees | Create account: #/account/create | Sign in: #/account/sign-in | Contact: #/contact | FAQs: #/faqs | About: #/about | Resources and guides: #/resources | Not sure which level: #/resources/choosing-the-right-level | Student success: #/student-success | Terms: #/terms | Privacy: #/privacy | Safeguarding: #/safeguarding
For signed-in parents: Dashboard #/my-mea | My Children #/my-mea/children | Add child #/my-mea/children/add | Find a Course #/my-mea/courses/find | My Courses #/my-mea/courses | Payments #/my-mea/payments | Timetable #/my-mea/timetable | Learning Hub #/my-mea/learning | Homework #/my-mea/homework | Progress #/my-mea/progress | Messages #/my-mea/messages | Notifications #/my-mea/notifications | Settings #/my-mea/settings | Help and Support #/my-mea/support`;

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
