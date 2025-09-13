import React, { useEffect, useState } from 'react';
import { Colors } from '../constants.ts';
import { Post, PostCategory } from '../types.ts';

interface EditPostModalProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  onSubmit: (postId: string, updates: { text: string; tags: string[]; category: PostCategory }) => Promise<void>;
  isSaving: boolean;
}

const POST_CATEGORIES: PostCategory[] = ["Experience", "Tip", "Photo", "Itinerary", "Question"];

const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, post, onClose, onSubmit, isSaving }) => {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<PostCategory>('Experience');

  useEffect(() => {
    if (isOpen && post) {
      setVisible(true);
      setText(post.content?.text || '');
      setTags((post.tags || []).join(', '));
      setCategory((post.category as PostCategory) || 'Experience');
    } else {
      setVisible(false);
    }
  }, [isOpen, post]);

  if (!isOpen || !post) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    await onSubmit(post.id, { text, tags: tagsArray, category });
  };

  const modalCardStyle: React.CSSProperties = { backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow };
  const inputStyle: React.CSSProperties = {
    color: Colors.text,
    backgroundColor: Colors.inputBackground,
    border: `1px solid ${Colors.cardBorder}`,
    borderRadius: '0.625rem',
    padding: '0.75rem 1rem',
    width: '100%',
    fontSize: '0.875rem',
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity ${visible ? 'opacity-100' : 'opacity-0'} bg-black/40`} onClick={handleClose}>
      <div className={`w-full max-w-xl rounded-xl overflow-hidden transition-all ${visible ? 'scale-100' : 'scale-95'}`} style={modalCardStyle} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: Colors.cardBorder }}>
          <h3 className="text-lg font-semibold" style={{ color: Colors.text }}>Edit Post</h3>
          <button onClick={handleClose} className="p-1.5 rounded hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="edit-text" className="block text-sm mb-1" style={{ color: Colors.text_secondary }}>Text</label>
            <textarea id="edit-text" value={text} onChange={e => setText(e.target.value)} rows={5} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="edit-category" className="block text-sm mb-1" style={{ color: Colors.text_secondary }}>Category</label>
            <select id="edit-category" value={category} onChange={e => setCategory(e.target.value as PostCategory)} style={inputStyle}>
              {POST_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-tags" className="block text-sm mb-1" style={{ color: Colors.text_secondary }}>Tags (comma separated)</label>
            <input id="edit-tags" type="text" value={tags} onChange={e => setTags(e.target.value)} style={inputStyle} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={handleClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
