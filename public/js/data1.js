'use strict';
/* =====================================================================
   MEA – catalogue constants (education systems, subjects, teachers, courses)
   Everything here is SAMPLE CONTENT taken from the design mockups / manual.
   ===================================================================== */
const SYS = {
  eng: {
    id: 'eng', name: 'England / Wales / Northern Ireland', short: 'England, Wales & NI', blurb: 'Primary / Key Stages • GCSE • A-Level',
    boards: ['AQA', 'Edexcel', 'OCR'],
    levels: [
      { id: 'ks1', name: 'KS1', ages: '5–7', years: ['Year 1', 'Year 2'] },
      { id: 'ks2', name: 'KS2', ages: '7–11', years: ['Year 3', 'Year 4', 'Year 5', 'Year 6'] },
      { id: 'ks3', name: 'KS3', ages: '11–14', years: ['Year 7', 'Year 8', 'Year 9'] },
      { id: 'gcse', name: 'GCSE', ages: '14–16', years: ['Year 10', 'Year 11'] },
      { id: 'alevel', name: 'A-Level', ages: '16–18', years: ['Year 12', 'Year 13'] },
      { id: 'btec', name: 'BTEC', ages: '16–19', years: ['BTEC'] }
    ]
  },
  sco: {
    id: 'sco', name: 'Scotland', short: 'Scotland', blurb: 'Primary • S1–S3 • National 5 • Higher • Advanced Higher',
    boards: ['SQA'],
    levels: [
      { id: 'sprimary', name: 'Primary', ages: '5–12', years: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'] },
      { id: 's1s3', name: 'S1–S3', ages: '12–15', years: ['S1', 'S2', 'S3'] },
      { id: 'n5', name: 'National 5', ages: '15–16', years: ['S4'] },
      { id: 'higher', name: 'Higher', ages: '16–17', years: ['S5'] },
      { id: 'adv', name: 'Advanced Higher', ages: '17–18', years: ['S6'] }
    ]
  }
};
const LEVEL_BUCKET = { ks1: 'p', ks2: 'p', sprimary: 'p', ks3: 'l', s1s3: 'l', gcse: 'e', n5: 'e', alevel: 's', higher: 's', adv: 's', btec: 's' };
const SUBJECTS = [
  { id: 'maths', name: 'Mathematics', short: 'Maths', icon: 'calculator', grp: 'blue' },
  { id: 'english', name: 'English', short: 'English', icon: 'book', grp: 'yellow' },
  { id: 'science', name: 'Science', short: 'Science', icon: 'flask', grp: 'pink' },
  { id: 'biology', name: 'Biology', short: 'Biology', icon: 'leaf', grp: 'pink' },
  { id: 'chemistry', name: 'Chemistry', short: 'Chemistry', icon: 'beaker', grp: 'pink' },
  { id: 'physics', name: 'Physics', short: 'Physics', icon: 'atom', grp: 'pink' },
  { id: 'computing', name: 'Computing', short: 'Computing', icon: 'monitor', grp: 'green' },
  { id: 'arabic', name: 'Arabic', short: 'Arabic', icon: 'languages', grp: 'purple' },
  { id: 'french', name: 'French', short: 'French', icon: 'languages', grp: 'purple' },
  { id: 'business', name: 'Business', short: 'Business', icon: 'briefcase', grp: 'navy' },
  { id: 'history', name: 'History', short: 'History', icon: 'landmark', grp: 'navy' }
];
const GRP_LABEL = { blue: 'Mathematics', pink: 'Science', yellow: 'English', green: 'Computing', purple: 'Languages', navy: 'Humanities & Business' };

const TOPICS = {
  maths: {
    p: 'Number & place value|Addition & subtraction strategies|Multiplication & division facts|Fractions, decimals & percentages|Shape, measure & time|Problem solving & reasoning',
    l: 'Number & the four operations|Fractions, decimals & percentages|Ratio & proportion|Algebra: expressions & equations|Geometry & measures|Statistics & probability',
    e: 'Number & fractions|Expanding & factorising|Algebraic fractions|Simultaneous equations & inequalities|Geometry, trigonometry & vectors|Probability & statistics',
    s: 'Algebra & functions|Coordinate geometry|Sequences & series|Differentiation|Integration|Trigonometry & exponentials'
  },
  english: {
    p: 'Phonics & spelling patterns|Reading comprehension|Grammar & punctuation|Story writing|Poetry & performance|Non-fiction writing',
    l: 'Reading for meaning|Descriptive & narrative writing|Grammar for effect|Poetry analysis|Introducing Shakespeare|Writing to argue & persuade',
    e: 'Reading fiction (Paper 1)|Creative writing|Non-fiction viewpoints (Paper 2)|Transactional writing|Set text study|Unseen poetry & exam technique',
    s: 'Critical analysis|Comparative essay writing|Prose study|Poetry study|Drama study|Independent writing project'
  },
  science: {
    p: 'Living things & habitats|Materials & their properties|Forces & magnets|Light & sound|Earth & space|Working scientifically',
    l: 'Cells & organisation|Particles & matter|Forces & motion|Energy & electricity|Chemical reactions|Ecosystems & inheritance'
  },
  biology: {
    e: 'Cell biology|Organisation & digestion|Infection & response|Bioenergetics|Homeostasis & response|Inheritance & evolution',
    s: 'Biological molecules|Cells & transport|Exchange surfaces|Genetics & evolution|Energy transfers|Control systems'
  },
  chemistry: {
    e: 'Atomic structure & the periodic table|Bonding & structure|Quantitative chemistry|Chemical changes|Energy changes & rates|Organic chemistry',
    s: 'Atomic structure|Bonding & periodicity|Amount of substance|Energetics & kinetics|Equilibria|Organic synthesis'
  },
  physics: {
    e: 'Energy|Electricity|Particle model of matter|Atomic structure|Forces & motion|Waves & electromagnetism',
    s: 'Measurements & mechanics|Materials & waves|Electricity|Fields & forces|Thermal physics|Nuclear & particle physics'
  },
  computing: {
    p: 'Algorithms & sequencing|Programming with blocks|Debugging|Online safety|Data & spreadsheets|Creating digital content',
    l: 'Algorithms & flowcharts|Python fundamentals|Data representation|Computer systems|Networks & the internet|Cyber security',
    e: 'Computational thinking|Programming in Python|Data representation|Computer systems & architecture|Networks & security|Databases & SQL',
    s: 'Algorithms & data structures|Object-oriented programming|Computer architecture|Networking & databases|Software development|Programming project'
  },
  arabic: {
    p: 'Arabic alphabet & sounds|Greetings & everyday words|Reading simple words|Handwriting|Numbers, colours & family|Short sentences',
    l: 'Reading & comprehension|Grammar foundations|Conversation practice|Writing paragraphs|Vocabulary building|Listening skills'
  },
  french: {
    l: 'Greetings & personal information|School & daily routine|Family & friends|Free time & hobbies|Town & travel|Past & future tenses',
    e: 'Identity & culture|Local area & travel|School & future plans|Global issues|Listening & reading skills|Speaking & writing exams'
  },
  business: { e: 'Enterprise & entrepreneurship|Business planning|Marketing & the customer|Operations & finance|Human resources|Influences on business' },
  history: { e: 'Thematic study|Historic environment|Period study|Modern depth study|Source analysis|Essay writing & exam technique' }
};

const TEACHERS = [
  { id: 't_hassan', name: 'Mr. Hassan Ali', subjects: 'Mathematics', levels: 'KS1 – GCSE', boards: 'Edexcel', qual: 'BSc Mathematics, PGCE • 9 years teaching', bio: 'Hassan makes maths feel achievable. He breaks topics into clear steps and celebrates every breakthrough.' },
  { id: 't_ibrahim', name: 'Mr. Ibrahim Yusuf', subjects: 'Mathematics', levels: 'GCSE – A-Level', boards: 'AQA, Edexcel', qual: 'MSc Mathematics, QTS • 11 years teaching', bio: 'Ibrahim specialises in exam technique and helps students turn understanding into top marks.' },
  { id: 't_aisha', name: 'Ms. Aisha Rahman', subjects: 'Science, Biology, Chemistry, Physics', levels: 'KS3 – GCSE', boards: 'AQA', qual: 'BSc Biochemistry, PGCE • 8 years teaching', bio: 'Aisha brings science to life with practical examples and encourages students to ask why.' },
  { id: 't_karim', name: 'Dr. Karim Sheikh', subjects: 'Biology, Chemistry, Physics', levels: 'A-Level', boards: 'AQA, OCR', qual: 'PhD Physics, PGCE • 12 years teaching', bio: 'Karim guides sixth-form students through demanding content with calm, structured teaching.' },
  { id: 't_liam', name: 'Mr. Liam Turner', subjects: 'English', levels: 'KS1 – GCSE', boards: 'AQA', qual: 'BA English Literature, PGCE • 10 years teaching', bio: 'Liam helps students find their voice, from first stories to confident essay writing.' },
  { id: 't_omar', name: 'Mr. Omar Farooq', subjects: 'Computing, Computer Science', levels: 'KS2 – A-Level', boards: 'OCR', qual: 'BSc Computer Science, PGCE • 7 years teaching', bio: 'Omar teaches programming through projects so students build real skills and confidence.' },
  { id: 't_sarah', name: 'Ms. Sarah Bennett', subjects: 'French', levels: 'KS3 – GCSE', boards: 'AQA', qual: 'BA Modern Languages, PGCE • 8 years teaching', bio: 'Sarah builds speaking confidence early, with plenty of conversation practice in every lesson.' },
  { id: 't_layla', name: 'Ms. Layla Khan', subjects: 'Arabic', levels: 'KS2 – KS3', boards: '', qual: 'BA Arabic, TEFL • 6 years teaching', bio: 'Layla nurtures a love of Arabic through reading, handwriting and lively conversation.' },
  { id: 't_reid', name: 'Mr. Callum Reid', subjects: 'Mathematics, Physics, Computing', levels: 'Primary – Advanced Higher', boards: 'SQA', qual: 'MPhys, PGDE (Scotland) • 10 years teaching', bio: 'Callum is a specialist in the Scottish curriculum and SQA assessment.' },
  { id: 't_fiona', name: 'Ms. Fiona MacLeod', subjects: 'English, Biology, Chemistry, Science', levels: 'Primary – Higher', boards: 'SQA', qual: 'MA English, PGDE (Scotland) • 13 years teaching', bio: 'Fiona supports learners across Scottish pathways with warm, exam-focused teaching.' },
  { id: 't_priya', name: 'Ms. Priya Nair', subjects: 'Business, History', levels: 'GCSE', boards: 'Edexcel', qual: 'BA History, PGCE • 6 years teaching', bio: 'Priya helps students structure strong arguments and revise smartly for essay-based subjects.' }
];

/* course catalogue: [key, system, level, subject, board, tier, fee/month, sessions[[dow,start,end]], teacher, seats filled, options] */
const CAT_ROWS = [];
function C(k, sys, lv, sub, board, tier, fee, sess, t, fill, o = {}) { CAT_ROWS.push({ k, sys, lv, sub, board, tier, fee, sess, t, fill, cap: 8, ...o }); }
// England / Wales / NI
C('ks1-maths', 'eng', 'ks1', 'maths', '', '', 79, [[6, '09:00', '10:00']], 't_hassan', 4, { trial: 1 });
C('ks1-english', 'eng', 'ks1', 'english', '', '', 79, [[6, '10:15', '11:15']], 't_liam', 3, { trial: 1 });
C('ks2-maths', 'eng', 'ks2', 'maths', '', '', 89, [[1, '16:30', '17:30']], 't_hassan', 5, { trial: 1 });
C('ks2-english', 'eng', 'ks2', 'english', '', '', 89, [[2, '16:30', '17:30']], 't_liam', 6, { trial: 1 });
C('ks2-science', 'eng', 'ks2', 'science', '', '', 89, [[3, '16:30', '17:30']], 't_aisha', 4);
C('ks2-computing', 'eng', 'ks2', 'computing', '', '', 89, [[4, '16:00', '17:00']], 't_omar', 5, { trial: 1 });
C('ks2-arabic', 'eng', 'ks2', 'arabic', '', '', 79, [[6, '11:30', '12:30']], 't_layla', 7);
C('ks3-maths', 'eng', 'ks3', 'maths', '', '', 119, [[1, '17:30', '18:30']], 't_hassan', 6);
C('ks3-english', 'eng', 'ks3', 'english', '', '', 129, [[3, '17:30', '18:30']], 't_liam', 5, { title: 'English Language KS3' });
C('ks3-science', 'eng', 'ks3', 'science', '', '', 119, [[3, '16:30', '17:30']], 't_aisha', 7);
C('ks3-french', 'eng', 'ks3', 'french', '', '', 119, [[5, '17:30', '18:30']], 't_sarah', 3, { late: 1 });
C('ks3-computing', 'eng', 'ks3', 'computing', '', '', 119, [[4, '17:30', '18:30']], 't_omar', 4);
C('ks3-arabic', 'eng', 'ks3', 'arabic', '', '', 109, [[6, '12:45', '13:45']], 't_layla', 2);
C('gcse-maths-edexcel', 'eng', 'gcse', 'maths', 'Edexcel', 'Higher Tier', 199, [[2, '17:00', '18:30'], [4, '17:00', '18:30']], 't_hassan', 6);
C('gcse-maths-aqa', 'eng', 'gcse', 'maths', 'AQA', 'Higher Tier', 199, [[1, '18:30', '20:00'], [3, '18:30', '20:00']], 't_ibrahim', 4);
C('gcse-english-aqa', 'eng', 'gcse', 'english', 'AQA', '', 169, [[3, '18:30', '19:30']], 't_liam', 5, { title: 'GCSE English Language (AQA)' });
C('gcse-literature-aqa', 'eng', 'gcse', 'english', 'AQA', '', 169, [[4, '18:30', '19:30']], 't_liam', 4, { title: 'GCSE English Literature (AQA)' });
C('gcse-biology-aqa', 'eng', 'gcse', 'biology', 'AQA', '', 179, [[1, '18:30', '20:00']], 't_aisha', 5);
C('gcse-chemistry-aqa', 'eng', 'gcse', 'chemistry', 'AQA', '', 179, [[2, '18:30', '20:00']], 't_aisha', 6);
C('gcse-physics-aqa', 'eng', 'gcse', 'physics', 'AQA', '', 179, [[4, '18:30', '20:00']], 't_aisha', 8);
C('gcse-cs-ocr', 'eng', 'gcse', 'computing', 'OCR', '', 169, [[5, '18:00', '19:00']], 't_omar', 3);
C('gcse-french-aqa', 'eng', 'gcse', 'french', 'AQA', '', 149, [[6, '12:00', '13:00']], 't_sarah', 2);
C('gcse-business-edexcel', 'eng', 'gcse', 'business', 'Edexcel', '', 149, [[1, '19:00', '20:00']], 't_priya', 3);
C('gcse-history-edexcel', 'eng', 'gcse', 'history', 'Edexcel', '', 149, [[2, '19:00', '20:00']], 't_priya', 4);
C('alevel-maths-edexcel', 'eng', 'alevel', 'maths', 'Edexcel', '', 229, [[1, '19:00', '20:30']], 't_ibrahim', 4);
C('alevel-biology-aqa', 'eng', 'alevel', 'biology', 'AQA', '', 229, [[4, '19:00', '20:30']], 't_karim', 7);
C('alevel-chemistry-aqa', 'eng', 'alevel', 'chemistry', 'AQA', '', 229, [[3, '19:00', '20:30']], 't_karim', 6);
C('alevel-physics-ocr', 'eng', 'alevel', 'physics', 'OCR', '', 239, [[2, '18:00', '19:30'], [5, '18:00', '19:30']], 't_karim', 5);
C('alevel-cs-ocr', 'eng', 'alevel', 'computing', 'OCR', '', 229, [[1, '18:00', '19:30']], 't_omar', 2);
C('btec-business', 'eng', 'btec', 'business', '', 'Level 3', 219, [[2, '18:00', '19:30']], 't_priya', 3);
C('btec-it', 'eng', 'btec', 'computing', '', 'Level 3', 219, [[4, '18:00', '19:30']], 't_omar', 2);
C('btec-health', 'eng', 'btec', 'science', '', 'Level 3', 219, [[5, '18:00', '19:30']], 't_aisha', 2, { title: 'BTEC Health & Social Care' });
// Scotland
C('sprimary-maths', 'sco', 'sprimary', 'maths', '', '', 89, [[1, '16:30', '17:30']], 't_reid', 4);
C('sprimary-english', 'sco', 'sprimary', 'english', '', '', 89, [[2, '16:30', '17:30']], 't_fiona', 5);
C('s1s3-maths', 'sco', 's1s3', 'maths', '', '', 119, [[2, '17:30', '18:30']], 't_reid', 5);
C('s1s3-english', 'sco', 's1s3', 'english', '', '', 119, [[4, '17:30', '18:30']], 't_fiona', 3);
C('s1s3-science', 'sco', 's1s3', 'science', '', '', 119, [[3, '17:30', '18:30']], 't_fiona', 6);
C('n5-maths-sqa', 'sco', 'n5', 'maths', 'SQA', '', 169, [[1, '18:30', '19:30']], 't_reid', 5);
C('n5-english-sqa', 'sco', 'n5', 'english', 'SQA', '', 169, [[2, '18:30', '19:30']], 't_fiona', 4);
C('n5-biology-sqa', 'sco', 'n5', 'biology', 'SQA', '', 179, [[1, '18:00', '19:30'], [3, '18:00', '19:30']], 't_fiona', 7);
C('n5-chemistry-sqa', 'sco', 'n5', 'chemistry', 'SQA', '', 179, [[4, '18:00', '19:30']], 't_fiona', 3);
C('n5-physics-sqa', 'sco', 'n5', 'physics', 'SQA', '', 179, [[3, '18:30', '20:00']], 't_reid', 8);
C('higher-maths-sqa', 'sco', 'higher', 'maths', 'SQA', '', 199, [[2, '19:00', '20:30']], 't_reid', 4);
C('higher-english-sqa', 'sco', 'higher', 'english', 'SQA', '', 199, [[3, '19:00', '20:30']], 't_fiona', 3);
C('higher-biology-sqa', 'sco', 'higher', 'biology', 'SQA', '', 209, [[4, '19:00', '20:30']], 't_fiona', 5);
C('higher-physics-sqa', 'sco', 'higher', 'physics', 'SQA', '', 209, [[4, '18:30', '20:00']], 't_reid', 4);
C('adv-maths-sqa', 'sco', 'adv', 'maths', 'SQA', '', 239, [[5, '18:00', '19:30']], 't_reid', 2);
C('adv-physics-sqa', 'sco', 'adv', 'physics', 'SQA', '', 239, [[6, '10:00', '11:30']], 't_reid', 3);
