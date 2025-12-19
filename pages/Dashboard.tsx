import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AttendanceCircle } from '../components/AttendanceCircle';
import { api } from '../services/api';
import { Attendance, NewsItem, Role, Course, User } from '../types';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { Link, Navigate } from 'react-router-dom';
import { Reports as AttendanceReports } from '../components/AttendanceReport';

const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            Promise.all([
                api.getAttendanceForStudent(user.id),
                api.getCoursesForStudent(user.id)
            ]).then(([attendanceData, coursesData]) => {
                setAttendance(attendanceData);
                setCourses(coursesData);
                setLoading(false);
            });
        }
    }, [user]);

    if (loading || !user) {
        return <div className="text-center p-8">Cargando datos del alumno...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                     <CardTitle>Mi Resumen de Asistencia</CardTitle>
                     <p className="text-sm text-gray-400 mt-1 sm:mt-0">{user.name} - {user.course}</p>
                </div>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => {
                    const courseAbsences = attendance.filter(a => a.courseId === course.id && a.status === 'absent').length;
                    const courseJustified = attendance.filter(a => a.courseId === course.id && a.status === 'justified').length;
                    const courseLates = attendance.filter(a => a.courseId === course.id && a.status === 'late').length;

                    return (
                        <div key={course.id} className="bg-gray-700 p-4 rounded-lg flex flex-col items-center">
                            <h3 className="text-lg font-bold text-white mb-2">{course.name}</h3>
                             <AttendanceCircle absences={courseAbsences} maxAbsences={course.maxAbsences} />
                            <p className="mt-2 text-gray-400 text-sm">Límite: {course.maxAbsences} faltas</p>
                            <div className="text-xs mt-3 text-center text-gray-300">
                                <p>Justificadas: {courseJustified}</p>
                                <p>Tardes: {courseLates}</p>
                            </div>
                        </div>
                    );
                })}
                 {courses.length === 0 && <p className="text-gray-400 col-span-full text-center">No estás inscripto en ningún curso.</p>}
            </div>
        </Card>
    );
};


const PreceptorDashboard: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  
  useEffect(() => {
      api.getNews().then(data => setNews(data.slice(0, 3)));
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
            <Card>
                 <CardHeader className="flex justify-between items-center">
                     <CardTitle>Acciones Rápidas</CardTitle>
                 </CardHeader>
                 <div className="flex flex-col gap-4">
                     <Link to="/asistencia" className="block text-center w-full px-4 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition duration-300">
                        Tomar Asistencia
                     </Link>
                     <Link to="/novedades" className="block text-center w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition duration-300">
                        Gestionar Novedades
                     </Link>
                 </div>
            </Card>
            <AttendanceReports />
        </div>
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Últimas Novedades</CardTitle>
                <Link to="/novedades" className="text-sm text-primary-400 hover:underline">Ver todas</Link>
            </CardHeader>
            <ul className="space-y-4">
                {news.map(item => (
                    <li key={item.id} className="p-3 bg-gray-700 rounded-lg">
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-xs text-gray-400">Por {item.author} - {new Date(item.date).toLocaleDateString()}</p>
                    </li>
                ))}
            </ul>
        </Card>
    </div>
  )
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case Role.Student:
        return <StudentDashboard />;
      case Role.Preceptor:
        return <PreceptorDashboard />;
      case Role.Admin:
        return <Navigate to="/admin" replace />;
      default:
        return <div>Rol no reconocido.</div>;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Panel de Control</h1>
      {renderDashboard()}
    </div>
  );
};
