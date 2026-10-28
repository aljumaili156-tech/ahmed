import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

// 1. Enable CORS as FIRST middleware for real-time cloud database synchronization across devices & origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// 2. High-capacity body parsers for school logo images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const DATA_DIR = path.resolve(__dirname, 'data');
let DB_FILE = path.join(DATA_DIR, 'school_db.json');

// Ensure data directory exists with fallback to root directory
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  DB_FILE = path.resolve(__dirname, 'school_db.json');
}

export interface Teacher {
  id: string;
  name: string;
  username: string;
  password: string;
  role?: 'teacher' | 'admin';
  jobTitle?: string;
  subject: string;
  phone: string;
  notes?: string;
  isOnLeave?: boolean;
  leaveDate?: string;
  createdAt: string;
}

export interface ClassSchedule {
  id: string;
  teacherId: string;
  dayOfWeek: number; // 0: الأحد, 1: الإثنين, 2: الثلاثاء, 3: الأربعاء, 4: الخميس, 5: الجمعة, 6: السبت
  subject: string;
  gradeAndSection: string;
  room: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  alertMinutesBefore: number; // default 2
  isActive: boolean;
}

export interface AttendanceLog {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  subject: string;
  gradeAndSection: string;
  room: string;
  classStartTime: string;
  acknowledgedAt: string;
  scheduledDate: string; // YYYY-MM-DD
  status: 'heading_to_class' | 'late' | 'excused';
  note?: string;
  syncedFromOffline?: boolean;
}

export interface SchoolDb {
  teachers: Teacher[];
  classes: ClassSchedule[];
  logs: AttendanceLog[];
  settings: {
    schoolName: string;
    schoolLogo?: string;
    defaultAlertMinutes: number;
    ringDurationSeconds: number;
    allowTeacherSoundChoice: boolean;
  };
}

function getDefaultData(): SchoolDb {
  const now = new Date();
  const currentDay = now.getDay();
  // Generate a test class starting in 2 minutes for immediate live testing
  const testDate = new Date(now.getTime() + 2 * 60 * 1000);
  const testHour = String(testDate.getHours()).padStart(2, '0');
  const testMin = String(testDate.getMinutes()).padStart(2, '0');
  const testEndHour = String(new Date(testDate.getTime() + 45 * 60 * 1000).getHours()).padStart(2, '0');
  const testEndMin = String(new Date(testDate.getTime() + 45 * 60 * 1000).getMinutes()).padStart(2, '0');

  const teachers: Teacher[] = [
    {
      id: 'teacher-1',
      name: 'أستاذ أحمد حسن الجميلي',
      username: 'ahmed',
      password: '123',
      subject: 'العلوم العامة',
      phone: '07701234567',
      role: 'teacher',
      jobTitle: 'مدرس مادة',
      isOnLeave: false,
      notes: 'مدرس مادة العلوم للصفوف الابتدائية',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'teacher-2',
      name: 'ست زينب علي الكرخي',
      username: 'zainab',
      password: '123',
      subject: 'الرياضيات',
      phone: '07809876543',
      role: 'teacher',
      jobTitle: 'مدرسة مادة',
      isOnLeave: false,
      notes: 'مدرسة الرياضيات للمرحلة الابتدائية',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'teacher-admin',
      name: 'أستاذ محمد جاسم الحيالي',
      username: 'director',
      password: '123',
      subject: 'الإدارة المدرسية',
      phone: '07501112233',
      role: 'admin',
      jobTitle: 'مدير المدرسة',
      isOnLeave: false,
      notes: 'مدير المدرسة - صلاحيات كاملة',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'teacher-asst',
      name: 'أستاذ حيدر محمد الأسدي',
      username: 'assistant',
      password: '123',
      subject: 'الإشراف التربوي',
      phone: '07505554433',
      role: 'admin',
      jobTitle: 'معاون شؤون الطلبة',
      isOnLeave: false,
      notes: 'معاون المدير - صلاحيات إدارة',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'teacher-3',
      name: 'ست مروة خالد السامرائي',
      username: 'marwa',
      password: '123',
      subject: 'اللغة الإنجليزية',
      phone: '07712334455',
      role: 'teacher',
      jobTitle: 'مدرسة مادة',
      isOnLeave: false,
      notes: 'مدرسة اللغة الإنجليزية',
      createdAt: new Date().toISOString(),
    },
  ];

  const classes: ClassSchedule[] = [
    // Live test class for Ahmed starting in 2 minutes
    {
      id: 'class-test-now',
      teacherId: 'teacher-1',
      dayOfWeek: currentDay,
      subject: 'العلوم العامة (حصة تجريبية فورية)',
      gradeAndSection: 'الصف الأول الابتدائي - أ',
      room: '',
      startTime: `${testHour}:${testMin}`,
      endTime: `${testEndHour}:${testEndMin}`,
      alertMinutesBefore: 2,
      isActive: true,
    },
    // Standard weekly classes for Sunday (0) to Thursday (4)
    {
      id: 'c-101',
      teacherId: 'teacher-1',
      dayOfWeek: 0, // الأحد
      subject: 'العلوم العامة',
      gradeAndSection: 'الصف الأول الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-102',
      teacherId: 'teacher-2',
      dayOfWeek: 0, // الأحد
      subject: 'الرياضيات',
      gradeAndSection: 'الصف الثاني الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-103',
      teacherId: 'teacher-3',
      dayOfWeek: 0, // الأحد
      subject: 'اللغة الإنجليزية',
      gradeAndSection: 'الصف الثالث الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-104',
      teacherId: 'teacher-1',
      dayOfWeek: 0, // الأحد
      subject: 'العلوم العامة',
      gradeAndSection: 'الصف الرابع الابتدائي - أ',
      room: '',
      startTime: '08:50',
      endTime: '09:35',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-105',
      teacherId: 'teacher-2',
      dayOfWeek: 0, // الأحد
      subject: 'الرياضيات',
      gradeAndSection: 'الصف الخامس الابتدائي - أ',
      room: '',
      startTime: '08:50',
      endTime: '09:35',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-106',
      teacherId: 'teacher-3',
      dayOfWeek: 0, // الأحد
      subject: 'اللغة الإنجليزية',
      gradeAndSection: 'الصف السادس الابتدائي - أ',
      room: '',
      startTime: '08:50',
      endTime: '09:35',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-104',
      teacherId: 'teacher-1',
      dayOfWeek: 1, // الإثنين
      subject: 'الفيزياء',
      gradeAndSection: 'الرابع العلمي - شعبة ب',
      room: 'قاعة 104',
      startTime: '09:20',
      endTime: '10:05',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-105',
      teacherId: 'teacher-1',
      dayOfWeek: 2, // الثلاثاء
      subject: 'الفيزياء عملي',
      gradeAndSection: 'السادس العلمي - شعبة أ',
      room: 'مختبر العلوم المركزي',
      startTime: '08:30',
      endTime: '09:15',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-106',
      teacherId: 'teacher-1',
      dayOfWeek: 3, // الأربعاء
      subject: 'الفيزياء',
      gradeAndSection: 'الخامس العلمي - شعبة ب',
      room: 'قاعة 201',
      startTime: '11:10',
      endTime: '11:55',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-107',
      teacherId: 'teacher-1',
      dayOfWeek: 4, // الخميس
      subject: 'الفيزياء مراجعة',
      gradeAndSection: 'السادس العلمي - شعبة أ+ب',
      room: 'المدرج الرئيسي',
      startTime: '10:15',
      endTime: '11:00',
      alertMinutesBefore: 2,
      isActive: true,
    },
    // Classes for Zainab (Math)
    {
      id: 'c-201',
      teacherId: 'teacher-2',
      dayOfWeek: 1, // الإثنين
      subject: 'الرياضيات',
      gradeAndSection: 'الرابع العلمي - شعبة أ',
      room: 'قاعة 101',
      startTime: '08:30',
      endTime: '09:15',
      alertMinutesBefore: 2,
      isActive: true,
    },
    // Classes for Haider (Arabic)
    {
      id: 'c-301',
      teacherId: 'teacher-3',
      dayOfWeek: 0,
      subject: 'اللغة العربية',
      gradeAndSection: 'السادس الإعدادي - شعبة أ',
      room: 'قاعة 203',
      startTime: '09:20',
      endTime: '10:05',
      alertMinutesBefore: 2,
      isActive: true,
    },
  ];

  return {
    teachers,
    classes,
    logs: [
      {
        id: 'log-sample-1',
        teacherId: 'teacher-1',
        teacherName: 'أستاذ أحمد حسن الجميلي',
        classId: 'c-101',
        subject: 'الفيزياء',
        gradeAndSection: 'الخامس العلمي - شعبة أ',
        room: 'قاعة 102',
        classStartTime: '08:30',
        acknowledgedAt: new Date(Date.now() - 3600000).toISOString(),
        scheduledDate: new Date().toISOString().split('T')[0],
        status: 'heading_to_class',
        note: 'تم التوجه للقاعة في الموعد المحدد',
        syncedFromOffline: false,
      },
    ],
    settings: {
      schoolName: 'ثانوية النخبة النموذجية للبنين',
      defaultAlertMinutes: 2,
      ringDurationSeconds: 15,
      allowTeacherSoundChoice: true,
    },
  };
}

function readDb(): SchoolDb {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getDefaultData();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      } catch (e) {
        console.warn('Initial write to DB_FILE failed, using fallback:', e);
      }
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.teachers || !Array.isArray(parsed.teachers)) {
      return getDefaultData();
    }
    return parsed as SchoolDb;
  } catch (err) {
    console.error('Error reading database file, returning default:', err);
    return getDefaultData();
  }
}

function writeDb(db: SchoolDb): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
    try {
      fs.writeFileSync(path.resolve(__dirname, 'school_db.json'), JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Fallback DB write failed:', e);
    }
  }
}

// REST API Endpoints

// 1. Health check & bootstrap (Teacher/Admin loads all data to cache locally for offline use)
app.get('/api/bootstrap', (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    teachers: db.teachers.map(({ password, ...t }) => ({
      ...t,
      // In this demo school app, teacher credentials can be verified or displayed to admin
      hasPassword: Boolean(password),
    })),
    // Full teachers list with password for local admin auth checking if needed
    classes: db.classes,
    logs: db.logs.slice(-100), // last 100 logs
    settings: db.settings,
  });
});

// Full bootstrap for authorized admin or offline sync cache
app.get('/api/sync-cache', (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    success: true,
    serverTime: new Date().toISOString(),
    teachers: db.teachers,
    classes: db.classes,
    logs: db.logs,
    settings: db.settings,
  });
});

// 2. Authentication: Teacher or Admin Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    return;
  }

  // Admin login check
  const cleanUser = username.trim().toLowerCase();
  const cleanPass = password.trim();
  if (
    (cleanUser === 'admin' && (cleanPass === 'admin' || cleanPass === 'admin123')) ||
    (cleanUser === 'مدير' && (cleanPass === 'admin' || cleanPass === '123'))
  ) {
    res.json({
      success: true,
      role: 'admin',
      user: {
        id: 'admin-1',
        name: 'إدارة المدرسة (المشرف العام)',
        username: 'admin',
        role: 'admin',
      },
    });
    return;
  }

  // Teacher/Admin User login check
  const db = readDb();
  const teacher = db.teachers.find(
    (t) =>
      t.username.trim().toLowerCase() === username.trim().toLowerCase() &&
      t.password.trim() === password.trim()
  );

  if (teacher) {
    // If user was created as admin/assistant principal (معاون / مدير)
    if (teacher.role === 'admin') {
      res.json({
        success: true,
        role: 'admin',
        user: {
          id: teacher.id,
          name: teacher.name,
          username: teacher.username,
          role: 'admin',
          jobTitle: teacher.jobTitle || 'إدارة المدرسة',
          subject: teacher.subject,
          phone: teacher.phone,
        },
      });
      return;
    }

    res.json({
      success: true,
      role: 'teacher',
      teacher: {
        id: teacher.id,
        name: teacher.name,
        username: teacher.username,
        role: 'teacher',
        jobTitle: teacher.jobTitle || 'مدرس مادة',
        subject: teacher.subject,
        phone: teacher.phone,
        isOnLeave: teacher.isOnLeave || false,
        leaveDate: teacher.leaveDate,
      },
    });
    return;
  }

  res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
});

// 3. Teachers CRUD
app.get('/api/teachers', (req: Request, res: Response) => {
  const db = readDb();
  res.json(db.teachers);
});

app.post('/api/teachers', (req: Request, res: Response) => {
  const { id, name, username, password, subject, phone, notes, role, jobTitle, isOnLeave } = req.body;
  if (!name || !username || !subject) {
    res.status(400).json({ error: 'يرجى ملء جميع الحقول الإلزامية (الاسم، اسم المستخدم، المادة)' });
    return;
  }

  const db = readDb();
  const existingIndex = db.teachers.findIndex(
    (t) => (id && t.id === id) || t.username.toLowerCase() === username.trim().toLowerCase()
  );

  const teacherRecord: Teacher = {
    id: id || `teacher-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    username: username.trim(),
    password: (password || '123').trim(),
    role: role === 'admin' ? 'admin' : 'teacher',
    jobTitle: jobTitle ? jobTitle.trim() : (role === 'admin' ? 'معاون / إدارة' : 'مدرس مادة'),
    subject: subject.trim(),
    phone: (phone || '').trim(),
    notes: (notes || '').trim(),
    isOnLeave: Boolean(isOnLeave),
    createdAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    db.teachers[existingIndex] = {
      ...db.teachers[existingIndex],
      ...teacherRecord,
    };
  } else {
    db.teachers.push(teacherRecord);
  }

  writeDb(db);
  res.json({ success: true, teacher: teacherRecord });
});

app.put('/api/teachers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, username, password, subject, phone, notes, role, jobTitle, isOnLeave, leaveDate } = req.body;
  const db = readDb();
  const index = db.teachers.findIndex((t) => t.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  // Check username collision with others
  if (username) {
    const existing = db.teachers.find((t) => t.username.toLowerCase() === username.toLowerCase() && t.id !== id);
    if (existing) {
      res.status(400).json({ error: 'اسم المستخدم مستخدم بالفعل' });
      return;
    }
  }

  db.teachers[index] = {
    ...db.teachers[index],
    name: name !== undefined ? name.trim() : db.teachers[index].name,
    username: username !== undefined ? username.trim() : db.teachers[index].username,
    password: password !== undefined ? password.trim() : db.teachers[index].password,
    role: role !== undefined ? role : db.teachers[index].role,
    jobTitle: jobTitle !== undefined ? jobTitle.trim() : db.teachers[index].jobTitle,
    subject: subject !== undefined ? subject.trim() : db.teachers[index].subject,
    phone: phone !== undefined ? phone.trim() : db.teachers[index].phone,
    notes: notes !== undefined ? notes.trim() : db.teachers[index].notes,
    isOnLeave: isOnLeave !== undefined ? Boolean(isOnLeave) : db.teachers[index].isOnLeave,
    leaveDate: leaveDate !== undefined ? leaveDate : db.teachers[index].leaveDate,
  };

  writeDb(db);
  res.json({ success: true, teacher: db.teachers[index] });
});

// Teacher Leave Toggle Route (Requested: "ضيفلي زر للمدرس مال اجازة من ايدوسه ايصير البرنامج مينطي لا تنبيه ولا صوت")
app.post('/api/teachers/:id/toggle-leave', (req: Request, res: Response) => {
  const { id } = req.params;
  const { isOnLeave } = req.body;
  const db = readDb();
  const index = db.teachers.findIndex((t) => t.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'المدرس غير موجود' });
    return;
  }

  const newState = isOnLeave !== undefined ? Boolean(isOnLeave) : !db.teachers[index].isOnLeave;
  db.teachers[index].isOnLeave = newState;
  db.teachers[index].leaveDate = newState ? new Date().toISOString() : undefined;

  writeDb(db);
  res.json({ success: true, teacher: db.teachers[index], isOnLeave: newState });
});

app.delete('/api/teachers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.teachers = db.teachers.filter((t) => t.id !== id);
  // Also remove their classes
  db.classes = db.classes.filter((c) => c.teacherId !== id);
  writeDb(db);
  res.json({ success: true });
});

// 4. Classes CRUD
app.get('/api/classes', (req: Request, res: Response) => {
  const { teacherId } = req.query;
  const db = readDb();
  if (teacherId) {
    res.json(db.classes.filter((c) => c.teacherId === teacherId));
    return;
  }
  res.json(db.classes);
});

app.post('/api/classes', (req: Request, res: Response) => {
  const { id, teacherId, dayOfWeek, subject, gradeAndSection, room, startTime, endTime, alertMinutesBefore } = req.body;
  if (!teacherId || dayOfWeek === undefined || !subject || !gradeAndSection || !startTime || !endTime) {
    res.status(400).json({ error: 'يرجى توفير تفاصيل الحصة كاملة' });
    return;
  }

  const db = readDb();
  const classId = id || `class-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newClass: ClassSchedule = {
    id: classId,
    teacherId,
    dayOfWeek: Number(dayOfWeek),
    subject: subject.trim(),
    gradeAndSection: gradeAndSection.trim(),
    room: (room || 'القاعة الدراسية').trim(),
    startTime: startTime.trim(),
    endTime: endTime.trim(),
    alertMinutesBefore: alertMinutesBefore ? Number(alertMinutesBefore) : 2,
    isActive: true,
  };

  const existingIndex = db.classes.findIndex((c) => c.id === classId);
  if (existingIndex >= 0) {
    db.classes[existingIndex] = newClass;
  } else {
    db.classes.push(newClass);
  }

  writeDb(db);
  res.json({ success: true, classItem: newClass });
});

app.put('/api/classes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.classes.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'الحصة غير موجودة' });
    return;
  }

  db.classes[index] = {
    ...db.classes[index],
    ...req.body,
    id, // protect id
  };
  writeDb(db);
  res.json({ success: true, classItem: db.classes[index] });
});

app.delete('/api/classes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = readDb();
  db.classes = db.classes.filter((c) => c.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// Quick action: Add instant test class for current teacher starting in 2 minutes (or custom client time)
app.post('/api/classes/create-quick-test', (req: Request, res: Response) => {
  const { teacherId, startTime, endTime, dayOfWeek, subject } = req.body;
  const db = readDb();
  const teacher = db.teachers.find((t) => t.id === teacherId) || db.teachers[0];

  const now = new Date();
  // If client provided local device time, use it! Otherwise fallback to server time + 2min
  let finalStartTime = startTime;
  let finalEndTime = endTime;
  let finalDayOfWeek = dayOfWeek !== undefined ? Number(dayOfWeek) : now.getDay();

  if (!finalStartTime || !finalEndTime) {
    const testDate = new Date(now.getTime() + 2 * 60 * 1000);
    const testHour = String(testDate.getHours()).padStart(2, '0');
    const testMin = String(testDate.getMinutes()).padStart(2, '0');
    const testEndHour = String(new Date(testDate.getTime() + 45 * 60 * 1000).getHours()).padStart(2, '0');
    const testEndMin = String(new Date(testDate.getTime() + 45 * 60 * 1000).getMinutes()).padStart(2, '0');
    finalStartTime = `${testHour}:${testMin}`;
    finalEndTime = `${testEndHour}:${testEndMin}`;
  }

  const newTestClass: ClassSchedule = {
    id: `test-${Date.now()}`,
    teacherId: teacher.id,
    dayOfWeek: finalDayOfWeek,
    subject: subject || `${teacher.subject} (تجربة جرس الحصة)`,
    gradeAndSection: 'الصف الرابع العلمي (أ)',
    room: 'المختبر الرئيسي',
    startTime: finalStartTime,
    endTime: finalEndTime,
    alertMinutesBefore: 2,
    isActive: true,
  };

  db.classes.unshift(newTestClass);
  writeDb(db);
  res.json({ success: true, classItem: newTestClass });
});

// 5. Acknowledgment Logs ("من ايدوس الغاء يجيني اشعار انو راح يتوجه للدرس")
app.get('/api/logs', (req: Request, res: Response) => {
  const db = readDb();
  // Return sorted newest first
  const sorted = [...db.logs].sort(
    (a, b) => new Date(b.acknowledgedAt).getTime() - new Date(a.acknowledgedAt).getTime()
  );
  res.json(sorted);
});

app.post('/api/logs/acknowledge', (req: Request, res: Response) => {
  const { teacherId, classId, scheduledDate, note, syncedFromOffline } = req.body;
  const db = readDb();

  const teacher = db.teachers.find((t) => t.id === teacherId);
  const classItem = db.classes.find((c) => c.id === classId);

  const newLog: AttendanceLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    teacherId: teacherId || 'unknown',
    teacherName: teacher ? teacher.name : 'مدرس غير محدد',
    classId: classId || 'unknown',
    subject: classItem ? classItem.subject : (req.body.subject || 'مادة دراسية'),
    gradeAndSection: classItem ? classItem.gradeAndSection : (req.body.gradeAndSection || ''),
    room: classItem ? classItem.room : (req.body.room || ''),
    classStartTime: classItem ? classItem.startTime : (req.body.classStartTime || ''),
    acknowledgedAt: req.body.acknowledgedAt || new Date().toISOString(),
    scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
    status: 'heading_to_class',
    note: note || 'تم إلغاء التنبيه وتأكيد التوجه للصف في الموعد',
    syncedFromOffline: Boolean(syncedFromOffline),
  };

  db.logs.unshift(newLog);
  writeDb(db);
  res.json({ success: true, log: newLog });
});

// Batch sync endpoint for offline logs that accumulated while device had no internet
app.post('/api/logs/sync-batch', (req: Request, res: Response) => {
  const { logs } = req.body;
  if (!Array.isArray(logs) || logs.length === 0) {
    res.json({ success: true, count: 0 });
    return;
  }

  const db = readDb();
  let count = 0;
  for (const logItem of logs) {
    // Avoid exact duplicate IDs
    if (!db.logs.some((l) => l.id === logItem.id)) {
      db.logs.unshift({
        ...logItem,
        syncedFromOffline: true,
      });
      count++;
    }
  }

  if (count > 0) {
    writeDb(db);
  }
  res.json({ success: true, syncedCount: count });
});

// Settings update
app.post('/api/settings', (req: Request, res: Response) => {
  const db = readDb();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

// Dynamic PWA Manifest (Serves updated School Name and School Logo on Install)
app.get(['/manifest.webmanifest', '/manifest.json'], (req: Request, res: Response) => {
  const db = readDb();
  const name = db.settings.schoolName || 'نظام جرس الحصص الذكي';
  const shortName = name.length > 15 ? name.substring(0, 15) : name;
  const logo = db.settings.schoolLogo;

  const manifest = {
    id: '/',
    name: name,
    short_name: shortName,
    description: `تطبيق إدارة جدول الحصص وجرس التنبيه الذكي - ${name}`,
    theme_color: '#1e3a8a',
    background_color: '#0f172a',
    display: 'standalone',
    start_url: '/',
    scope: '/',
    lang: 'ar',
    dir: 'rtl',
    icons: logo
      ? [
          {
            src: logo,
            sizes: '192x192',
            type: logo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
            purpose: 'any',
          },
          {
            src: logo,
            sizes: '512x512',
            type: logo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
            purpose: 'any maskable',
          },
        ]
      : [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'no-cache');
  res.json(manifest);
});

// Import or restore full database
app.post('/api/database/import', (req: Request, res: Response) => {
  const { teachers, classes, logs, settings } = req.body;
  const db = readDb();
  if (teachers && Array.isArray(teachers)) db.teachers = teachers;
  if (classes && Array.isArray(classes)) db.classes = classes;
  if (logs && Array.isArray(logs)) db.logs = logs;
  if (settings && typeof settings === 'object') db.settings = { ...db.settings, ...settings };
  writeDb(db);
  res.json({ success: true, message: 'تم استيراد وتحديث قاعدة البيانات بنجاح', db });
});

// Reset to default sample school database or write provided snapshot
app.post('/api/reset-demo', (req: Request, res: Response) => {
  const { teachers, classes, logs, settings } = req.body || {};
  if (teachers || classes) {
    const db = readDb();
    if (teachers && Array.isArray(teachers)) db.teachers = teachers;
    if (classes && Array.isArray(classes)) db.classes = classes;
    if (logs && Array.isArray(logs)) db.logs = logs;
    if (settings && typeof settings === 'object') db.settings = { ...db.settings, ...settings };
    writeDb(db);
    res.json({ success: true, message: 'تم استيراد قاعدة البيانات بنجاح' });
    return;
  }
  const initial = getDefaultData();
  writeDb(initial);
  res.json({ success: true, message: 'تم استعادة البيانات التجريبية بنجاح' });
});

// Start Server with Vite Dev Server mounted or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
