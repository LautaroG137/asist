import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/mockApi';
import { User, Role, Course } from '../types';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Reports as AttendanceReports } from '../components/AttendanceReport';

// --- MODAL PARA CREAR/EDITAR CURSO ---
const CourseModal: React.FC<{ course?: Course; onClose: () => void; onSave: () => void; }> = ({ course, onClose, onSave }) => {
    const { addNotification } = useNotification();
    const isEditing = !!course;
    const [formData, setFormData] = useState<Partial<Course>>({
        name: course?.name || '',
        subject: course?.subject || '',
        classroom: course?.classroom || '',
        maxAbsences: course?.maxAbsences || 20,
        students: course?.students || [],
        schedule: course?.schedule || undefined,
    });
    const [students, setStudentsList] = useState<User[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        api.getUsers().then(allUsers => {
            setStudentsList(allUsers.filter(u => u.role === Role.Student));
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: ['maxAbsences', 'schedule'].includes(name) ? Number(value) : value }));
    };

    const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // Fix: Explicitly cast `option` to `HTMLOptionElement` to access its `value` property,
        // as TypeScript's inference on `selectedOptions` can be too generic (`Element` or `unknown`).
        const selectedIds = Array.from(e.target.selectedOptions, option => Number((option as HTMLOptionElement).value));
        setFormData(prev => ({ ...prev, students: selectedIds }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const coursePayload = { ...formData };

        try {
            if (isEditing) {
                await api.updateCourse({ ...course, ...coursePayload } as Course);
                addNotification('Curso actualizado exitosamente.', 'success');
            } else {
                await api.addCourse(coursePayload as Omit<Course, 'id' | 'iconUrl'>);
                addNotification('Curso creado exitosamente.', 'success');
            }
            onSave();
        } catch (error) {
            addNotification(`Error al guardar el curso.`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold text-white mb-6">{isEditing ? 'Editar Curso' : 'Crear Nuevo Curso'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Nombre del Curso (e.g. Redes - 5to A)" value={formData.name} onChange={handleChange} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>
                        <input type="text" name="subject" placeholder="Materia" value={formData.subject} onChange={handleChange} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>
                        <input type="text" name="classroom" placeholder="Aula" value={formData.classroom} onChange={handleChange} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>
                        
                        <div>
                            <label htmlFor="maxAbsences" className="block text-sm text-gray-400 mb-1">Límite de Faltas</label>
                            <input
                                type="number"
                                id="maxAbsences"
                                name="maxAbsences"
                                placeholder="20"
                                value={formData.maxAbsences}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                             <label htmlFor="schedule" className="block text-sm text-gray-400 mb-1">Carga Horaria Semanal</label>
                             <input
                                type="number"
                                id="schedule"
                                name="schedule"
                                placeholder="Horas por semana, ej: 4"
                                value={formData.schedule || ''}
                                onChange={handleChange}
                                required
                                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"
                            />
                        </div>

                         <div className="md:col-span-2">
                             <label className="block text-sm text-gray-400 mb-1">Alumnos (mantener Ctrl/Cmd para seleccionar varios)</label>
                             <select multiple name="students" value={formData.students?.map(String) || []} onChange={handleStudentSelect} className="w-full h-40 bg-gray-700 text-white p-2 rounded-md border border-gray-600">
                                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.course})</option>)}
                            </select>
                         </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancelar</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500">{isSaving ? 'Guardando...' : 'Guardar Curso'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const CourseManagement = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const { addNotification } = useNotification();

    const fetchData = useCallback(() => {
        api.getAllCourses().then(setCourses);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
        fetchData();
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        setIsModalOpen(true);
    };
    
    const handleCreate = () => {
        setEditingCourse(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (courseId: number) => {
        if (window.confirm('¿Seguro que deseas eliminar este curso? Se borrarán también las notas y asistencias asociadas.')) {
            try {
                await api.deleteCourse(courseId);
                addNotification('Curso eliminado correctamente.', 'success');
                fetchData();
            } catch (error) {
                addNotification('Error al eliminar el curso.', 'error');
            }
        }
    };

    return (
        <>
        {isModalOpen && <CourseModal course={editingCourse || undefined} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Gestión de Cursos</CardTitle>
                    <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium">Crear Curso</button>
                </div>
            </CardHeader>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Curso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Materia</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">Alumnos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {courses.map(course => (
                            <tr key={course.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{course.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{course.subject}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-center">{course.students.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(course)} className="font-medium text-primary-400 hover:text-primary-300 mr-4">Editar</button>
                                    <button onClick={() => handleDelete(course.id)} className="font-medium text-red-400 hover:text-red-300">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
        </>
    );
};


// --- MODAL PARA CREAR USUARIO ---
const CreateUserModal: React.FC<{ onClose: () => void; onUserCreated: () => void; }> = ({ onClose, onUserCreated }) => {
    const { addNotification } = useNotification();
    const [name, setName] = useState('');
    const [document, setDocument] = useState('');
    const [role, setRole] = useState<Role>(Role.Student);
    const [course, setCourse] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const [allCourseGroups, setAllCourseGroups] = useState<string[]>([]);

    useEffect(() => {
        api.getAllCourseGroups().then(setAllCourseGroups);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !document) {
            addNotification('Nombre y documento son obligatorios.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            let newUserPayload: Omit<User, 'id'> = { name, document, role };

            if (role === Role.Student && course) newUserPayload.course = course;
            
            await api.addUser(newUserPayload);
            addNotification('Usuario creado exitosamente.', 'success');
            onUserCreated();
        } catch (error) {
            addNotification('Error al crear el usuario.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold text-white mb-6">Crear Nuevo Usuario</h2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Nombre Completo" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>
                        <input type="text" placeholder="Documento" value={document} onChange={e => setDocument(e.target.value)} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>
                        <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600">
                            <option value={Role.Student}>Estudiante</option>
                            <option value={Role.Preceptor}>Preceptor</option>
                            <option value={Role.Admin}>Admin</option>
                        </select>
                        {role === Role.Student && (
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Curso (Grupo)</label>
                                <select onChange={e => setCourse(e.target.value)} value={course} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 mb-2">
                                    <option value="">Seleccionar un grupo o escribir uno nuevo abajo</option>
                                    {allCourseGroups.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <input type="text" placeholder="Grupo (e.g., 5to Año A)" value={course} onChange={e => setCourse(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-4 mt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancelar</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500">{isSaving ? 'Creando...' : 'Crear Usuario'}</button></div>
                </form>
            </div>
        </div>
    );
};

// --- MODAL PARA EDITAR USUARIO ---
const EditUserModal: React.FC<{ user: User; onClose: () => void; onUserUpdated: () => void; }> = ({ user, onClose, onUserUpdated }) => {
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState<Partial<User>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(user);
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.updateUser(formData as User);
            addNotification('Usuario actualizado exitosamente.', 'success');
            onUserUpdated();
        } catch (error) {
            addNotification('Error al actualizar el usuario.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold text-white mb-6">Editar Usuario</h2>
                    <div className="space-y-4">
                        <input type="text" name="name" placeholder="Nombre Completo" value={formData.name || ''} onChange={handleChange} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>
                        <input type="text" name="document" placeholder="Documento" value={formData.document || ''} onChange={handleChange} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>
                        <select name="role" value={formData.role || ''} onChange={handleChange} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600">
                            <option value={Role.Student}>Estudiante</option><option value={Role.Preceptor}>Preceptor</option><option value={Role.Admin}>Admin</option>
                        </select>
                        {formData.role === Role.Student && <input type="text" name="course" placeholder="Curso" value={formData.course || ''} onChange={handleChange} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600"/>}
                    </div>
                    <div className="flex justify-end gap-4 mt-6"><button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancelar</button><button type="submit" disabled={isSaving} className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-500">{isSaving ? 'Actualizando...' : 'Guardar Cambios'}</button></div>
                </form>
            </div>
        </div>
    );
};


const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { addNotification } = useNotification();
  
  const fetchUsers = useCallback(() => {
    api.getUsers().then(setUsers);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => 
    users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [users, searchQuery]);
  
  const handleUserCreated = () => {
    setIsCreateModalOpen(false);
    fetchUsers();
  };

  const handleUserUpdated = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (userId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar a este usuario?')) {
        try {
            await api.deleteUser(userId);
            addNotification('Usuario eliminado correctamente.', 'success');
            fetchUsers();
        } catch (error) {
            addNotification('Error al eliminar el usuario.', 'error');
        }
    }
  };

  return (
    <>
      {isCreateModalOpen && <CreateUserModal onClose={() => setIsCreateModalOpen(false)} onUserCreated={handleUserCreated} />}
      {isEditModalOpen && editingUser && <EditUserModal user={editingUser} onClose={() => setIsEditModalOpen(false)} onUserUpdated={handleUserUpdated} />}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <CardTitle>Gestión de Usuarios</CardTitle>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                />
                <button onClick={() => setIsCreateModalOpen(true)} className="flex-shrink-0 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    <span className="hidden sm:inline">Crear Usuario</span>
                </button>
              </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Rol</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-white">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.document}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditClick(user)} className="font-medium text-primary-400 hover:text-primary-300 mr-4 bg-transparent border-none p-0 cursor-pointer">Editar</button>
                    <button onClick={() => handleDeleteClick(user.id)} className="font-medium text-red-400 hover:text-red-300 bg-transparent border-none p-0 cursor-pointer">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'reports'>('users');

  const tabs = [
    { id: 'users', label: 'Usuarios' },
    { id: 'courses', label: 'Cursos' },
    { id: 'reports', label: 'Reportes' },
  ];
  
  const getTabClass = (tabId: typeof activeTab) => {
    return activeTab === tabId
      ? 'bg-primary-600 text-white px-4 py-2 rounded-md font-medium'
      : 'text-gray-300 hover:bg-gray-700 px-4 py-2 rounded-md font-medium';
  };

  return (
    <div>
        <h1 className="text-3xl font-bold text-white mb-6">Panel de Administración</h1>
      <div className="mb-6">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={getTabClass(tab.id as any)}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="space-y-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'courses' && <CourseManagement />}
        {activeTab === 'reports' && <AttendanceReports />}
      </div>
    </div>
  );
};