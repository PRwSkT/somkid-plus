export type GradeGroup = "อนุบาล" | "ประถม" | "มัธยม";
export type AcademicSubject = "คณิตศาสตร์" | "วิทยาศาสตร์" | "อังกฤษ MEP" | "สอบเข้า & Olympiad";
export type ExamGoal = "ปูพื้นฐานและเพิ่มเกรด" | "สอบเข้าหลักสูตร EP/MEP" | "สอบแข่งขันระดับสากล";
export type SkillTier = "foundation" | "accelerator" | "achiever";

export interface AcademicCourse {
  id: string;
  published: boolean;
  code: string;
  title: string;
  subtitle: string;
  subject: AcademicSubject;
  gradeGroup: GradeGroup;
  gradeRange: string;
  examGoal: ExamGoal;
  tierMatch: SkillTier;
  schedule: string;
  format: string;
  seatsTotal: number;
  seatsRemaining: number;
  tuitionThb: number;
  durationWeeks: number;
  outcomes: string[];
}

export interface ActivityProgram {
  id: string;
  published: boolean;
  code: string;
  discipline: "กีฬา & ว่ายน้ำ" | "ดนตรีสากล" | "ศิลปะ & Design" | "Coding & Robotics";
  title: string;
  subtitle: string;
  ageRange: string;
  coachRatio: string;
  safetyAndEquipment: string;
  schedule: string;
  campDate: string;
  seatsRemaining: number;
  trialFeeThb: number;
  comboDiscountNote: string;
}

export interface InstructorProfile {
  id: string;
  published: boolean;
  name: string;
  role: string;
  credentials: string;
  focus: string;
  experienceYears: number;
}

export interface StudentOutcome {
  id: string;
  published: boolean;
  studentInitial: string;
  grade: string;
  track: string;
  beforeAfter: string;
  quote: string;
}

export type SkillDimensionKey =
  | "conceptual"
  | "applied"
  | "logic"
  | "accuracy"
  | "expression";

export const SKILL_DIMENSION_LABELS: Record<SkillDimensionKey, string> = {
  conceptual: "ความเข้าใจแนวคิด",
  applied: "การวิเคราะห์โจทย์ประยุกต์",
  logic: "ตรรกะและลำดับความคิด",
  accuracy: "ความแม่นยำและการบริหารเวลา",
  expression: "การสื่อสารและการตีความ",
};

export interface MockQuestion {
  id: string;
  dimension: SkillDimensionKey;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MockExamTrack {
  id: string;
  published: boolean;
  title: string;
  subjectLabel: string;
  gradeLabel: string;
  durationMinutes: number;
  description: string;
  questions: MockQuestion[];
}

export const SEED_COURSES: AcademicCourse[] = [
  {
    id: "math-p46-found",
    published: true,
    code: "SMK-M101",
    title: "Core Math Foundation: เศษส่วน ทศนิยม และความสัมพันธ์เชิงตัวเลข",
    subtitle: "ปูรากฐานวิธีคิดแบบ Concrete-Pictorial-Abstract (CPA) ลดความสับสนเมื่อเจอโจทย์ปัญหา",
    subject: "คณิตศาสตร์",
    gradeGroup: "ประถม",
    gradeRange: "ป.4 – ป.6",
    examGoal: "ปูพื้นฐานและเพิ่มเกรด",
    tierMatch: "foundation",
    schedule: "เสาร์ 09:30 – 11:30 น.",
    format: "กลุ่มย่อยสูงสุด 8 คน (Onsite / Hybrid)",
    seatsTotal: 8,
    seatsRemaining: 3,
    tuitionThb: 6900,
    durationWeeks: 12,
    outcomes: [
      "สัปดาห์ 1–4: แปลงภาพปัญหาเศษส่วนและอัตราส่วนเป็นโมเดลบาร์ (Bar Model) ได้แม่นยำ",
      "สัปดาห์ 5–8: แก้สมการเบื้องต้นและโจทย์ร้อยละในชีวิตประจำวันโดยไม่ท่องจำสูตร",
      "สัปดาห์ 9–12: ประเมินผลจำลอง 5 ทักษะพร้อมรายงานจุดแข็ง-จุดอ่อนฉบับผู้ปกครอง",
    ],
  },
  {
    id: "math-p46-accel",
    published: true,
    code: "SMK-M204",
    title: "Applied Problem Solving & EP Math Mastery",
    subtitle: "ฝึกวิเคราะห์โจทย์ประยุกต์หลายขั้นตอนและคำศัพท์คณิตศาสตร์ภาษาอังกฤษสำหรับห้อง EP/MEP",
    subject: "คณิตศาสตร์",
    gradeGroup: "ประถม",
    gradeRange: "ป.4 – ป.6",
    examGoal: "สอบเข้าหลักสูตร EP/MEP",
    tierMatch: "accelerator",
    schedule: "อาทิตย์ 13:00 – 15:00 น.",
    format: "กลุ่มย่อยสูงสุด 10 คน",
    seatsTotal: 10,
    seatsRemaining: 4,
    tuitionThb: 7900,
    durationWeeks: 12,
    outcomes: [
      "สัปดาห์ 1–4: ตีความโจทย์ Word Problems ภาษาอังกฤษและแยกตัวแปรสำคัญ",
      "สัปดาห์ 5–8: เรขาคณิตวิเคราะห์ พื้นที่ผิว ปริมาตร และความน่าจะเป็นประยุกต์",
      "สัปดาห์ 9–12: จับเวลาทำข้อสอบจำลองแนวสาธิตและห้อง Gifted / EP",
    ],
  },
  {
    id: "math-m13-olymp",
    published: true,
    code: "SMK-M309",
    title: "Advanced Math & Olympiad Track (สสวท. / AMC / IJSO Prep)",
    subtitle: "สำหรับนักเรียนคะแนนประเมิน 80%+ มุ่งสู่เวทีแข่งขันวิชาการระดับประเทศและนานาชาติ",
    subject: "สอบเข้า & Olympiad",
    gradeGroup: "มัธยม",
    gradeRange: "ม.1 – ม.3",
    examGoal: "สอบแข่งขันระดับสากล",
    tierMatch: "achiever",
    schedule: "เสาร์ 14:00 – 16:30 น.",
    format: "Seminar Group สูงสุด 8 คน",
    seatsTotal: 8,
    seatsRemaining: 2,
    tuitionThb: 9500,
    durationWeeks: 12,
    outcomes: [
      "สัปดาห์ 1–4: ทฤษฎีจำนวน (Number Theory) และคอมบินาทอริกเชิงลึก",
      "สัปดาห์ 5–8: พีชคณิตขั้นสูงและการพิสูจน์ทางเรขาคณิตแบบไม่พึ่งสูตรลัด",
      "สัปดาห์ 9–12: จำลองสนามสอบแข่งขันจริงแบบ 1:1 Peer Review กับอาจารย์",
    ],
  },
  {
    id: "eng-mep-found",
    published: true,
    code: "SMK-E102",
    title: "English MEP Confidence & Structural Reading",
    subtitle: "เสริมความคล่องตัวด้านการอ่านจับใจความ ไวยากรณ์เชิงโครงสร้าง และการฟัง-พูดในห้องเรียนจริง",
    subject: "อังกฤษ MEP",
    gradeGroup: "ประถม",
    gradeRange: "ป.3 – ป.6",
    examGoal: "ปูพื้นฐานและเพิ่มเกรด",
    tierMatch: "foundation",
    schedule: "อังคาร & พฤหัสบดี 16:30 – 18:00 น.",
    format: "กลุ่มย่อยสูงสุด 8 คน (ครูไทย + Native Mentor)",
    seatsTotal: 8,
    seatsRemaining: 5,
    tuitionThb: 7500,
    durationWeeks: 12,
    outcomes: [
      "สัปดาห์ 1–4: ถอดโครงสร้างประโยค (Sentence Anatomy) และคลังคำศัพท์เชิงบริบท",
      "สัปดาห์ 5–8: ฝึกสรุปใจความบทความสั้นและโต้ตอบในสถานการณ์จำลอง",
      "สัปดาห์ 9–12: วัดระดับ CEFR Pre-A1 ถึง A2 พร้อมแผนการอ่านรายบุคคล",
    ],
  },
  {
    id: "eng-mep-accel",
    published: true,
    code: "SMK-E205",
    title: "Academic English MEP & Cambridge/IELTS Foundation",
    subtitle: "ยกระดับทักษะการเขียนเชิงวิเคราะห์ (Analytical Writing) และการอ่านบทความวิชาการระดับสากล",
    subject: "อังกฤษ MEP",
    gradeGroup: "มัธยม",
    gradeRange: "ม.1 – ม.3",
    examGoal: "สอบเข้าหลักสูตร EP/MEP",
    tierMatch: "accelerator",
    schedule: "อาทิตย์ 09:30 – 12:00 น.",
    format: "กลุ่มย่อยสูงสุด 10 คน",
    seatsTotal: 10,
    seatsRemaining: 3,
    tuitionThb: 8800,
    durationWeeks: 12,
    outcomes: [
      "สัปดาห์ 1–4: Critical Reading & Inference สำหรับบทความวิทยาศาสตร์และสังคมศาสตร์",
      "สัปดาห์ 5–8: โครงสร้าง Paragraph & Essay Argumentation มาตรฐานสากล",
      "สัปดาห์ 9–12: Mock Speaking Interview 1:1 และประเมินเกณฑ์ CEFR B1–B2",
    ],
  },
  {
    id: "sci-m13-lab",
    published: true,
    code: "SMK-S201",
    title: "Inquiry Science Lab: ฟิสิกส์-เคมี-ชีววิทยาเชิงทดลอง",
    subtitle: "เรียนรู้วิทยาศาสตร์จากการตั้งสมมติฐานและลงมือทดลองจริง เพื่อสอบเข้า ม.4 โรงเรียนชั้นนำ",
    subject: "วิทยาศาสตร์",
    gradeGroup: "มัธยม",
    gradeRange: "ม.1 – ม.3",
    examGoal: "สอบเข้าหลักสูตร EP/MEP",
    tierMatch: "accelerator",
    schedule: "เสาร์ 13:00 – 15:30 น.",
    format: "Lab-Based Group สูงสุด 10 คน",
    seatsTotal: 10,
    seatsRemaining: 4,
    tuitionThb: 8500,
    durationWeeks: 12,
    outcomes: [
      "สัปดาห์ 1–4: กลศาสตร์ พลังงาน และการออกแบบการทดลองควบคุมตัวแปร",
      "สัปดาห์ 5–8: ปฏิกิริยาเคมีเบื้องต้นและชีววิทยาระดับเซลล์ผ่านกล้องจุลทรรศน์",
      "สัปดาห์ 9–12: วิเคราะห์โจทย์เชิงทดลองแนว MWIT / เตรียมอุดมฯ",
    ],
  },
  {
    id: "kinder-bilingual",
    published: true,
    code: "SMK-K101",
    title: "Early Childhood Bilingual & Executive Function",
    subtitle: "พัฒนาสมาธิ ตรรกะเชิงภาพ และภาษาอังกฤษธรรมชาติสำหรับปฐมวัย ผ่านกิจกรรมลงมือทำ",
    subject: "อังกฤษ MEP",
    gradeGroup: "อนุบาล",
    gradeRange: "อ.2 – อ.3",
    examGoal: "ปูพื้นฐานและเพิ่มเกรด",
    tierMatch: "foundation",
    schedule: "เสาร์ 09:00 – 11:00 น.",
    format: "กลุ่มย่อย 6 คน (ครูประจำ 2 ท่าน)",
    seatsTotal: 6,
    seatsRemaining: 2,
    tuitionThb: 6500,
    durationWeeks: 12,
    outcomes: [
      "สัปดาห์ 1–4: Phonics ธรรมชาติและทักษะการฟังคำสั่งสองภาษา",
      "สัปดาห์ 5–8: การจัดหมวดหมู่ รูปทรง และ Executive Function (EF)",
      "สัปดาห์ 9–12: รายงานพัฒนาการรายบุคคลสำหรับเตรียมความพร้อมขึ้น ป.1",
    ],
  },
];

export const SEED_ACTIVITIES: ActivityProgram[] = [
  {
    id: "act-swim-aquatics",
    published: true,
    code: "ACT-SW01",
    discipline: "กีฬา & ว่ายน้ำ",
    title: "Precision Aquatics & Water Safety Academy",
    subtitle: "สระน้ำระบบน้ำเกลือควบคุมอุณหภูมิ ฝึกทักษะว่ายน้ำ 4 ท่ามาตรฐานและการเอาตัวรอดในน้ำ",
    ageRange: "4 – 15 ปี",
    coachRatio: "โค้ช 1 : นักเรียน 4 (มี Lifeguard ประจำสระตลอดเวลา)",
    safetyAndEquipment: "สระระบบน้ำเกลือมาตรฐาน FINA ตรวจค่า pH ทุก 4 ชั่วโมง พร้อมอุปกรณ์ลอยตัวรับรองมาตรฐานยุโรป",
    schedule: "อังคาร–ศุกร์ 16:30 – 18:00 น. / เสาร์–อาทิตย์ 09:00 – 11:30 น.",
    campDate: "Holiday Camp: 12 – 16 เมษายน 2027",
    seatsRemaining: 4,
    trialFeeThb: 450,
    comboDiscountNote: "รับส่วนลด 15% เมื่อลงทะเบียนควบคู่คอร์สวิชาการ Somkid+",
  },
  {
    id: "act-music-ensemble",
    published: true,
    code: "ACT-MU02",
    discipline: "ดนตรีสากล",
    title: "Classical & Contemporary Ensemble (Piano / Violin / Acoustic)",
    subtitle: "ฝึกสมาธิ การอ่านโน้ตสากล และการทำงานร่วมกับผู้อื่นผ่านวงดนตรีขนาดเล็ก",
    ageRange: "5 – 16 ปี",
    coachRatio: "อาจารย์ 1 : นักเรียน 1–3 (Individual & Chamber)",
    safetyAndEquipment: "ห้องซ้อมเก็บเสียงมาตรฐาน Acoustic Panel พร้อมเปียโน Kawai และเครื่องสายปรับเทียบทุกสัปดาห์",
    schedule: "พุธ–อาทิตย์ (เลือกจองรอบเวลา 60 นาที)",
    campDate: "Recital Showcase: ทุกวันเสาร์สัปดาห์สุดท้ายของเทอม",
    seatsRemaining: 5,
    trialFeeThb: 500,
    comboDiscountNote: "ฟรีค่าประเมินทักษะดนตรีเมื่อสมัครพร้อมคอร์สภาษาอังกฤษ MEP",
  },
  {
    id: "act-art-architecture",
    published: true,
    code: "ACT-AR03",
    discipline: "ศิลปะ & Design",
    title: "Visual Thinking, Sketching & Spatial Design Studio",
    subtitle: "พัฒนาความคิดสร้างสรรค์เชิงโครงสร้าง การสังเกตแสงเงา และ Portfolio สำหรับสายสถาปัตย์/ดีไซน์",
    ageRange: "6 – 17 ปี",
    coachRatio: "อาจารย์ 1 : นักเรียน 6",
    safetyAndEquipment: "สีและวัสดุศิลปะเกรด Non-Toxic 100% พร้อมแสงธรรมชาติ (North-Light Studio)",
    schedule: "เสาร์ 13:30 – 15:30 น. / อาทิตย์ 10:00 – 12:00 น.",
    campDate: "Weekend Architecture Lab: 5 – 6 ธันวาคม 2026",
    seatsRemaining: 6,
    trialFeeThb: 450,
    comboDiscountNote: "รวมอุปกรณ์ครบชุดในคลาสทดลองเรียน",
  },
  {
    id: "act-coding-robotics",
    published: true,
    code: "ACT-CD04",
    discipline: "Coding & Robotics",
    title: "Applied Logic, Python & Autonomous Robotics Lab",
    subtitle: "ต่อยอดตรรกะคณิตศาสตร์สู่การเขียนโค้ด Python และประกอบหุ่นยนต์เซนเซอร์จริง",
    ageRange: "8 – 16 ปี",
    coachRatio: "Mentor 1 : นักเรียน 5",
    safetyAndEquipment: "ชุดพัฒนาหุ่นยนต์มาตรฐานสากลและ Workstation รายบุคคล ไม่มีปลั๊กไฟเปลือยในพื้นที่ผู้เรียน",
    schedule: "เสาร์ 10:00 – 12:00 น. / อาทิตย์ 13:30 – 15:30 น.",
    campDate: "STEM Robotics Sprint: 19 – 20 ธันวาคม 2026",
    seatsRemaining: 3,
    trialFeeThb: 550,
    comboDiscountNote: "ส่วนลด 1,000 บาท เมื่อจับคู่คอร์ส Math Olympiad หรือ Science Lab",
  },
];

export const SEED_EXAM_TRACKS: MockExamTrack[] = [
  {
    id: "math-p46",
    published: true,
    title: "คณิตศาสตร์ประถมปลาย (ป.4 – ป.6)",
    subjectLabel: "Mathematics Diagnostic",
    gradeLabel: "ประถมปลาย",
    durationMinutes: 15,
    description: "ประเมินความเข้าใจเศษส่วน ร้อยละ เรขาคณิต โจทย์ปัญหาประยุกต์ และตรรกะเชิงตัวเลข 12 ข้อ",
    questions: [
      {
        id: "m1",
        dimension: "conceptual",
        prompt: "เศษส่วนใดมีค่ามากที่สุดในกลุ่มต่อไปนี้: 3/4, 5/8, 7/12, 2/3",
        options: ["3/4", "5/8", "7/12", "2/3"],
        correctIndex: 0,
        explanation: "เมื่อทำส่วนให้เท่ากันเป็น 24 จะได้ 18/24, 15/24, 14/24 และ 16/24 ดังนั้น 3/4 มีค่ามากที่สุด",
      },
      {
        id: "m2",
        dimension: "applied",
        prompt: "ร้านหนังสือลดราคาสมุด 20% จากราคาป้าย 150 บาท หากซื้อ 3 เล่มต้องจ่ายเงินทั้งหมดกี่บาท",
        options: ["320 บาท", "360 บาท", "380 บาท", "405 บาท"],
        correctIndex: 1,
        explanation: "ราคาหลังลด 20% คือ 150 × 0.8 = 120 บาทต่อเล่ม ซื้อ 3 เล่มเท่ากับ 360 บาท",
      },
      {
        id: "m3",
        dimension: "logic",
        prompt: "แบบรูปตัวเลข: 3, 7, 15, 31, 63, ... ตัวเลขถัดไปคือข้อใด",
        options: ["95", "125", "127", "129"],
        correctIndex: 2,
        explanation: "แต่ละพจน์เพิ่มขึ้นเป็น (×2 + 1): 63 × 2 + 1 = 127",
      },
      {
        id: "m4",
        dimension: "accuracy",
        prompt: "ผลลัพธ์ของ (4.5 × 8) − (12.6 ÷ 3) เท่ากับเท่าใด",
        options: ["31.8", "32.2", "30.8", "34.2"],
        correctIndex: 0,
        explanation: "4.5 × 8 = 36 และ 12.6 ÷ 3 = 4.2 ดังนั้น 36 − 4.2 = 31.8",
      },
      {
        id: "m5",
        dimension: "expression",
        prompt: "สี่เหลี่ยมผืนผ้ารูปหนึ่งมีด้านยาวยาวกว่าด้านกว้าง 4 ซม. และมีเส้นรอบรูป 36 ซม. ด้านกว้างยาวกี่ซม.",
        options: ["6 ซม.", "7 ซม.", "8 ซม.", "11 ซม."],
        correctIndex: 1,
        explanation: "ครึ่งหนึ่งของเส้นรอบรูปคือ 18 ซม. (กว้าง + ยาว = 18) และ ยาว − กว้าง = 4 ดังนั้น กว้าง = (18−4)/2 = 7 ซม.",
      },
      {
        id: "m6",
        dimension: "conceptual",
        prompt: "ค.ร.น. (LCM) ของ 12, 18 และ 24 คือข้อใด",
        options: ["36", "48", "72", "144"],
        correctIndex: 2,
        explanation: "12 = 2²×3, 18 = 2×3², 24 = 2³×3 ดังนั้น ค.ร.น. = 2³ × 3² = 72",
      },
      {
        id: "m7",
        dimension: "applied",
        prompt: "ถังน้ำมีน้ำอยู่ 3/5 ของถัง เมื่อเติมน้ำเพิ่มอีก 24 ลิตร น้ำจะเต็มถังพอดี ถังนี้จุน้ำได้กี่ลิตร",
        options: ["40 ลิตร", "50 ลิตร", "60 ลิตร", "75 ลิตร"],
        correctIndex: 2,
        explanation: "ส่วนที่ขาดคือ 2/5 ของถัง เท่ากับ 24 ลิตร ดังนั้น 1/5 = 12 ลิตร และเต็มถัง = 60 ลิตร",
      },
      {
        id: "m8",
        dimension: "logic",
        prompt: "นาฬิกาตีบอกเวลาทุกๆ 15 นาที และระฆังโรงเรียนดังทุกๆ 20 นาที หากดังพร้อมกันเวลา 08:00 น. จะดังพร้อมกันอีกครั้งเวลาใด",
        options: ["08:45 น.", "09:00 น.", "09:15 น.", "09:20 น."],
        correctIndex: 1,
        explanation: "ค.ร.น. ของ 15 และ 20 คือ 60 นาที จึงดังพร้อมกันอีกครั้งเวลา 09:00 น.",
      },
      {
        id: "m9",
        dimension: "accuracy",
        prompt: "สามเหลี่ยมมุมฉากมีฐานยาว 14 ซม. และสูง 9 ซม. พื้นที่ของสามเหลี่ยมนี้คือเท่าใด",
        options: ["54 ตร.ซม.", "63 ตร.ซม.", "72 ตร.ซม.", "126 ตร.ซม."],
        correctIndex: 1,
        explanation: "พื้นที่ = 1/2 × 14 × 9 = 63 ตารางเซนติเมตร",
      },
      {
        id: "m10",
        dimension: "expression",
        prompt: "อัตราส่วนของนักเรียนชายต่อนักเรียนหญิงเป็น 5 : 7 ถ้ามีนักเรียนทั้งหมด 48 คน มีนักเรียนหญิงมากกว่าชายกี่คน",
        options: ["4 คน", "6 คน", "8 คน", "12 คน"],
        correctIndex: 2,
        explanation: "รวม 12 ส่วน = 48 คน (1 ส่วน = 4 คน) หญิงมากกว่าชาย 2 ส่วน = 8 คน",
      },
      {
        id: "m11",
        dimension: "applied",
        prompt: "รถยนต์วิ่งด้วยความเร็วเฉลี่ย 75 กม./ชม. เป็นเวลา 2 ชั่วโมง 24 นาที จะได้ระยะทางกี่กิโลเมตร",
        options: ["165 กม.", "175 กม.", "180 กม.", "190 กม."],
        correctIndex: 2,
        explanation: "2 ชม. 24 นาที = 2.4 ชม. ระยะทาง = 75 × 2.4 = 180 กม.",
      },
      {
        id: "m12",
        dimension: "logic",
        prompt: "ในการแข่งขันหมากรุก 5 คน พบกันหมดทุกคนคนละ 1 ครั้ง จะมีการแข่งขันเกิดขึ้นทั้งหมดกี่คู่",
        options: ["8 คู่", "10 คู่", "12 คู่", "20 คู่"],
        correctIndex: 1,
        explanation: "(5 × 4) ÷ 2 = 10 คู่",
      },
    ],
  },
  {
    id: "eng-mep",
    published: true,
    title: "ภาษาอังกฤษ MEP (ป.5 – ม.2)",
    subjectLabel: "English MEP Diagnostic",
    gradeLabel: "ป.5 – ม.2",
    durationMinutes: 15,
    description: "วัดระดับโครงสร้างประโยค คำศัพท์เชิงบริบท การอ่านจับใจความ และตรรกะการสื่อสารภาษาอังกฤษ 12 ข้อ",
    questions: [
      {
        id: "e1",
        dimension: "conceptual",
        prompt: "Choose the grammatically correct sentence:",
        options: [
          "Neither the teacher nor the students was late.",
          "Neither the teacher nor the students were late.",
          "Neither the teacher or the students were late.",
          "Neither the teacher nor the students is late.",
        ],
        correctIndex: 1,
        explanation: "With 'neither...nor', the verb agrees with the closer subject ('the students' -> plural 'were').",
      },
      {
        id: "e2",
        dimension: "expression",
        prompt: "In an experiment, the data was 'ambiguous'. What does 'ambiguous' mean?",
        options: [
          "Completely accurate and proven",
          "Open to more than one interpretation; unclear",
          "Recorded in a digital table",
          "Too expensive to repeat",
        ],
        correctIndex: 1,
        explanation: "'Ambiguous' means unclear or having more than one possible meaning.",
      },
      {
        id: "e3",
        dimension: "applied",
        prompt: "If she ______ earlier yesterday, she wouldn't have missed the morning briefing.",
        options: ["arrives", "arrived", "had arrived", "would arrive"],
        correctIndex: 2,
        explanation: "Third conditional (past unreal): 'If + had + V3, would have + V3'.",
      },
      {
        id: "e4",
        dimension: "logic",
        prompt: "Passage: 'Although solar panels reduce monthly electricity bills, their initial installation cost remains a barrier for small schools.' What is the author's main point?",
        options: [
          "Solar panels do not save electricity.",
          "Small schools prefer wind power.",
          "Upfront cost limits adoption despite long-term savings.",
          "Electricity bills are rising every year.",
        ],
        correctIndex: 2,
        explanation: "The contrast ('Although...') highlights long-term savings vs. high initial cost.",
      },
      {
        id: "e5",
        dimension: "accuracy",
        prompt: "Select the correct preposition: 'The science fair is scheduled ______ Friday morning ______ 9:00 a.m.'",
        options: ["in / at", "on / at", "at / on", "on / in"],
        correctIndex: 1,
        explanation: "Use 'on' for specific days/parts of a specific day ('on Friday morning') and 'at' for exact clock time.",
      },
      {
        id: "e6",
        dimension: "conceptual",
        prompt: "Which sentence uses the passive voice correctly?",
        options: [
          "The bridge was designing by a young engineer.",
          "The bridge designed by a young engineer.",
          "The bridge was designed by a young engineer.",
          "The bridge has been design by a young engineer.",
        ],
        correctIndex: 2,
        explanation: "Past passive structure requires 'was/were + past participle (designed)'.",
      },
      {
        id: "e7",
        dimension: "expression",
        prompt: "Which transition word best fits? 'The team practiced every afternoon; ______, they won first place in the regional debate.'",
        options: ["however", "consequently", "meanwhile", "nevertheless"],
        correctIndex: 1,
        explanation: "'Consequently' shows cause and effect between daily practice and winning.",
      },
      {
        id: "e8",
        dimension: "applied",
        prompt: "Choose the best response when a classmate says: 'Would you mind if I borrowed your lab notebook?'",
        options: [
          "Yes, please take it.",
          "Not at all, go ahead.",
          "No, I mind it.",
          "Yes, I am.",
        ],
        correctIndex: 1,
        explanation: "'Would you mind...' is answered negatively ('Not at all') to give permission.",
      },
      {
        id: "e9",
        dimension: "accuracy",
        prompt: "Identify the error: 'Every students in the robotics club needs to bring their own laptop.'",
        options: [
          "Every students",
          "in the robotics club",
          "needs to bring",
          "own laptop",
        ],
        correctIndex: 0,
        explanation: "'Every' is followed by a singular countable noun: 'Every student'.",
      },
      {
        id: "e10",
        dimension: "logic",
        prompt: "If a museum exhibit is described as 'ephemeral', how long does it last?",
        options: [
          "For centuries",
          "For a very short time",
          "Only during winter",
          "Permanently online",
        ],
        correctIndex: 1,
        explanation: "'Ephemeral' means lasting for a very short time.",
      },
      {
        id: "e11",
        dimension: "conceptual",
        prompt: "Complete the sentence: 'The coach insisted that every player ______ on time for warm-up.'",
        options: ["is", "be", "was", "to be"],
        correctIndex: 1,
        explanation: "Subjunctive mood after 'insisted that' uses the base verb 'be'.",
      },
      {
        id: "e12",
        dimension: "expression",
        prompt: "Which headline sounds most objective and academic?",
        options: [
          "Amazing Kids Smash Math Test!",
          "Survey Indicates 42% Rise in Reading Fluency After 12 Weeks",
          "Why Everyone Loves Studying Here Forever",
          "The Best School Ever in Town",
        ],
        correctIndex: 1,
        explanation: "Objective academic writing relies on measurable data rather than exaggeration.",
      },
    ],
  },
  {
    id: "sci-m13",
    published: true,
    title: "วิทยาศาสตร์มัธยมต้น (ม.1 – ม.3)",
    subjectLabel: "Inquiry Science Diagnostic",
    gradeLabel: "มัธยมต้น",
    durationMinutes: 15,
    description: "วัดความเข้าใจทักษะกระบวนการทางวิทยาศาสตร์ ฟิสิกส์ เคมี และชีววิทยาเชิงวิเคราะห์ 12 ข้อ",
    questions: [
      {
        id: "s1",
        dimension: "conceptual",
        prompt: "ในการทดลองเปรียบเทียบการเจริญเติบโตของพืชที่ได้รับแสงสีต่างกัน ตัวแปรต้น (Independent Variable) คือข้อใด",
        options: ["ความสูงของต้นพืช", "สีของแสงที่ให้", "ปริมาณน้ำที่รด", "ชนิดของดิน"],
        correctIndex: 1,
        explanation: "ตัวแปรต้นคือสิ่งที่ผู้ทดลองจงใจจัดให้แตกต่างกันเพื่อดูผลลัพธ์ นั่นคือสีของแสง",
      },
      {
        id: "s2",
        dimension: "applied",
        prompt: "วัตถุมวล 4 กิโลกรัม ถูกแรงลัพธ์ขนาด 20 นิวตันกระทำในแนวราบ วัตถุจะเคลื่อนที่ด้วยความเร่งเท่าใด",
        options: ["0.2 m/s²", "4 m/s²", "5 m/s²", "80 m/s²"],
        correctIndex: 2,
        explanation: "จาก F = ma จะได้ a = F/m = 20 / 4 = 5 m/s²",
      },
      {
        id: "s3",
        dimension: "conceptual",
        prompt: "ออร์แกเนลล์ใดในเซลล์พืชที่ทำหน้าที่สร้างพลังงาน (ATP) จากการหายใจระดับเซลล์",
        options: ["คลอโรพลาสต์", "ไมโทคอนเดรีย", "กอลจิบอดี", "แวคิวโอล"],
        correctIndex: 1,
        explanation: "ไมโทคอนเดรีย (Mitochondria) เป็นแหล่งสร้าง ATP ทั้งในเซลล์พืชและเซลล์สัตว์",
      },
      {
        id: "s4",
        dimension: "accuracy",
        prompt: "สารละลายที่มีค่า pH = 3 เมื่อทดสอบด้วยกระดาษลิตมัสสีน้ำเงินและสีแดง จะเกิดผลอย่างไร",
        options: [
          "น้ำเงินเปลี่ยนเป็นแดง / แดงไม่เปลี่ยน",
          "แดงเปลี่ยนเป็นน้ำเงิน / น้ำเงินไม่เปลี่ยน",
          "ไม่เปลี่ยนสีทั้งคู่",
          "เปลี่ยนเป็นสีเขียวทั้งคู่",
        ],
        correctIndex: 0,
        explanation: "pH = 3 มีสมบัติเป็นกรด จึงเปลี่ยนลิตมัสสีน้ำเงินเป็นสีแดง",
      },
      {
        id: "s5",
        dimension: "logic",
        prompt: "หากต่อหลอดไฟ 2 ดวงแบบอนุกรมแล้วหลอดหนึ่งไส้ขาด อีกหลอดจะเป็นอย่างไร",
        options: [
          "สว่างมากขึ้น",
          "สว่างเท่าเดิม",
          "ดับตามไปด้วย",
          "กระพริบเป็นจังหวะ",
        ],
        correctIndex: 2,
        explanation: "วงจรอนุกรมมีทางเดินกระแสไฟเพียงเส้นทางเดียว เมื่อวงจรขาดกระแสไฟจะไม่ไหล",
      },
      {
        id: "s6",
        dimension: "expression",
        prompt: "เหตุใดน้ำแข็งจึงลอยบนผิวน้ำเหลวได้",
        options: [
          "น้ำแข็งไม่มีมวล",
          "ความหนาแน่นของน้ำแข็งน้อยกว่าน้ำเหลว",
          "แรงตึงผิวของน้ำแข็งสูงกว่า",
          "น้ำแข็งดูดความร้อนจากอากาศ",
        ],
        correctIndex: 1,
        explanation: "เมื่อน้ำแข็งตัว โมเลกุลจัดเรียงตัวแบบมีช่องว่าง ทำให้ปริมาตรเพิ่มและความหนาแน่นลดลง (~0.92 g/cm³)",
      },
      {
        id: "s7",
        dimension: "applied",
        prompt: "โลหะก้อนหนึ่งมีมวล 54 กรัม และมีปริมาตร 20 ลูกบาศก์เซนติเมตร ความหนาแน่นของโลหะนี้คือเท่าใด",
        options: ["0.37 g/cm³", "2.7 g/cm³", "3.4 g/cm³", "10.8 g/cm³"],
        correctIndex: 1,
        explanation: "ความหนาแน่น = มวล / ปริมาตร = 54 / 20 = 2.7 g/cm³ (อะลูมิเนียม)",
      },
      {
        id: "s8",
        dimension: "conceptual",
        prompt: "แก๊สชนิดใดเป็นองค์ประกอบหลักที่มีสัดส่วนมากที่สุดในบรรยากาศโลก (~78%)",
        options: ["ออกซิเจน", "คาร์บอนไดออกไซด์", "ไนโตรเจน", "อาร์กอน"],
        correctIndex: 2,
        explanation: "บรรยากาศโลกประกอบด้วยแก๊สไนโตรเจนประมาณ 78% และออกซิเจนประมาณ 21%",
      },
      {
        id: "s9",
        dimension: "logic",
        prompt: "ในการสังเคราะห์ด้วยแสงของพืช พลังงานแสงถูกเปลี่ยนไปเป็นพลังงานรูปแบบใด",
        options: ["พลังงานกล", "พลังงานเคมีในรูปน้ำตาล", "พลังงานความร้อน", "พลังงานแม่เหล็ก"],
        correctIndex: 1,
        explanation: "พืชเปลี่ยนพลังงานแสงเป็นพลังงานเคมีสะสมในโมเลกุลกลูโคส",
      },
      {
        id: "s10",
        dimension: "accuracy",
        prompt: "การเปลี่ยนแปลงใดต่อไปนี้เป็นการเปลี่ยนแปลงทางเคมี (Chemical Change)",
        options: [
          "การหลอมเหลวของเทียนไข",
          "การละลายเกลือในน้ำ",
          "การเกิดสนิมเหล็ก",
          "การระเหยของแอลกอฮอล์",
        ],
        correctIndex: 2,
        explanation: "การเกิดสนิมเหล็กเกิดสารใหม่ (Iron oxide) จึงเป็นการเปลี่ยนแปลงทางเคมี",
      },
      {
        id: "s11",
        dimension: "expression",
        prompt: "ทำไมนักบินอวกาศบนสถานีอวกาศจึงไม่สามารถได้ยินเสียงเคาะภายนอกยานโดยตรงในสุญญากาศ",
        options: [
          "เสียงเดินทางช้าเกินไปในอวกาศ",
          "คลื่นเสียงเป็นคลื่นกล ต้องอาศัยตัวกลางในการเคลื่อนที่",
          "อุณหภูมิในอวกาศต่ำเกินไป",
          "แรงโน้มถ่วงดูดกลืนคลื่นเสียง",
        ],
        correctIndex: 1,
        explanation: "เสียงเป็นคลื่นกล (Mechanical Wave) จึงไม่สามารถเคลื่อนที่ผ่านสุญญากาศที่ไม่มีตัวกลางได้",
      },
      {
        id: "s12",
        dimension: "applied",
        prompt: "ถ้าความต่างศักย์คร่อมตัวต้านทาน 6 โอห์ม มีค่าเท่ากับ 12 โวลต์ กระแสไฟฟ้าที่ไหลผ่านตัวต้านทานนี้มีค่ากี่แอมแปร์",
        options: ["0.5 A", "2 A", "6 A", "72 A"],
        correctIndex: 1,
        explanation: "จากกฎของโอห์ม I = V / R = 12 / 6 = 2 แอมแปร์",
      },
    ],
  },
];

export interface TierSummary {
  tier: SkillTier;
  labelEn: string;
  labelTh: string;
  rangeLabel: string;
  summary: string;
  adminAction: string;
}

export const TIER_MATRIX: Record<SkillTier, TierSummary> = {
  foundation: {
    tier: "foundation",
    labelEn: "Foundation Builder",
    labelTh: "ปูพื้นฐานให้แน่น",
    rangeLabel: "0% – 49%",
    summary:
      "แนะนำคอร์สปรับพื้นฐานและสร้างความมั่นใจ (Core Foundation) ควบคู่คลาสกิจกรรมพัฒนาสมาธิและการคิดเชิงระบบ",
    adminAction:
      "ทีมแนะแนวติดต่อภายใน 24 ชม. พร้อมมอบสิทธิ์คลาสทดลองเรียนฟรี 1 ครั้งและแผนปูพื้นฐาน 12 สัปดาห์",
  },
  accelerator: {
    tier: "accelerator",
    labelEn: "Skill Accelerator",
    labelTh: "ต่อยอดและปิดจุดอ่อน",
    rangeLabel: "50% – 79%",
    summary:
      "แนะนำคอร์สเสริมทักษะเข้มข้นตามบทที่เสียคะแนน (Targeted Mastery) และฝึกทำโจทย์ประยุกต์มาตรฐานสากล",
    adminAction:
      "จัดส่งผลวิเคราะห์รายหมวดทาง LINE พร้อมสิทธิ์ Early Bird เมื่อสมัครต่อเนื่อง 1 เทอมหรือจับคู่สายกิจกรรม",
  },
  achiever: {
    tier: "achiever",
    labelEn: "Global Achiever",
    labelTh: "ความเป็นเลิศและแข่งขัน",
    rangeLabel: "80% – 100%",
    summary:
      "แนะนำคอร์สติวเข้มสอบเข้าและแข่งขันระดับนานาชาติ (Advanced & Olympiad Track) และค่ายพัฒนานวัตกรรม",
    adminAction:
      "เชิญรับสิทธิ์ทุนส่วนลดเรียนดี (Merit Scholarship Discount) และรอบประเมินแข่งขันพิเศษที่สถาบัน",
  },
};

export function classifyScoreTier(percent: number): SkillTier {
  if (percent < 50) return "foundation";
  if (percent < 80) return "accelerator";
  return "achiever";
}

export interface SiteSettings {
  phone: string;
  lineId: string;
  email: string;
  address: string;
  hoursText: string;
  mapEmbedUrl: string;
  mapLinkUrl: string;
  transitNote: string;
  parkingNote: string;
  highlights: { value: string; label: string }[];
}

export interface SiteContent {
  settings: SiteSettings;
  courses: AcademicCourse[];
  activities: ActivityProgram[];
  instructors: InstructorProfile[];
  testimonials: StudentOutcome[];
  examTracks: MockExamTrack[];
}
