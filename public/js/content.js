'use strict';
/* =====================================================================
   MEA – editorial content (public guides, FAQs, stories, testimonials)
   Sample content: all of this is editable in Admin → Content in the live build.
   ===================================================================== */
const GUIDE_CATS = [
  { id: 'uk', name: 'Understanding the UK education system', icon: 'globe', color: 'blue', blurb: 'Clear guides to stages, qualifications and progression.' },
  { id: 'eng', name: 'England / Wales / NI', icon: 'graduation-cap', color: 'pink', blurb: 'Key Stages, GCSEs, A-Levels and subject choices.' },
  { id: 'sco', name: 'Scotland', icon: 'book-open', color: 'yellow', blurb: 'Primary, S1–S3, National 5, Higher and Advanced Higher.' },
  { id: 'exams', name: 'Exam preparation', icon: 'clipboard-list', color: 'green', blurb: 'Revision planning, study habits and supporting children during exams.' },
  { id: 'subjects', name: 'Subject choices', icon: 'target', color: 'purple', blurb: 'Guidance on choosing GCSE / National 5 / post-16 subjects.' },
  { id: 'post16', name: 'University pathways', icon: 'trending-up', color: 'navy', blurb: 'High-level information about progression after school.' }
];

const GUIDES = [
  {
    slug: 'uk-education-system-overview', cat: 'uk', type: 'Guide', title: 'The UK education system at a glance', mins: 4,
    summary: 'Education is organised differently in England, Wales, Northern Ireland and Scotland. Here is how the stages fit together.',
    body: `<p>Education is a devolved matter in the UK, so each nation sets its own curriculum and qualifications. For families moving between areas, or supporting a child from home, it helps to know which route your child is on.</p>
<h2>England, Wales and Northern Ireland</h2>
<p>Children progress through Key Stages, sit GCSEs at around age 16 and can then study A-Levels or other post-16 qualifications. Wales and Northern Ireland have their own curriculum bodies and some different qualifications and grading, so it is always worth checking with your child’s school.</p>
<h2>Scotland</h2>
<p>Scottish pupils follow the Curriculum for Excellence. After a broad general education (Primary to S3) they move into National 5 (S4), Higher (S5) and, if they choose, Advanced Higher (S6). These are awarded by the SQA.</p>
<h2>Why MEA keeps the routes separate</h2>
<p>The two systems use different names for similar stages, so MEA asks you to choose your education system first. That way you only see levels and classes that match your child.</p>`
  },
  {
    slug: 'key-stages-gcse-a-level', cat: 'eng', type: 'Guide', title: 'Key Stages, GCSEs and A-Levels explained', mins: 4,
    summary: 'A simple map from Year 1 to Year 13 for families in England, Wales and Northern Ireland.',
    body: `<h2>The stages</h2>
<ul><li><strong>KS1:</strong> Years 1–2 (ages 5–7)</li><li><strong>KS2:</strong> Years 3–6 (ages 7–11)</li><li><strong>KS3:</strong> Years 7–9 (ages 11–14)</li><li><strong>GCSE / KS4:</strong> Years 10–11 (ages 14–16)</li><li><strong>A-Level / Post-16:</strong> Years 12–13 (ages 16–18)</li></ul>
<h2>What changes at GCSE?</h2>
<p>GCSE courses are two-year programmes. Most are assessed mainly by final exams, so regular practice with past papers matters. Exam boards such as AQA, Edexcel and OCR publish their own specifications, which is why MEA shows the exam board on each GCSE and A-Level class.</p>
<h2>What changes at A-Level?</h2>
<p>Students usually study three subjects in depth over two years. The step up from GCSE is significant, so many students benefit from extra structured support early in Year 12.</p>`
  },
  {
    slug: 'gcse-grades-explained', cat: 'eng', type: 'Guide', title: 'How GCSE grades work', mins: 3,
    summary: 'What the 9–1 scale means, and what counts as a “pass”.',
    body: `<p>In England, GCSEs are graded from 9 (highest) to 1. Grade 4 is generally described as a standard pass and grade 5 as a strong pass. Wales and Northern Ireland use letter grades (A*–G) for many GCSEs, so check the scale used by your child’s school.</p>
<h2>Helpful things to know</h2>
<ul><li>Grade boundaries change every year, depending on how a cohort performs.</li><li>Maths and English Language matter for many next steps, so students who miss a grade 4 may resit them post-16.</li><li>Some subjects have tiers (Foundation and Higher). Your child’s teacher can advise which tier is right.</li></ul>
<p>If you are unsure how your child is progressing, ask their teacher for recent assessment marks and areas to improve.</p>`
  },
  {
    slug: 'scotland-national-5-higher-explained', cat: 'sco', type: 'Guide', title: 'National 5, Higher and Advanced Higher explained', mins: 4,
    summary: 'A parent-friendly guide to Scottish qualifications from S4 to S6.',
    body: `<h2>The pathway</h2>
<ul><li><strong>S1–S3:</strong> broad general education across many subjects.</li><li><strong>S4:</strong> National 5 qualifications.</li><li><strong>S5:</strong> Highers, often four or five subjects.</li><li><strong>S6:</strong> Advanced Highers or additional Highers.</li></ul>
<h2>How they are assessed</h2>
<p>National 5, Higher and Advanced Higher are awarded by the SQA. Most courses combine coursework or assignments with a final exam. Results are reported as grades A to D, with a “no award” if the pass mark is not reached.</p>
<h2>Supporting your child</h2>
<p>Ask the school for the course specification and assessment dates, then plan revision around coursework deadlines as well as exams.</p>`
  },
  {
    slug: 'a-levels-vs-highers', cat: 'post16', type: 'Guide', title: 'A-Levels or Highers: what is the difference?', mins: 3,
    summary: 'Understand the key differences and how each route leads to university.',
    body: `<p>Both A-Levels and Highers are accepted for university entry, but they are structured differently.</p>
<ul><li><strong>Number of subjects:</strong> A-Level students usually take three subjects; Higher students commonly take four or five.</li><li><strong>Timing:</strong> A-Levels are typically studied over two years; Highers over one year, with Advanced Highers in the following year.</li><li><strong>Grades:</strong> A-Levels are graded A*–E; Highers and Advanced Highers A–D.</li></ul>
<p>Entry requirements vary by university and course. Always check each university’s published requirements, particularly if your child is applying across the UK.</p>`
  },
  {
    slug: 'supporting-your-child-through-exams', cat: 'exams', type: 'Guide', title: 'Helping your child succeed in exams', mins: 5,
    summary: 'Practical advice on planning, motivation and wellbeing through the exam season.',
    body: `<h2>Build a realistic routine</h2>
<p>Short, regular study sessions beat last-minute cramming. Agree a weekly plan together and include breaks, meals, sleep and time to relax.</p>
<h2>Practise like the real thing</h2>
<ul><li>Use past papers under timed conditions once the topics have been revised.</li><li>Mark the paper together and note which topics lost the most marks.</li><li>Focus the next revision session on those topics.</li></ul>
<h2>Look after wellbeing</h2>
<p>Exam stress is normal, but it should not take over. Notice changes in sleep, appetite or mood, keep the conversation open and talk to the school if you are worried.</p>
<h2>On exam day</h2>
<p>Plan travel and equipment the night before, keep the morning calm and celebrate effort rather than only results.</p>`
  },
  {
    slug: 'exam-preparation-checklist', cat: 'exams', type: 'Checklist', title: 'Exam preparation checklist', mins: 2,
    summary: 'A quick checklist to work through together in the weeks before exams.',
    body: `<ul><li>Confirm the exam board and paper dates for every subject.</li><li>Create a weekly revision timetable with rest days.</li><li>Gather past papers and mark schemes for each subject.</li><li>List topics your child feels least confident about and start there.</li><li>Agree a quiet study space and a device-free hour each evening.</li><li>Check equipment: calculator, pens, ruler, ID if required.</li><li>Plan the last week: lighter revision, early nights, healthy meals.</li></ul>`
  },
  {
    slug: 'choosing-gcse-national-5-subjects', cat: 'subjects', type: 'Guide', title: 'Choosing GCSE and National 5 subjects', mins: 4,
    summary: 'Tips to help your child choose subjects that suit their strengths and future goals.',
    body: `<h2>Start with your child</h2>
<p>Students do best in subjects they enjoy and feel capable in. Ask which lessons they look forward to, and which they find most rewarding.</p>
<h2>Keep doors open</h2>
<ul><li>Check whether future courses or careers need particular subjects, such as sciences for medicine.</li><li>Aim for a balanced mix of subjects where possible.</li><li>Speak to subject teachers about workload and assessment style.</li></ul>
<h2>Do not choose for the wrong reasons</h2>
<p>Friends, a favourite teacher or perceived “easy” subjects are not reliable reasons. Encourage your child to think about what they want to keep learning.</p>`
  },
  {
    slug: 'post-16-and-university-pathways', cat: 'post16', type: 'Guide', title: 'After school: post-16 and university pathways', mins: 4,
    summary: 'A high-level look at the options available once GCSEs or National 5s are complete.',
    body: `<p>There is more than one route to a successful future. Common options include:</p>
<ul><li><strong>Sixth form or college:</strong> A-Levels, Highers, or vocational qualifications.</li><li><strong>Apprenticeships:</strong> paid work combined with training.</li><li><strong>University:</strong> applications are made through UCAS, usually in the autumn of the final school year.</li></ul>
<p>Start conversations early, attend open days together and use official sources for entry requirements and deadlines.</p>`
  },
  {
    slug: 'choosing-the-right-level', cat: 'uk', type: 'Guide', title: 'Not sure which level is right?', mins: 2,
    summary: 'A short guide to choosing the right stage for your child.',
    body: `<ol><li><strong>Choose your education system.</strong> England, Wales and Northern Ireland use Years and Key Stages; Scotland uses P1–P7 and S1–S6.</li><li><strong>Use your child’s current school year.</strong> The Course Finder matches classes to that year.</li><li><strong>Check the exam board.</strong> For GCSE and A-Level classes, ask your child’s school which board they follow so that lessons match their exams.</li><li><strong>Still unsure?</strong> Contact the MEA team and tell us your child’s year and subject. We will suggest a suitable class.</li></ol>
<p>When you enrol, MEA will warn you if a child’s recorded stage does not match the class you have selected.</p>`
  }
];
const OFFICIAL_LINKS = [
  { title: 'National curriculum in England (GOV.UK)', url: 'https://www.gov.uk/national-curriculum', cat: 'eng' },
  { title: 'SQA – Scottish Qualifications Authority', url: 'https://www.sqa.org.uk', cat: 'sco' },
  { title: 'Education Scotland', url: 'https://education.gov.scot', cat: 'sco' },
  { title: 'UCAS – applying to university', url: 'https://www.ucas.com', cat: 'post16' },
  { title: 'Qualifications Wales', url: 'https://www.qualificationswales.org', cat: 'eng' }
];

const FAQ_CATS = ['About MEA', 'Courses & levels', 'England / Scotland routes', 'Registration & accounts', 'Adding children', 'Timetables', 'Fees & payments', 'Lessons & homework', 'Technical access', 'Absence & missed classes', 'Contact & support'];
const FAQ_SEED = [
  ['About MEA', 'What is MEA?', 'Ma3an Education Academies (MEA) is an online tuition and academic support provider for students across the UK. Live classes are taught by qualified, experienced teachers and are aligned to the UK curriculum. “Ma3an” means “Together”.'],
  ['Courses & levels', 'Which year groups and levels does MEA teach?', 'MEA supports Primary, KS3, GCSE and A-Level in England, Wales and Northern Ireland, and Primary, S1–S3, National 5, Higher and Advanced Higher in Scotland. Use the Course Finder to see what is currently running.'],
  ['Courses & levels', 'Does MEA support different exam boards?', 'Yes. GCSE and A-Level classes show their exam board (for example AQA, Edexcel or OCR) and Scottish courses follow SQA. The exam board is shown on every course card and course page.'],
  ['Courses & levels', 'How do I know which class is right for my child?', 'Choose your education system, then your child’s school year and subject in the Course Finder. If you are unsure, read our level guide or contact us and we will recommend a class.'],
  ['Courses & levels', 'Do you offer one-to-one tutoring?', 'One-to-one support is available for selected subjects. Please contact us with your child’s year, subject and goals and we will confirm availability and fees.'],
  ['Courses & levels', 'What happens when a class is full?', 'When a class reaches capacity, the Enrol button changes to Join Waitlist. We will notify you if a place becomes available.'],
  ['England / Scotland routes', 'What is the difference between GCSEs and National 5s?', 'GCSEs are taken in England, Wales and Northern Ireland at around age 16. National 5s are the equivalent stage in Scotland, usually taken in S4 and awarded by the SQA. Read our guides in Resources for more detail.'],
  ['Registration & accounts', 'How do I register my child at MEA?', 'Create a parent account, verify your email, then add your child’s details and choose a class. You will be shown a confirmation summary before you submit an enrolment request.'],
  ['Registration & accounts', 'Is there a free trial available?', 'Some courses offer an introductory session. Look for the “Trial class available” label on the course page. If it is not shown, please contact us to ask.'],
  ['Adding children', 'Can I add more than one child to my account?', 'Yes. One parent account can manage several children. Each child has their own profile, courses and timetable, and you can switch between them at any time.'],
  ['Adding children', 'How do I enrol a second child?', 'Sign in to My MEA, go to My Children and choose Add Child. Your contact details are reused, so you only enter the child’s information.'],
  ['Timetables', 'Can I change my child’s class or timetable?', 'Please contact support from your My MEA account and tell us which class you would like to move to. We will confirm whether a place is available.'],
  ['Timetables', 'How will I be told if a class time changes?', 'Timetable changes are updated centrally in My MEA and you will receive an in-app notification and an email.'],
  ['Fees & payments', 'How are fees charged?', 'Fees are shown on each course page. Payment timing and the cancellation summary are explained there, with a link to the full terms.'],
  ['Lessons & homework', 'Where can I find homework and lesson resources?', 'Sign in to My MEA, choose your child and open the Learning Hub. Resources and homework are organised by course and week, so you never need to search through folders.'],
  ['Lessons & homework', 'How are classes delivered?', 'Classes are delivered live online. Students join from the timetable in My MEA and take part in real time with their teacher.'],
  ['Technical access', 'How do I reset my password?', 'Choose “Forgot password?” on the Sign In page, enter your email and follow the link we send you.'],
  ['Absence & missed classes', 'What happens if my child misses a lesson?', 'Lesson resources and homework stay available in the Learning Hub. Please message the team through My MEA if you would like advice on catching up.'],
  ['Contact & support', 'Who can I speak to if I am worried about my child?', 'Please contact the MEA team straight away using the Contact page or Help & Support in My MEA. You can also read our safeguarding information from the footer of any page.']
];

const TESTIMONIALS = [
  { q: 'MEA has been a game changer for my daughter. Her confidence in Maths has grown so much and the lessons are engaging.', by: 'Sarah', role: 'Parent', place: 'Birmingham' },
  { q: 'My tutor explains everything so clearly. Lessons are engaging and I actually enjoy learning now.', by: 'Ayaan', role: 'Year 11 student', place: 'Manchester' },
  { q: 'Excellent support, regular updates and amazing tutors. We saw real progress. Highly recommended!', by: 'Mr. Ahmed', role: 'Parent', place: 'London' }
];
const STORIES = [
  {
    slug: 'zayd-gcse-maths', name: 'Zayd', img: 'zayd', title: 'From Grade 4 to Grade 9 in GCSE Maths', sys: 'eng', level: 'gcse', subject: 'maths', board: 'Edexcel', courseKey: 'gcse-maths-edexcel',
    summary: 'Zayd improved his confidence and achieved a Grade 9 with consistent support and expert tutoring.',
    challenge: 'Zayd started Year 10 with a Grade 4 in recent assessments and felt anxious about algebra.',
    support: 'Weekly live classes, targeted homework and regular feedback helped him build fluency step by step.',
    outcome: 'Zayd achieved a Grade 9 in GCSE Mathematics.', quote: 'I stopped being afraid of maths once I understood the method behind it.'
  },
  {
    slug: 'amira-national-5-english', name: 'Amira', img: 'amira', title: 'Top in her class in National 5 English', sys: 'sco', level: 'n5', subject: 'english', board: 'SQA', courseKey: 'n5-english-sqa',
    summary: 'Amira’s dedication and personalised lessons helped her achieve an A and finish top of her class.',
    challenge: 'Amira wanted to strengthen her critical essay writing before her National 5 exam.',
    support: 'Personalised feedback on essays and regular timed practice built her confidence.',
    outcome: 'Amira achieved an A in National 5 English and was top of her class.', quote: 'Getting detailed feedback on each essay made all the difference.'
  },
  {
    slug: 'hassan-a-level-physics', name: 'Hassan', img: 'hassan', title: 'A* in A-Level Physics', sys: 'eng', level: 'alevel', subject: 'physics', board: 'OCR', courseKey: 'alevel-physics-ocr',
    summary: 'Hassan achieved an A* through focused lessons, past paper practice and expert guidance.',
    challenge: 'Hassan found the jump from GCSE to A-Level Physics demanding, especially the maths.',
    support: 'Structured lessons, past paper practice and exam-technique coaching kept him on track.',
    outcome: 'Hassan achieved an A* in A-Level Physics.', quote: 'Practising past papers with feedback helped me understand what examiners want.'
  }
];
