
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

    // 복합 인덱스 오류를 방지하기 위해 단일 필드로만 쿼리합니다.
    const q = query(
      collection(db, 'wishes'), 
      orderBy('timestamp', 'desc')
    );

    const unsubscribeWishes = onSnapshot(q, 
      (snapshot) => {
        const wishList: Wish[] = [];
        snapshot.forEach((doc) => {
          wishList.push({ id: doc.id, ...doc.data() } as Wish);
        });
        
        // 클라이언트 측에서 응원 순(cheers)으로 최종 정렬하여 랭킹을 매깁니다.
        wishList.sort((a, b) => b.cheers - a.cheers);
        
        setWishes(wishList);
        setDbError(null);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setDbError("데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
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
        await addDoc(collection(db, 'wishes'), {
          author: user?.displayName || user?.email || '익명 말',
          content: data.content,
          lat: data.lat || 36.5,
          lng: data.lng || 127.5,
          cheers: 0,
          timestamp: Date.now(),
          horseType: ['red', 'gold', 'white'][Math.floor(Math.random() * 3)],
          userId: user?.uid,
          fortune: fortune,
        });
      }
      setEditingWish(null);
      setView('list');
    } catch (err) {
      console.error(err);
      alert("작업 중 오류가 발생했습니다.");
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
    if (index === 0) return <span className="text-2xl">🥇</span>;
    if (index === 1) return <span className="text-2xl">🥈</span>;
    if (index === 2) return <span className="text-2xl">🥉</span>;
    return <span className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold">{index + 1}</span>;
  };

  if (showIntro) return <IntroScreen onFinish={() => setShowIntro(false)} />;

  return (
    <div className="relative h-screen w-full bg-red-50 flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl">
      {showAuthModal && <AuthUI onClose={() => setShowAuthModal(false)} />}

      <header className="p-4 flex items-center justify-between bg-white shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-2xl gallop-anim shadow-md">🐎</div>
          <div>
            <h1 className="text-xl font-bold text-red-600 font-gaegu leading-none">소원 질주</h1>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">2026 병오년</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
               <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-6 h-6 rounded-full border border-red-200" alt="me" />
               <button onClick={handleLogout} className="px-2 py-1 bg-gray-50 rounded-md text-[10px] font-bold text-gray-400 border border-gray-100">로그아웃</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="px-4 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold shadow-sm">로그인</button>
          )}
        </div>
      </header>

      {dbError && <div className="bg-red-100 text-red-600 p-2 text-[10px] text-center font-bold z-20">⚠️ {dbError}</div>}

      <main className="flex-1 relative">
        {view === 'map' && (
          <div className="absolute inset-0 p-4">
            <WishMap wishes={wishes} onWishClick={(wish) => { setSelectedWish(wish); setView('list'); }} />
          </div>
        )}

        {view === 'list' && (
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-4 pb-32">
            <h2 className="text-2xl font-bold font-gaegu text-red-600 border-b-2 border-red-100 pb-2">실시간 소원 랭킹</h2>
            
            {wishes.map((wish, index) => (
              <div key={wish.id} className={`relative bg-white p-5 rounded-3xl shadow-md border-b-4 transition-all duration-300 ${index < 3 ? 'ring-2 ring-red-100' : ''} ${selectedWish?.id === wish.id ? 'border-orange-400 ring-4 ring-orange-200 scale-[1.01]' : 'border-red-200'}`}>
                <div className="absolute top-4 left-4 z-10">{renderRankBadge(index)}</div>
                
                {user?.uid === wish.userId && (
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => { setEditingWish(wish); setView('edit'); }} className="text-xs p-1 hover:bg-red-50 rounded">✏️</button>
                    <button onClick={() => handleDeleteWish(wish.id)} className="text-xs p-1 hover:bg-red-50 rounded">🗑️</button>
                  </div>
                )}

                <div className="pl-8">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-0.5 rounded-full">{wish.author}</span>
                    <span className="text-[10px] text-gray-400 font-gaegu">{new Date(wish.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className={`text-gray-800 font-medium mb-4 leading-relaxed font-gaegu ${index === 0 ? 'text-2xl text-red-700' : 'text-xl'}`}>"{wish.content}"</p>
                  
                  {wish.fortune && (
                    <div className="mb-4 p-3 bg-orange-50 rounded-2xl border border-red-50 text-sm text-red-800 font-gaegu">
                      <p className="font-bold text-[10px] text-orange-500 uppercase mb-1">✨ 붉은 말의 덕담</p>
                      <p className="italic">"{wish.fortune}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-red-400">
                      <span className="text-lg gallop-anim">🐎</span>
                      <span className="text-[10px] font-bold">질주 중</span>
                    </div>
                    <button onClick={() => handleCheer(wish.id)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-md active:scale-90 transition-all">
                      <span>🔥 응원</span>
                      <span className="bg-white/20 px-2 rounded-md">{wish.cheers}</span>
                    </button>
                  </div>
                  <CommentSection wishId={wish.id} />
                </div>
              </div>
            ))}
          </div>
        )}

        {(view === 'write' || view === 'edit') && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <WishForm 
              initialData={editingWish ? { id: editingWish.id, content: editingWish.content } : undefined} 
              onSubmit={handleWishSubmit} 
              onCancel={() => { setView('map'); setEditingWish(null); }} 
            />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-red-100 flex justify-around items-center h-20 z-20">
        <button onClick={() => { setView('map'); setSelectedWish(null); }} className={`flex flex-col items-center gap-1 ${view === 'map' ? 'text-red-500' : 'text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
          <span className="text-[10px] font-bold">지도</span>
        </button>
        <button onClick={() => { if(!user) setShowAuthModal(true); else setView('write'); }} className="relative -top-6">
          <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
        </button>
        <button onClick={() => setView('list')} className={`flex flex-col items-center gap-1 ${view === 'list' ? 'text-red-500' : 'text-gray-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <span className="text-[10px] font-bold">랭킹</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
