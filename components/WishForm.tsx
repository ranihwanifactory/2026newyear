
import React, { useState } from 'react';
import { auth } from '../firebaseConfig';

interface WishFormProps {
  onSubmit: (wishData: { author: string; content: string; lat: number; lng: number }) => void;
  onCancel: () => void;
}

const WishForm: React.FC<WishFormProps> = ({ onSubmit, onCancel }) => {
  const user = auth.currentUser;
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content) return;

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Finalize state
        setIsSuccess(true);
        setTimeout(() => {
            onSubmit({ 
              author: user.displayName || user.email || '익명 말', 
              content, 
              lat: latitude, 
              lng: longitude 
            });
            setLoading(false);
        }, 1500);
      },
      (error) => {
        console.error(error);
        onSubmit({ 
          author: user.displayName || user.email || '익명 말', 
          content, 
          lat: 36.5, 
          lng: 127.5 
        });
        setLoading(false);
      }
    );
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 bg-white rounded-3xl border-4 border-red-100">
        <div className="text-6xl gallop-anim">🐎</div>
        <h2 className="text-2xl font-bold text-red-600 font-gaegu">소원이 등록되었습니다!</h2>
        <p className="text-sm text-gray-500 italic">"붉은 말과 함께 힘차게 달려보세요!"</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-3xl shadow-xl space-y-6 border-4 border-red-100">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-red-500 font-gaegu">2026 소원 적기</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <img src={user?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=horse'} className="w-5 h-5 rounded-full" alt="profile" />
          <span className="text-xs font-bold text-gray-600">{user?.displayName || '회원님'}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">나의 소원</label>
          <textarea
            required
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-red-50 border-2 border-transparent focus:border-red-200 focus:bg-white outline-none transition-all resize-none"
            placeholder="2026년에 이루고 싶은 소망을 적어주세요..."
          />
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold shadow-lg shadow-red-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '위치 확인 중...' : '소원 질주 시작! 🐎'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WishForm;
