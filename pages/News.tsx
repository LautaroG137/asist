import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { NewsItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle } from '../components/Card';
import { useNotification } from '../contexts/NotificationContext';

const NewsForm: React.FC<{ item?: NewsItem; onSave: () => void; onCancel: () => void }> = ({ item, onSave, onCancel }) => {
    const { user } = useAuth();
    const [title, setTitle] = useState(item?.title || '');
    const [content, setContent] = useState(item?.content || '');
    const isEditing = !!item;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !user) return;

        const newsData = { title, content, author: user.name, date: new Date().toISOString() };
        
        try {
            if (isEditing) {
                await api.updateNews({ ...item, ...newsData });
            } else {
                await api.addNews(newsData);
            }
            onSave();
        } catch (error) {
            console.error("Failed to save news item", error);
        }
    };

    return (
        <Card className="mb-6 border border-primary-500">
            <form onSubmit={handleSubmit}>
                <h3 className="text-lg font-bold mb-4">{isEditing ? 'Editar Novedad' : 'Crear Novedad'}</h3>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Título"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                    <textarea
                        placeholder="Contenido"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={4}
                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-primary-500 focus:border-primary-500"
                        required
                    />
                </div>
                <div className="flex justify-end gap-4 mt-4">
                    <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 rounded-md hover:bg-primary-700">Guardar</button>
                </div>
            </form>
        </Card>
    );
};


export const NewsPage: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<NewsItem | undefined>(undefined);
    const { isPreceptor } = useAuth();
    const { addNotification } = useNotification();

    const fetchNews = useCallback(async () => {
        setLoading(true);
        const data = await api.getNews();
        setNews(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    const handleSave = () => {
        addNotification(`Novedad ${editingItem ? 'actualizada' : 'creada'} correctamente.`, 'success');
        setShowForm(false);
        setEditingItem(undefined);
        fetchNews();
    };
    
    const handleEdit = (item: NewsItem) => {
        setEditingItem(item);
        setShowForm(true);
    }
    
    const handleDelete = async (id: number) => {
        try {
            await api.deleteNews(id);
            addNotification('Novedad eliminada correctamente.', 'success');
            fetchNews();
        } catch {
            addNotification('Error al eliminar la novedad.', 'error');
        }
    }

    const handleCancel = () => {
        setShowForm(false);
        setEditingItem(undefined);
    }

    return (
        <div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Tablón de Novedades</CardTitle>
                        {isPreceptor && !showForm && (
                            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary-600 rounded-md hover:bg-primary-700">
                                Crear Novedad
                            </button>
                        )}
                    </div>
                </CardHeader>
                {isPreceptor && showForm && <NewsForm item={editingItem} onSave={handleSave} onCancel={handleCancel} />}
                
                {loading ? <div className="text-center p-4">Cargando novedades...</div> : (
                    <div className="space-y-4">
                        {news.map(item => (
                            <div key={item.id} className="p-4 bg-gray-700 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{item.title}</h3>
                                        <p className="text-sm text-gray-300 mt-1">{item.content}</p>
                                    </div>
                                    {isPreceptor && (
                                        <div className="flex gap-2 flex-shrink-0 ml-4">
                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-yellow-400 hover:text-yellow-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-400 hover:text-red-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Por {item.author} - {new Date(item.date).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};
