
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Comment } from '../types';

interface CommentSectionProps {
  wishId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ wishId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('wishId', '==', wishId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Comment[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(list);
    });

    return () => unsubscribe();
  }, [wishId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      await addDoc(collection(db, 'comments'), {
        wishId,
        userId: user.uid,
        author: user.displayName || '익명 말',
        content: newComment,
        timestamp: Date.now(),
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'comments', id));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await updateDoc(doc(db, 'comments', id), {
        content: editContent,
      });
      setEditingCommentId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-red-50 space-y-3">
      <div className="space-y-2">
        {comments.map((comment) => (
          <div key={comment.id} className="text-xs bg-red-50/50 p-3 rounded-2xl group">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-red-600">{comment.author}</span>
              {user?.uid === comment.userId && (
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(comment)} className="text-gray-400 hover:text-blue-500">✏️</button>
                  <button onClick={() => handleDelete(comment.id)} className="text-gray-400 hover:text-red-500">🗑️</button>
                </div>
              )}
            </div>
            
            {editingCommentId === comment.id ? (
              <div className="flex gap-2 mt-1">
                <input 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)}
                  className="flex-1 bg-white border border-red-200 rounded-lg px-2 py-1 outline-none"
                />
                <button onClick={() => handleUpdate(comment.id)} className="text-blue-500 font-bold">저장</button>
                <button onClick={() => setEditingCommentId(null)} className="text-gray-400">취소</button>
              </div>
            ) : (
              <p className="text-gray-700 font-gaegu text-lg">{comment.content}</p>
            )}
          </div>
        ))}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="응원 댓글을 남겨주세요!"
            className="flex-1 text-sm bg-white border-2 border-red-100 rounded-xl px-4 py-2 outline-none focus:border-red-300 transition-all"
          />
          <button 
            type="submit"
            className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-md active:scale-90"
          >
            등록
          </button>
        </form>
      ) : (
        <p className="text-[10px] text-gray-400 text-center italic mt-2">로그인하면 댓글을 달 수 있습니다.</p>
      )}
    </div>
  );
};

export default CommentSection;
