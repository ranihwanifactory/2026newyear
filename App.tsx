
import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, increment, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from './firebaseConfig';
import { Wish, ViewType } from './types';
import WishMap from './components/WishMap';
import WishForm from './components/WishForm';
import AuthUI from './components/AuthUI';
import IntroScreen from './components/IntroScreen';
import CommentSection from './components/CommentSection';
import { generateHorseFortune } from './services/geminiService';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('map');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 권한 오류를 방지하기 위해 가장 단순한 쿼리로 시작합니다.
    const q = query(collection(db, 'wishes'));

    const unsubscribeWishes = onSnapshot(q, 
      (snapshot) => {
        const wishList: Wish[] = [];
        snapshot.forEach((doc) => {
          wishList.push({ id: doc.id, ...doc.data() } as Wish);
        });
        
        // 클라이언트 측에서 정렬
        wishList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        setWishes(wishList);
        setDbError(null);
      },
      (error) => {
        console.error("Firestore Permission Error:", error);
        if (error.code === 'permission-denied') {
          setDbError("Firestore 데이터베이스의 Rules(규칙)를 'allow read, write: if true;'로 변경해야 데이터가 보입니다.");
        } else {
          setDbError("데이터를 불러오지 못했습니다. 네트워크를 확인해주세요.");
        }
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeWishes();
    };
  }, []);

  const handleWishSubmit = async (data: { content: string; lat?: number; lng?: number; id?: string }) => {
    try {
      if (data.id) {
        const wishRef = doc(db, 'wishes', data.id);
        await updateDoc(wishRef, {
          content: data.content,
        });
      } else {
        const fortune = await generateHorseFortune(data.content);
        // Fix: Explicitly cast horseType to match Wish interface
        await addDoc(collection(db, 'wishes'), {
          author: user?.displayName || user?.email?.split('@')[0] || '익명 말',
          content: data.content,
          lat: data.lat || 36.5 + (Math.random() - 0.5) * 2,
          lng: data.lng || 127.5 + (Math.random() - 0.5) * 2,
          cheers: 0,
          timestamp: Date.now(),
          horseType: (['red', 'gold', 'white'] as const)[Math.floor(Math.random() * 3)],
          userId: user?.uid,
          fortune: fortune,
        });
      }
      setEditingWish(null);
      setView('list');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        alert("Firestore 쓰기 권한이 없습니다. Firebase Rules를 확인해주세요!");
      } else {
        alert("소원 등록 중 오류가 발생했습니다.");
      }
    }
  };

  const handleDeleteWish = async (id: string) => {
    if (!window.confirm('정말로 이 소원을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'wishes', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheer = async (wishId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      const wishRef = doc(db, 'wishes', wishId);
      await updateDoc(wishRef, {
        cheers: increment(1)
      });
    } catch (err) {
      console.error("Error cheering:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  const renderRankBadge = (index: number) => {
    if (index === 0) return <span className="text-2xl animate-bounce">🥇</span>;
    if (index === 1) return <span className="text-2xl">🥈</span>;
    if (index === 2) return <span className="text-2xl">🥉</span>;
    return <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">{index + 1}</span>;
  };

  if (showIntro) return <IntroScreen onFinish={() => setShowIntro(false)} />;

  return (
    <div className="relative h-screen w-full bg-red-50 flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl border-x border-red-100">
      {showAuthModal && <AuthUI onClose={() => setShowAuthModal(false)} />}

      <header className="p-5 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-red-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full flex items-center justify-center text-3xl gallop-anim shadow-lg border-2 border-white">🐎</div>
          <div>
            <h1 className="text-2xl font-bold text-red-600 font-gaegu leading-none tracking-tight">소원 질주</h1>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-[0.2em]">2026 Red Horse</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
               <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-8 h-8 rounded-full border-2 border-red-400 shadow-sm" alt="me" />
               <button onClick={handleLogout} className="text-[10px] font-bold text-gray-400 underline">로그아웃</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="px-5 py-2 bg-red-500 text-white rounded-full text-xs font-bold shadow-lg shadow-red-200 hover:scale-105 active:scale-95 transition-all">로그인</button>
          )}
        </div>
      </header>

      {dbError && (
        <div className="bg-red-600 text-white p-3 text-[11px] text-center font-bold z-40 animate-pulse">
          ⚠️ {dbError}
        </div>
      )}

      <main className="flex-1 relative flex flex-col">
        {view === 'map' && (
          <div className="flex-1 p-4 pb-24">
            <WishMap wishes={wishes} onWishClick={(wish) => { setSelectedWish(wish); setView('list'); }} />
          </div>
        )}

        {view === 'list' && (
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-6 pb-32 bg-red-50/30">
            <div className="flex items-center justify-between border-b-2 border-red-200 pb-3 mb-2">
               <h2 className="text-3xl font-bold font-gaegu text-red-600">질주하는 소원들</h2>
               <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">{wishes.length}개의 소원</div>
            </div>
            
            {wishes.length === 0 && !dbError && (
              <div className="py-20 text-center space-y-4">
                <div className="text-6xl grayscale opacity-30">🐎</div>
                <p className="font-gaegu text-xl text-gray-400">아직 도착한 소원이 없어요.<br/>첫 번째 소원을 적어보세요!</p>
              </div>
            )}

            {wishes.map((wish, index) => (
              <div key={wish.id} className={`relative bg-white p-6 rounded-[2rem] shadow-xl border-b-8 transition-all duration-500 ${selectedWish?.id === wish.id ? 'border-orange-500 ring-4 ring-orange-200 scale-[1.02]' : 'border-red-100 hover:border-red-300'}`}>
                <div className="absolute -top-3 -left-3 z-10">{renderRankBadge(index)}</div>
                
                {user?.uid === wish.userId && (
                  <div className="absolute top-4 right-6 flex gap-3">
                    <button onClick={() => { setEditingWish(wish); setView('edit'); }} className="text-sm p-1 grayscale hover:grayscale-0 transition-all">✏️</button>
                    <button onClick={() => handleDeleteWish(wish.id)} className="text-sm p-1 grayscale hover:grayscale-0 transition-all">🗑️</button>
                  </div>
                )}

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-600 bg-red-50 px-4 py-1 rounded-full border border-red-100">{wish.author}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 font-medium">{new Date(wish.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  <p className={`text-gray-800 font-bold mb-6 leading-relaxed font-gaegu ${index === 0 ? 'text-3xl text-red-700' : 'text-2xl'}`}>
                    "{wish.content}"
                  </p>
                  
                  {wish.fortune && (
                    <div className="mb-6 p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border-l-4 border-orange-400 shadow-inner">
                      <p className="font-bold text-[10px] text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <span className="animate-pulse">✨</span> 붉은 말의 신년 덕담
                      </p>
                      <p className="text-red-900 font-gaegu text-lg italic leading-snug">"{wish.fortune}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center gallop-anim text-xl">🐎</div>
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Racing...</span>
                    </div>
                    <button onClick={() => handleCheer(wish.id)} className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full font-black shadow-xl hover:shadow-red-200 active:scale-90 transition-all">
                      <span className="group-hover:animate-bounce">🔥 응원하기</span>
                      <span className="bg-white/20 px-3 py-0.5 rounded-lg text-sm">{wish.cheers}</span>
                    </button>
                  </div>
                  <CommentSection wishId={wish.id} />
                </div>
              </div>
            ))}
          </div>
        )}

        {(view === 'write' || view === 'edit') && (
          <div className="absolute inset-0 flex items-center justify-center p-6 bg-red-50/50 backdrop-blur-md z-40">
            <div className="w-full">
              <WishForm 
                initialData={editingWish ? { id: editingWish.id, content: editingWish.content } : undefined} 
                onSubmit={handleWishSubmit} 
                onCancel={() => { setView('map'); setEditingWish(null); }} 
              />
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-2xl border-t border-red-100 flex justify-around items-center h-24 px-6 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(239,68,68,0.15)] z-50">
        <button onClick={() => { setView('map'); setSelectedWish(null); }} className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'map' ? 'text-red-600 scale-110' : 'text-gray-300'}`}>
          <div className={`p-3 rounded-2xl ${view === 'map' ? 'bg-red-50 shadow-inner' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        
        <button onClick={() => { if(!user) setShowAuthModal(true); else setView('write'); }} className="relative -top-12 transition-transform hover:scale-110 active:scale-90">
          <div className="w-20 h-20 bg-gradient-to-tr from-red-600 via-red-500 to-orange-400 rounded-full flex items-center justify-center text-white shadow-[0_15px_30px_rgba(239,68,68,0.4)] border-8 border-white ring-4 ring-red-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-md font-gaegu">소원빌기</div>
        </button>

        <button onClick={() => setView('list')} className={`flex flex-col items-center gap-1 transition-all duration-300 ${view === 'list' ? 'text-red-600 scale-110' : 'text-gray-300'}`}>
          <div className={`p-3 rounded-2xl ${view === 'list' ? 'bg-red-50 shadow-inner' : ''}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Rank</span>
        </button>
      </nav>
    </div>
  );
};

export default App;