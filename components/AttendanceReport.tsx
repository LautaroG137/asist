import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Card, CardHeader, CardTitle } from './Card';

interface StudentAbsenceSummary {
    studentId: number;
    name: string;
    course: string | undefined;
    absenceCount: number; // Puede ser decimal (tardes cuentan como 0.5)
}


const AbsenceBarChart: React.FC<{ data: StudentAbsenceSummary[] }> = ({ data }) => {
    if (data.length === 0) return null;
    const maxAbsences = Math.max(...data.map(s => s.absenceCount), 1);

    return (
        <div className="space-y-4 mt-4">
            {data.map(student => (
                <div key={student.studentId} className="grid grid-cols-3 items-center gap-4 text-sm">
                    <div className="truncate font-medium text-white col-span-1">{student.name}</div>
                    <div className="col-span-2 flex items-center gap-2">
                         <div className="w-full bg-gray-700 rounded-full h-5">
                             <div 
                                className="bg-red-500 h-5 rounded-full flex items-center justify-end pr-2" 
                                style={{ width: `${(student.absenceCount / maxAbsences) * 100}%` }}
                             >
                             </div>
                         </div>
                         <span className="font-bold text-red-400 w-12 text-right">{student.absenceCount % 1 === 0 ? student.absenceCount : student.absenceCount.toFixed(1)}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

export const Reports: React.FC = () => {
    const [summary, setSummary] = useState<StudentAbsenceSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const summaryData = await api.getAttendanceSummaryForAllStudents();
            summaryData.sort((a, b) => b.absenceCount - a.absenceCount);
            setSummary(summaryData);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    const topStudents = summary.filter(s => s.absenceCount > 0).slice(0, 5);

    return (
        <Card>
            <CardHeader><CardTitle>Reportes de Asistencia</CardTitle></CardHeader>
            <h3 className="text-lg font-bold mb-2">Top 5 - Alumnos con más Faltas</h3>
            {loading ? (
                <div className="text-center py-4">Cargando reporte...</div>
            ) : topStudents.length > 0 ? (
                 <AbsenceBarChart data={topStudents} />
            ) : (
                <p className="text-gray-400 mt-4">No hay alumnos con faltas registradas.</p>
            )}
        </Card>
    );
};