'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, RefreshCw, Trash2, X, BookOpen, Upload, FileText, Image } from 'lucide-react';
import {
    getEBooks,
    EBOOK_CATEGORIES,
    type EBook,
} from '@/lib/supabase';

export default function EbooksPage() {
    const [ebooks, setEbooks] = useState<EBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [newBook, setNewBook] = useState({
        title: '',
        author: '',
        category: 'Ramadan',
        description: '',
        pages: '',
    });
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState('');

    const pdfInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const loadEbooks = async () => {
        setLoading(true);
        try {
            const data = await getEBooks();
            setEbooks(data);
        } catch (error) {
            console.error('Error loading ebooks:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadEbooks();
    }, []);

    const handleAddBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pdfFile) {
            alert('Veuillez sélectionner un fichier PDF');
            return;
        }

        setActionLoading('add');
        setUploadProgress('Upload en cours...');

        try {
            // Use FormData to send to API route
            const formData = new FormData();
            formData.append('title', newBook.title);
            formData.append('author', newBook.author);
            formData.append('category', newBook.category);
            formData.append('description', newBook.description);
            formData.append('pages', newBook.pages);
            formData.append('pdf', pdfFile);
            if (coverFile) {
                formData.append('cover', coverFile);
            }

            const response = await fetch('/api/ebooks', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                setShowAddModal(false);
                setNewBook({ title: '', author: '', category: 'Ramadan', description: '', pages: '' });
                setPdfFile(null);
                setCoverFile(null);
                loadEbooks();
            } else {
                alert('Erreur: ' + result.error);
            }
        } catch (error) {
            console.error('Error adding book:', error);
            alert('Une erreur est survenue');
        }

        setActionLoading(null);
        setUploadProgress('');
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Supprimer "${title}"?`)) return;

        setActionLoading(id);

        try {
            const response = await fetch(`/api/ebooks?id=${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (result.success) {
                loadEbooks();
            } else {
                alert('Erreur: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting book:', error);
            alert('Une erreur est survenue');
        }

        setActionLoading(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                        E-Books
                    </h1>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                        Gérer la bibliothèque ({ebooks.length} livres)
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Ajouter un livre
                </button>
            </div>

            {loading ? (
                <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                    <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : ebooks.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                    }}>
                        <BookOpen size={40} color="var(--primary)" />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        Aucun e-book
                    </h2>
                    <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                        Ajoutez votre premier livre PDF
                    </p>
                    <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} />
                        Ajouter un livre
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1rem',
                }}>
                    {ebooks.map((book) => (
                        <div key={book.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                {book.cover_url ? (
                                    <img
                                        src={book.cover_url}
                                        alt={book.title}
                                        style={{
                                            width: '80px',
                                            height: '110px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            background: 'var(--background)',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '80px',
                                        height: '110px',
                                        borderRadius: '8px',
                                        background: 'var(--background)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <FileText size={32} color="var(--muted)" />
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        marginBottom: '0.25rem',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {book.title}
                                    </h3>
                                    {book.author && (
                                        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                            {book.author}
                                        </p>
                                    )}
                                    <span className="badge badge-success">{book.category}</span>
                                </div>
                            </div>

                            {book.description && (
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--muted)',
                                    marginBottom: '1rem',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}>
                                    {book.description}
                                </p>
                            )}

                            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                                <a
                                    href={book.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary"
                                    style={{ flex: 1, textDecoration: 'none' }}
                                >
                                    <FileText size={16} />
                                    Voir PDF
                                </a>
                                <button
                                    className="btn btn-danger"
                                    style={{ padding: '0.625rem' }}
                                    onClick={() => handleDelete(book.id, book.title)}
                                    disabled={actionLoading === book.id}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">Ajouter un e-book</h3>
                            <button className="modal-close" onClick={() => setShowAddModal(false)} disabled={!!actionLoading}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddBook}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                    Titre *
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Le titre du livre"
                                    value={newBook.title}
                                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                        Auteur
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Nom de l'auteur"
                                        value={newBook.author}
                                        onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                        Catégorie *
                                    </label>
                                    <select
                                        className="input"
                                        value={newBook.category}
                                        onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                                        required
                                    >
                                        {EBOOK_CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                    Description
                                </label>
                                <textarea
                                    className="input"
                                    placeholder="Description du livre..."
                                    rows={3}
                                    value={newBook.description}
                                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                    Nombre de pages
                                </label>
                                <input
                                    type="number"
                                    className="input"
                                    placeholder="Ex: 150"
                                    value={newBook.pages}
                                    onChange={(e) => setNewBook({ ...newBook, pages: e.target.value })}
                                    min="1"
                                />
                            </div>

                            {/* PDF Upload */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                    Fichier PDF *
                                </label>
                                <input
                                    ref={pdfInputRef}
                                    type="file"
                                    accept=".pdf"
                                    style={{ display: 'none' }}
                                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ width: '100%', justifyContent: 'flex-start' }}
                                    onClick={() => pdfInputRef.current?.click()}
                                >
                                    <Upload size={18} />
                                    {pdfFile ? pdfFile.name : 'Sélectionner un fichier PDF'}
                                </button>
                            </div>

                            {/* Cover Upload */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                                    Image de couverture (optionnel)
                                </label>
                                <input
                                    ref={coverInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ width: '100%', justifyContent: 'flex-start' }}
                                    onClick={() => coverInputRef.current?.click()}
                                >
                                    <Image size={18} />
                                    {coverFile ? coverFile.name : 'Sélectionner une image'}
                                </button>
                            </div>

                            {uploadProgress && (
                                <p style={{ color: 'var(--primary)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
                                    {uploadProgress}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setShowAddModal(false)}
                                    disabled={!!actionLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1 }}
                                    disabled={!!actionLoading}
                                >
                                    {actionLoading === 'add' ? 'Upload...' : 'Ajouter'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
