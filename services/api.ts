import { supabase } from './supabase';
import { Role, User, Attendance, NewsItem, AppSettings, Course } from '../types';

// Tipos de base de datos (con snake_case)
interface DbUser {
  id: number;
  name: string;
  document: string;
  role: string;
  course: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface DbAttendance {
  id: number;
  student_id: number;
  course_id: number;
  date: string;
  status: 'absent' | 'justified' | 'late';
  certificate_url: string | null;
  certificate_status: 'pending' | 'approved' | 'rejected' | null;
  verified_by: number | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface DbNews {
  id: number;
  title: string;
  content: string;
  author_id: number;
  created_at: string;
  updated_at: string;
}

interface DbCourse {
  id: number;
  name: string;
  subject: string;
  classroom: string | null;
  schedule: number | null;
  max_absences: number;
  icon_url: string | null;
  created_at: string;
  updated_at: string;
}

// Funciones de conversión
const dbUserToUser = (dbUser: DbUser): User => ({
  id: dbUser.id,
  name: dbUser.name,
  document: dbUser.document,
  role: dbUser.role as Role,
  course: dbUser.course || undefined,
  avatarUrl: dbUser.avatar_url || undefined,
});

const dbAttendanceToAttendance = (dbAttendance: DbAttendance): Attendance => ({
  id: dbAttendance.id,
  studentId: dbAttendance.student_id,
  date: dbAttendance.date,
  status: dbAttendance.status === 'justified' ? 'justified' : dbAttendance.status === 'late' ? 'late' : 'absent',
  courseId: dbAttendance.course_id,
  certificateUrl: dbAttendance.certificate_url || undefined,
  certificateStatus: dbAttendance.certificate_status || undefined,
  verifiedBy: dbAttendance.verified_by || undefined,
  verifiedAt: dbAttendance.verified_at || undefined,
  rejectionReason: dbAttendance.rejection_reason || undefined,
});

const dbNewsToNewsItem = async (dbNews: DbNews): Promise<NewsItem> => {
  const { data: author } = await supabase
    .from('users')
    .select('name')
    .eq('id', dbNews.author_id)
    .single();

  return {
    id: dbNews.id,
    title: dbNews.title,
    content: dbNews.content,
    author: author?.name || 'Desconocido',
    date: dbNews.created_at,
  };
};

const dbCourseToCourse = async (dbCourse: DbCourse): Promise<Course> => {
  const { data: studentCourses } = await supabase
    .from('student_courses')
    .select('student_id')
    .eq('course_id', dbCourse.id);

  return {
    id: dbCourse.id,
    name: dbCourse.name,
    subject: dbCourse.subject,
    classroom: dbCourse.classroom || '',
    schedule: dbCourse.schedule || 0,
    students: studentCourses?.map(sc => sc.student_id) || [],
    iconUrl: dbCourse.icon_url || '/vite.svg',
    maxAbsences: dbCourse.max_absences,
  };
};

// API Functions
export const api = {
  getUserByDocument: async (document: string): Promise<User | undefined> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('document', document)
      .single();

    if (error || !data) return undefined;
    return dbUserToUser(data as DbUser);
  },

  getStudents: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'Student');

    if (error || !data) return [];
    return data.map(dbUserToUser);
  },

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error || !data) return [];
    return data.map(dbUserToUser);
  },

  addUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: user.name,
        document: user.document,
        role: user.role,
        course: user.course || null,
        avatar_url: user.avatarUrl || null,
      })
      .select()
      .single();

    if (error) throw error;
    return dbUserToUser(data as DbUser);
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({
        name: updatedUser.name,
        document: updatedUser.document,
        role: updatedUser.role,
        course: updatedUser.course || null,
        avatar_url: updatedUser.avatarUrl || null,
      })
      .eq('id', updatedUser.id)
      .select()
      .single();

    if (error) throw error;
    return dbUserToUser(data as DbUser);
  },

  deleteUser: async (userId: number): Promise<{ id: number }> => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return { id: userId };
  },

  getAttendanceForStudent: async (studentId: number): Promise<Attendance[]> => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(dbAttendanceToAttendance);
  },

  getAttendanceForDate: async (date: string): Promise<Attendance[]> => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date);

    if (error || !data) return [];
    return data.map(dbAttendanceToAttendance);
  },

  setStudentAttendance: async (
    studentId: number,
    date: string,
    status: 'present' | 'absent' | 'late',
    courseId?: number
  ): Promise<Attendance[]> => {
    // Si es 'present', eliminamos cualquier registro existente
    if (status === 'present') {
      if (courseId) {
        const { error } = await supabase
          .from('attendance')
          .delete()
          .eq('student_id', studentId)
          .eq('date', date)
          .eq('course_id', courseId);
        if (error) throw error;
        return [{ studentId, date, status: 'present', courseId }];
      } else {
        // Si no se especifica courseId, eliminamos de todos los cursos del estudiante
        const { data: studentCourses } = await supabase
          .from('student_courses')
          .select('course_id')
          .eq('student_id', studentId);

        if (studentCourses) {
          for (const sc of studentCourses) {
            await supabase
              .from('attendance')
              .delete()
              .eq('student_id', studentId)
              .eq('date', date)
              .eq('course_id', sc.course_id);
          }
        }
        return [];
      }
    }

    // Para 'absent' o 'late', creamos o actualizamos el registro
    const attendanceStatus = status === 'late' ? 'late' : 'absent';

    if (courseId) {
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          course_id: courseId,
          date,
          status: attendanceStatus,
        }, {
          onConflict: 'student_id,course_id,date',
        })
        .select()
        .single();

      if (error) throw error;
      return [dbAttendanceToAttendance(data as DbAttendance)];
    } else {
      // Si no se especifica courseId, aplicamos a todos los cursos del estudiante
      const { data: studentCourses } = await supabase
        .from('student_courses')
        .select('course_id')
        .eq('student_id', studentId);

      if (!studentCourses || studentCourses.length === 0) return [];

      const results: Attendance[] = [];
      for (const sc of studentCourses) {
        const { data, error } = await supabase
          .from('attendance')
          .upsert({
            student_id: studentId,
            course_id: sc.course_id,
            date,
            status: attendanceStatus,
          }, {
            onConflict: 'student_id,course_id,date',
          })
          .select()
          .single();

        if (error) throw error;
        if (data) results.push(dbAttendanceToAttendance(data as DbAttendance));
      }
      return results;
    }
  },

  getNews: async (): Promise<NewsItem[]> => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return Promise.all(data.map(dbNewsToNewsItem));
  },

  addNews: async (item: Omit<NewsItem, 'id'>): Promise<NewsItem> => {
    // Necesitamos obtener el author_id del nombre del autor
    const { data: author } = await supabase
      .from('users')
      .select('id')
      .eq('name', item.author)
      .single();

    if (!author) throw new Error('Autor no encontrado');

    const { data, error } = await supabase
      .from('news')
      .insert({
        title: item.title,
        content: item.content,
        author_id: author.id,
      })
      .select()
      .single();

    if (error) throw error;
    return dbNewsToNewsItem(data as DbNews);
  },

  updateNews: async (updatedItem: NewsItem): Promise<NewsItem> => {
    const { data: author } = await supabase
      .from('users')
      .select('id')
      .eq('name', updatedItem.author)
      .single();

    if (!author) throw new Error('Autor no encontrado');

    const { data, error } = await supabase
      .from('news')
      .update({
        title: updatedItem.title,
        content: updatedItem.content,
        author_id: author.id,
      })
      .eq('id', updatedItem.id)
      .select()
      .single();

    if (error) throw error;
    return dbNewsToNewsItem(data as DbNews);
  },

  deleteNews: async (itemId: number): Promise<{ id: number }> => {
    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', itemId);

    if (error) throw error;
    return { id: itemId };
  },

  getSettings: async (): Promise<AppSettings> => {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error || !data) return {};

    const settings: AppSettings = {};
    data.forEach(setting => {
      if (setting.value) {
        Object.assign(settings, setting.value);
      }
    });
    return settings;
  },

  updateSettings: async (newSettings: AppSettings): Promise<AppSettings> => {
    // Guardamos las configuraciones como un objeto JSON en una sola fila
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: 'app_settings',
        value: newSettings,
      }, {
        onConflict: 'key',
      });

    if (error) throw error;
    return newSettings;
  },

  // --- COURSE MANAGEMENT API FUNCTIONS ---
  getAllCourses: async (): Promise<Course[]> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('name');

    if (error || !data) return [];
    return Promise.all(data.map(dbCourseToCourse));
  },

  addCourse: async (course: Omit<Course, 'id' | 'iconUrl'>): Promise<Course> => {
    const { data, error } = await supabase
      .from('courses')
      .insert({
        name: course.name,
        subject: course.subject,
        classroom: course.classroom,
        schedule: course.schedule,
        max_absences: course.maxAbsences,
        icon_url: '/vite.svg',
      })
      .select()
      .single();

    if (error) throw error;

    // Agregar estudiantes al curso
    if (course.students.length > 0) {
      const studentCourses = course.students.map(studentId => ({
        student_id: studentId,
        course_id: data.id,
      }));

      await supabase.from('student_courses').insert(studentCourses);
    }

    return dbCourseToCourse(data as DbCourse);
  },

  updateCourse: async (updatedCourse: Course): Promise<Course> => {
    const { data, error } = await supabase
      .from('courses')
      .update({
        name: updatedCourse.name,
        subject: updatedCourse.subject,
        classroom: updatedCourse.classroom,
        schedule: updatedCourse.schedule,
        max_absences: updatedCourse.maxAbsences,
        icon_url: updatedCourse.iconUrl || '/vite.svg',
      })
      .eq('id', updatedCourse.id)
      .select()
      .single();

    if (error) throw error;

    // Actualizar estudiantes del curso
    // Primero eliminamos todas las relaciones
    await supabase
      .from('student_courses')
      .delete()
      .eq('course_id', updatedCourse.id);

    // Luego agregamos las nuevas
    if (updatedCourse.students.length > 0) {
      const studentCourses = updatedCourse.students.map(studentId => ({
        student_id: studentId,
        course_id: updatedCourse.id,
      }));

      await supabase.from('student_courses').insert(studentCourses);
    }

    return dbCourseToCourse(data as DbCourse);
  },

  deleteCourse: async (courseId: number): Promise<{ id: number }> => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;
    return { id: courseId };
  },

  getCoursesForStudent: async (studentId: number): Promise<Course[]> => {
    const { data: studentCourses, error } = await supabase
      .from('student_courses')
      .select('course_id')
      .eq('student_id', studentId);

    if (error || !studentCourses || studentCourses.length === 0) return [];

    const courseIds = studentCourses.map(sc => sc.course_id);
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds);

    if (coursesError || !courses) return [];
    return Promise.all(courses.map(dbCourseToCourse));
  },

  getCourseById: async (courseId: number): Promise<Course | undefined> => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error || !data) return undefined;
    return dbCourseToCourse(data as DbCourse);
  },

  getAttendanceSummaryForAllStudents: async (): Promise<{ studentId: number; name: string; course: string | undefined; absenceCount: number }[]> => {
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, name, course')
      .eq('role', 'Student');

    if (studentsError || !students) return [];

    const summaries = await Promise.all(
      students.map(async (student) => {
        // Contar faltas (absent)
        const { count: absentCount, error: absentError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', student.id)
          .eq('status', 'absent');

        // Contar tardes (late) - cada una cuenta como 0.5
        const { count: lateCount, error: lateError } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', student.id)
          .eq('status', 'late');

        const absences = absentError ? 0 : (absentCount || 0);
        const lates = lateError ? 0 : (lateCount || 0);
        // Tardes cuentan como media falta
        const totalAbsences = absences + (lates * 0.5);

        return {
          studentId: student.id,
          name: student.name,
          course: student.course || undefined,
          absenceCount: totalAbsences,
        };
      })
    );

    return summaries;
  },

  getAllCourseGroups: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('course')
      .eq('role', 'Student')
      .not('course', 'is', null);

    if (error || !data) return [];

    const courseGroups = new Set(data.map(u => u.course).filter(Boolean) as string[]);
    return Array.from(courseGroups).sort();
  },

  getAllSubjectNames: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('courses')
      .select('subject');

    if (error || !data) return [];

    const subjectNames = new Set(data.map(c => c.subject));
    return Array.from(subjectNames).sort();
  },

  // --- CERTIFICATE MANAGEMENT FUNCTIONS ---
  uploadCertificate: async (attendanceId: number, file: File): Promise<string> => {
    // Crear nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${attendanceId}_${Date.now()}.${fileExt}`;
    const filePath = `certificates/${fileName}`;

    // Subir archivo a Supabase Storage
    const { data, error } = await supabase.storage
      .from('certificates')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) throw new Error('No se pudo obtener la URL del archivo');

    // Actualizar el registro de asistencia con la URL del certificado
    const { error: updateError } = await supabase
      .from('attendance')
      .update({
        certificate_url: urlData.publicUrl,
        certificate_status: 'pending'
      })
      .eq('id', attendanceId);

    if (updateError) throw updateError;

    return urlData.publicUrl;
  },

  getPendingCertificates: async (): Promise<Attendance[]> => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('certificate_status', 'pending')
      .not('certificate_url', 'is', null)
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(dbAttendanceToAttendance);
  },

  approveCertificate: async (attendanceId: number, verifiedBy: number): Promise<void> => {
    const { error } = await supabase
      .from('attendance')
      .update({
        certificate_status: 'approved',
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        status: 'justified' // Cambiar el status a justified cuando se aprueba
      })
      .eq('id', attendanceId);

    if (error) throw error;
  },

  rejectCertificate: async (attendanceId: number, verifiedBy: number, reason: string): Promise<void> => {
    const { error } = await supabase
      .from('attendance')
      .update({
        certificate_status: 'rejected',
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', attendanceId);

    if (error) throw error;
  },

  getAttendanceWithCertificates: async (studentId: number): Promise<Attendance[]> => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .in('status', ['absent', 'late'])
      .order('date', { ascending: false });

    if (error || !data) return [];
    return data.map(dbAttendanceToAttendance);
  },
};

