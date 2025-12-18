import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/mockApi';
import { User } from '../types';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { useNotification } from '../contexts/NotificationContext';

export const AttendancePage: React.FC = () => {
  const [students, setStudents] = useState<User[]>([]);
  const [initialRecords, setInitialRecords] = useState<Map<number, 'present' | 'absent'>>(new Map());
  const [attendanceRecords, setAttendanceRecords] = useState<Map<number, 'present' | 'absent'>>(new Map());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [courses, setCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotification();

  // Effect 1: Fetch students and courses once on mount
  useEffect(() => {
    api.getStudents().then(studentsData => {
      setStudents(studentsData);
      const courseSet = new Set(studentsData.map(s => s.course).filter(Boolean) as string[]);
      const dynamicCourses = Array.from(courseSet).sort();
      setCourses(dynamicCourses);
      if (dynamicCourses.length > 0) {
        setSelectedCourse(dynamicCourses[0]);
      }
    });
  }, []);

  // Effect 2: Fetch attendance records when date or course selection changes.
  useEffect(() => {
    if (!selectedCourse || students.length === 0) {
      return; // Wait for initial data to be loaded.
    }
    
    setLoading(true);
    // Note: This fetches all attendance for a day. We assume a student marked absent by a preceptor
    // is absent from all classes. The UI shows a single status per student for the day.
    api.getAttendanceForDate(selectedDate).then(attendanceData => {
      const recordsMap = new Map<number, 'present' | 'absent'>();
      // We only care about students in the selected course/group
      const relevantStudents = students.filter(s => s.course === selectedCourse);
      relevantStudents.forEach(student => {
        // If there's at least one absence record for this student on this day, mark them absent.
        const hasAbsence = attendanceData.some(a => a.studentId === student.id && a.status !== 'present');
        recordsMap.set(student.id, hasAbsence ? 'absent' : 'present');
      });
      setAttendanceRecords(recordsMap);
      setInitialRecords(new Map(recordsMap));
      setLoading(false);
    });
    
  }, [selectedDate, selectedCourse, students]);


  const handleStatusChange = (studentId: number, status: 'present' | 'absent') => {
    const newRecords = new Map(attendanceRecords);
    newRecords.set(studentId, status);
    setAttendanceRecords(newRecords);
  };
  
  const isDirty = useMemo(() => {
    if (initialRecords.size !== attendanceRecords.size) return true;
    for (const [key, value] of initialRecords) {
      if (attendanceRecords.get(key) !== value) {
        return true;
      }
    }
    return false;
  }, [initialRecords, attendanceRecords]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const changes: Promise<any>[] = [];
    attendanceRecords.forEach((status, studentId) => {
        if(initialRecords.get(studentId) !== status) {
            // By not passing a courseId, the API will mark the student absent/present for all their courses.
            changes.push(api.setStudentAttendance(studentId, selectedDate, status));
        }
    });

    try {
        if (changes.length > 0) {
            await Promise.all(changes);
            setInitialRecords(new Map(attendanceRecords)); // Update baseline after save
            addNotification('Asistencia guardada correctamente.', 'success');
        } else {
            addNotification('No hay cambios para guardar.', 'info');
        }
    } catch(err) {
        console.error("Failed to save attendance", err);
        addNotification('Error al guardar la asistencia.', 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => s.course === selectedCourse);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <CardTitle>Tomar Asistencia (Diaria)</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500 w-full sm:w-auto"
            >
                {courses.map(course => <option key={course} value={course}>{course}</option>)}
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-primary-500 focus:border-primary-500 w-full sm:w-auto"
            />
          </div>
        </div>
      </CardHeader>
      
      {loading ? (
        <div className="text-center py-8">Cargando alumnos...</div>
      ) : (
        <>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Alumno
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Asistencia del Día
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => handleStatusChange(student.id, 'present')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          attendanceRecords.get(student.id) === 'present'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        Presente
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'absent')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          attendanceRecords.get(student.id) === 'absent'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        Ausente
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
            <button
                onClick={handleSaveChanges}
                disabled={!isDirty || isSaving}
                className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </div>
        </>
      )}
    </Card>
  );
};