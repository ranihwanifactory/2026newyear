
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface AuthUIProps {
  onClose: () => void;
}

const AuthUI: React.FC<AuthUIProps> = ({ onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden relative border-4 border-red-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
        >
          ✕
        </button>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-red-50 rounded-full mb-4">
              <span className="text-4xl">🐎</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-gaegu">회원 전용 기능입니다</h2>
            <p className="text-sm text-gray-500">소원을 적고 응원하려면 로그인이 필요해요!</p>
          </div>

          <div className="space-y-3 mb-6">
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-3 flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
              Google로 계속하기
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">또는 이메일</span></div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isSignUp && (
              <input
                type="text"
                placeholder="이름"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-red-200 outline-none transition-all"
              />
            )}
            <input
              type="email"
              placeholder="이메일"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-red-200 outline-none transition-all"
            />
            <input
              type="password"
              placeholder="비밀번호"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-red-200 outline-none transition-all"
            />
            {error && <p className="text-red-500 text-[10px] text-center">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-600 transition-colors"
            >
              {loading ? '처리 중...' : (isSignUp ? '회원가입' : '이메일 로그인')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-red-500 underline"
            >
              {isSignUp ? '이미 계정이 있나요? 로그인' : '처음이신가요? 회원가입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthUI;
