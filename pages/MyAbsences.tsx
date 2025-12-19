import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Attendance, Course } from '../types';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { useNotification } from '../contexts/NotificationContext';

export const MyAbsencesPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [absences, setAbsences] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.getAttendanceWithCertificates(user.id),
        api.getCoursesForStudent(user.id)
      ]).then(([absencesData, coursesData]) => {
        setAbsences(absencesData);
        setCourses(coursesData);
        setLoading(false);
      });
    }
  }, [user]);

  const getCourseName = (courseId: number): string => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || 'Curso desconocido';
  };

  const getStatusBadge = (absence: Attendance) => {
    if (absence.certificateStatus === 'approved') {
      return <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">Aprobado</span>;
    }
    if (absence.certificateStatus === 'rejected') {
      return <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">Rechazado</span>;
    }
    if (absence.certificateStatus === 'pending') {
      return <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">Pendiente</span>;
    }
    return <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">Sin certificado</span>;
  };

  const handleFileUpload = async (absence: Attendance, file: File) => {
    if (!absence.id) {
      addNotification('Error: ID de asistencia no encontrado', 'error');
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      addNotification('Formato no válido. Solo se permiten imágenes (JPG, PNG) o PDF', 'error');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification('El archivo es demasiado grande. Máximo 5MB', 'error');
      return;
    }

    setUploading(absence.id);
    try {
      await api.uploadCertificate(absence.id, file);
      addNotification('Certificado subido correctamente. Pendiente de verificación.', 'success');
      // Recargar datos
      const updatedAbsences = await api.getAttendanceWithCertificates(user!.id);
      setAbsences(updatedAbsences);
    } catch (error) {
      console.error('Error al subir certificado:', error);
      addNotification('Error al subir el certificado. Intenta nuevamente.', 'error');
    } finally {
      setUploading(null);
    }
  };

  if (loading || !user) {
    return <div className="text-center p-8">Cargando inasistencias...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Inasistencias</CardTitle>
        <p className="text-sm text-gray-400 mt-2">
          Haz clic en una inasistencia para subir un certificado médico o justificativo
        </p>
      </CardHeader>
      
      {absences.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No tienes inasistencias registradas.
        </div>
      ) : (
        <div className="space-y-4">
          {absences.map((absence) => (
            <div
              key={absence.id}
              className="bg-gray-700 p-4 rounded-lg border border-gray-600 hover:border-primary-500 transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white">
                      {new Date(absence.date).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${
                      absence.status === 'absent' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {absence.status === 'absent' ? 'Ausente' : 'Tarde'}
                    </span>
                    {getStatusBadge(absence)}
                  </div>
                  <p className="text-gray-300 text-sm">{getCourseName(absence.courseId)}</p>
                  {absence.rejectionReason && (
                    <p className="text-red-400 text-sm mt-2">
                      Motivo de rechazo: {absence.rejectionReason}
                    </p>
                  )}
                  {absence.certificateUrl && (
                    <a
                      href={absence.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:underline text-sm mt-2 inline-block"
                    >
                      Ver certificado subido
                    </a>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  {!absence.certificateUrl && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(absence, file);
                          }
                        }}
                        disabled={uploading === absence.id}
                      />
                      <span className={`px-4 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors inline-block ${
                        uploading === absence.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}>
                        {uploading === absence.id ? 'Subiendo...' : 'Subir Certificado'}
                      </span>
                    </label>
                  )}
                  {absence.certificateUrl && absence.certificateStatus === 'pending' && (
                    <span className="px-4 py-2 bg-gray-600 text-white text-sm rounded text-center">
                      Esperando verificación
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

