import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Attendance, User } from '../types';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { useNotification } from '../contexts/NotificationContext';

export const CertificateVerificationPage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [pendingCertificates, setPendingCertificates] = useState<Attendance[]>([]);
  const [students, setStudents] = useState<Map<number, User>>(new Map());
  const [courses, setCourses] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const certificates = await api.getPendingCertificates();
      setPendingCertificates(certificates);

      // Obtener información de estudiantes y cursos
      const studentIds = [...new Set(certificates.map(c => c.studentId))];
      const allUsers = await api.getUsers();
      const studentsMap = new Map<number, User>();
      allUsers.forEach(u => {
        if (studentIds.includes(u.id)) {
          studentsMap.set(u.id, u);
        }
      });
      setStudents(studentsMap);

      // Obtener nombres de cursos
      const allCourses = await api.getAllCourses();
      const coursesMap = new Map<number, string>();
      allCourses.forEach(c => {
        coursesMap.set(c.id, c.name);
      });
      setCourses(coursesMap);
    } catch (error) {
      console.error('Error al cargar certificados:', error);
      addNotification('Error al cargar los certificados pendientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (attendance: Attendance) => {
    if (!attendance.id || !user?.id) return;

    setProcessing(attendance.id);
    try {
      await api.approveCertificate(attendance.id, user.id);
      addNotification('Certificado aprobado correctamente', 'success');
      await loadData();
    } catch (error) {
      console.error('Error al aprobar certificado:', error);
      addNotification('Error al aprobar el certificado', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (attendance: Attendance) => {
    if (!attendance.id || !user?.id) return;

    const reason = rejectionReason.get(attendance.id);
    if (!reason || reason.trim() === '') {
      addNotification('Debes ingresar un motivo de rechazo', 'error');
      return;
    }

    setProcessing(attendance.id);
    try {
      await api.rejectCertificate(attendance.id, user.id, reason);
      addNotification('Certificado rechazado', 'success');
      setRejectionReason(new Map(rejectionReason.set(attendance.id, '')));
      await loadData();
    } catch (error) {
      console.error('Error al rechazar certificado:', error);
      addNotification('Error al rechazar el certificado', 'error');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Cargando certificados pendientes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verificación de Certificados</CardTitle>
        <p className="text-sm text-gray-400 mt-2">
          Revisa y aprueba o rechaza los certificados médicos subidos por los alumnos
        </p>
      </CardHeader>

      {pendingCertificates.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No hay certificados pendientes de verificación.
        </div>
      ) : (
        <div className="space-y-6">
          {pendingCertificates.map((attendance) => {
            const student = students.get(attendance.studentId);
            const courseName = courses.get(attendance.courseId);

            return (
              <div
                key={attendance.id}
                className="bg-gray-700 p-6 rounded-lg border border-gray-600"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Información del certificado */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Información</h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-400">Alumno:</span>{' '}
                        <span className="text-white font-medium">{student?.name || 'Desconocido'}</span>
                      </p>
                      <p>
                        <span className="text-gray-400">Curso:</span>{' '}
                        <span className="text-white">{courseName || 'Desconocido'}</span>
                      </p>
                      <p>
                        <span className="text-gray-400">Fecha de inasistencia:</span>{' '}
                        <span className="text-white">
                          {new Date(attendance.date).toLocaleDateString('es-AR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-400">Tipo:</span>{' '}
                        <span className={`px-2 py-1 text-xs rounded ${
                          attendance.status === 'absent' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {attendance.status === 'absent' ? 'Ausente' : 'Tarde'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Certificado */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Certificado</h3>
                    {attendance.certificateUrl ? (
                      <div className="space-y-3">
                        <a
                          href={attendance.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors text-center"
                        >
                          Ver Certificado
                        </a>
                        <div className="space-y-3">
                          <button
                            onClick={() => handleApprove(attendance)}
                            disabled={processing === attendance.id}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === attendance.id ? 'Procesando...' : 'Aprobar'}
                          </button>
                          <div className="space-y-2">
                            <textarea
                              placeholder="Motivo de rechazo (obligatorio)"
                              value={rejectionReason.get(attendance.id) || ''}
                              onChange={(e) => {
                                const newReasons = new Map(rejectionReason);
                                newReasons.set(attendance.id!, e.target.value);
                                setRejectionReason(newReasons);
                              }}
                              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:ring-primary-500 focus:border-primary-500"
                              rows={3}
                            />
                            <button
                              onClick={() => handleReject(attendance)}
                              disabled={processing === attendance.id || !rejectionReason.get(attendance.id)?.trim()}
                              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing === attendance.id ? 'Procesando...' : 'Rechazar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-400">No hay certificado disponible</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

