import { Role, User, Attendance, NewsItem, AppSettings, Course } from '../types';

// --- MOCK DATABASE ---

let users: User[] = [
  { id: 1, name: 'Admin User', document: '111', role: Role.Admin },
  { id: 2, name: 'Lucía Gómez (Preceptora)', document: '222', role: Role.Preceptor },
  { id: 3, name: 'Martina Rodríguez', document: '101', role: Role.Student, course: '5to Año A (Programación)', avatarUrl: `https://i.pravatar.cc/150?img=1` },
  { id: 4, name: 'Juan Pérez', document: '102', role: Role.Student, course: '5to Año A (Programación)', avatarUrl: `https://i.pravatar.cc/150?img=2` },
  { id: 5, name: 'Sofía López', document: '103', role: Role.Student, course: '5to Año B (General)', avatarUrl: `https://i.pravatar.cc/150?img=3` },
  { id: 6, name: 'Mateo González', document: '104', role: Role.Student, course: '5to Año B (General)', avatarUrl: `https://i.pravatar.cc/150?img=4` },
  { id: 8, name: 'Valentina Torres', document: '105', role: Role.Student, course: '5to Año A (Programación)', avatarUrl: `https://i.pravatar.cc/150?img=6` },
  { id: 9, name: 'Bautista Martinez', document: '106', role: Role.Student, course: '5to Año A (Programación)', avatarUrl: `https://i.pravatar.cc/150?img=7` },
  { id: 10, name: 'Camila Diaz', document: '107', role: Role.Student, course: '5to Año A (Programación)', avatarUrl: `https://i.pravatar.cc/150?img=8` },
  { id: 11, name: 'Thiago Sanchez', document: '108', role: Role.Student, course: '5to Año B (General)', avatarUrl: `https://i.pravatar.cc/150?img=9` },
  { id: 12, name: 'Isabella Romero', document: '109', role: Role.Student, course: '5to Año B (General)', avatarUrl: `https://i.pravatar.cc/150?img=10` },
  { id: 13, name: 'Benjamín Acosta', document: '110', role: Role.Student, course: '5to Año B (General)', avatarUrl: `https://i.pravatar.cc/150?img=11` },
];

let attendance: Attendance[] = [
  { studentId: 3, date: '2024-08-01', status: 'absent', courseId: 101 }, // Martina, Redes
  { studentId: 5, date: '2024-08-01', status: 'absent', courseId: 102 }, // Sofia, DB
  { studentId: 3, date: '2024-08-05', status: 'absent', courseId: 101 }, // Martina, Redes
  { studentId: 4, date: '2024-08-02', status: 'late', courseId: 101 },  // Juan, Redes
  { studentId: 6, date: '2024-08-05', status: 'absent', courseId: 102 }, // Mateo, DB
];

let news: NewsItem[] = [
  { id: 1, title: 'Suspensión de clases Ed. Física', content: 'Se suspenden las clases de Educación Física del día 10/08 por mal tiempo para 5to Año A y B.', author: 'Lucía Gómez (Preceptora)', date: new Date().toISOString() },
  { id: 2, title: 'Acto 17 de Agosto', content: 'El acto en conmemoración del Gral. San Martín se realizará en el SUM a las 10:00. Asistencia obligatoria.', author: 'Admin User', date: new Date(Date.now() - 86400000).toISOString() },
];

let settings: AppSettings = {};

// --- TEACHER MODULE MOCK DATA ---
let courses: Course[] = [
    { id: 101, name: 'Redes de Datos - 5to A', subject: 'Redes de Datos', classroom: 'Lab. de Redes', schedule: 3, students: [3, 4, 8, 9, 10], iconUrl: '/vite.svg', maxAbsences: 20 },
    { id: 102, name: 'Bases de Datos - 5to B', subject: 'Bases de Datos', classroom: 'Aula 5B', schedule: 3, students: [5, 6, 11, 12, 13], iconUrl: '/vite.svg', maxAbsences: 15 },
    { id: 103, name: 'Análisis Matemático - 5to B', subject: 'Análisis matemático', classroom: 'Aula 5B', schedule: 2, students: [5, 6, 11, 12, 13], iconUrl: '/vite.svg', maxAbsences: 18 },
];

const simulateDelay = <T,>(data: T): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(JSON.parse(JSON.stringify(data))), 500));


// --- API FUNCTIONS ---

export const api = {
  getUserByDocument: (document: string): Promise<User | undefined> => {
    const user = users.find(u => u.document === document);
    return simulateDelay(user);
  },

  getStudents: (): Promise<User[]> => {
    return simulateDelay(users.filter(u => u.role === Role.Student));
  },
  
  getUsers: (): Promise<User[]> => {
      return simulateDelay(users);
  },

  addUser: (user: Omit<User, 'id'>): Promise<User> => {
    const newUser = { ...user, id: Date.now() };
    users.push(newUser);
    return simulateDelay(newUser);
  },

  updateUser: (updatedUser: User): Promise<User> => {
    users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    return simulateDelay(updatedUser);
  },

  deleteUser: (userId: number): Promise<{ id: number }> => {
    users = users.filter(u => u.id !== userId);
    return simulateDelay({ id: userId });
  },

  getAttendanceForStudent: (studentId: number): Promise<Attendance[]> => {
    return simulateDelay(attendance.filter(a => a.studentId === studentId));
  },
  
  getAttendanceForDate: (date: string): Promise<Attendance[]> => {
    return simulateDelay(attendance.filter(a => a.date === date));
  },
  
  setStudentAttendance: (studentId: number, date: string, status: 'present' | 'absent' | 'late', courseId?: number): Promise<Attendance[]> => {
    const studentCourses = courseId ? [courseId] : courses.filter(c => c.students.includes(studentId)).map(c => c.id);
    const results: Attendance[] = [];

    studentCourses.forEach(cId => {
      // Remove existing record for that student, date, and course
      attendance = attendance.filter(a => !(a.studentId === studentId && a.date === date && a.courseId === cId));
      
      if (status !== 'present') {
          const newRecord: Attendance = { studentId, date, status, courseId: cId };
          attendance.push(newRecord);
          results.push(newRecord);
      } else {
          // 'present' is the absence of a record, but we can return a virtual one for confirmation
          results.push({ studentId, date, status: 'present', courseId: cId });
      }
    });

    return simulateDelay(results);
  },

  getNews: (): Promise<NewsItem[]> => {
    return simulateDelay(news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  },

  addNews: (item: Omit<NewsItem, 'id'>): Promise<NewsItem> => {
    const newItem = { ...item, id: Date.now() };
    news.unshift(newItem);
    return simulateDelay(newItem);
  },

  updateNews: (updatedItem: NewsItem): Promise<NewsItem> => {
    news = news.map(n => n.id === updatedItem.id ? updatedItem : n);
    return simulateDelay(updatedItem);
  },

  deleteNews: (itemId: number): Promise<{ id: number }> => {
    news = news.filter(n => n.id !== itemId);
    return simulateDelay({ id: itemId });
  },
  
  getSettings: (): Promise<AppSettings> => {
      return simulateDelay(settings);
  },
  
  updateSettings: (newSettings: AppSettings): Promise<AppSettings> => {
      settings = newSettings;
      return simulateDelay(settings);
  },

  // --- COURSE MANAGEMENT API FUNCTIONS ---
  getAllCourses: (): Promise<Course[]> => {
      return simulateDelay(courses);
  },

  addCourse: (course: Omit<Course, 'id' | 'iconUrl'>): Promise<Course> => {
      const newCourse: Course = {
          ...course,
          id: (courses.length > 0 ? Math.max(...courses.map(c => c.id)) : 200) + 1,
          iconUrl: '/vite.svg'
      };
      courses.push(newCourse);
      return simulateDelay(newCourse);
  },

  updateCourse: (updatedCourse: Course): Promise<Course> => {
      courses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
      return simulateDelay(updatedCourse);
  },

  deleteCourse: (courseId: number): Promise<{ id: number }> => {
      courses = courses.filter(c => c.id !== courseId);
      // Also remove related data to maintain integrity
      attendance = attendance.filter(a => a.courseId !== courseId);
      return simulateDelay({ id: courseId });
  },
  
  getCoursesForStudent: (studentId: number): Promise<Course[]> => {
      return simulateDelay(courses.filter(c => c.students.includes(studentId)));
  },

  getCourseById: (courseId: number): Promise<Course | undefined> => {
      return simulateDelay(courses.find(c => c.id === courseId));
  },

  getAttendanceSummaryForAllStudents: (): Promise<{ studentId: number; name: string; course: string | undefined; absenceCount: number }[]> => {
    const summary = users
      .filter(u => u.role === Role.Student)
      .map(student => {
        const absenceCount = attendance.filter(a => a.studentId === student.id && a.status === 'absent').length;
        return {
          studentId: student.id,
          name: student.name,
          course: student.course,
          absenceCount: absenceCount,
        };
      });
    return simulateDelay(summary);
  },

  getAllCourseGroups: (): Promise<string[]> => {
    const courseGroups = new Set(users.map(u => u.course).filter(Boolean) as string[]);
    return simulateDelay(Array.from(courseGroups).sort());
  },
  
  getAllSubjectNames: (): Promise<string[]> => {
      const subjectNames = new Set(courses.map(c => c.subject));
      return simulateDelay(Array.from(subjectNames).sort());
  },
};