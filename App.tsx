
import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, increment } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from './firebaseConfig';
import { Wish, ViewType } from './types';
import WishMap from './components/WishMap';
import WishForm from './components/WishForm';
import AuthUI from './components/AuthUI';
import IntroScreen from './components/IntroScreen';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('map');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const q = query(collection(db, 'wishes'), orderBy('timestamp', 'desc'));
    const unsubscribeWishes = onSnapshot(q, 
      (snapshot) => {
        const wishList: Wish[] = [];
        snapshot.forEach((doc) => {
          wishList.push({ id: doc.id, ...doc.data() } as Wish);
        });
        setWishes(wishList);
        setDbError(null);
      },
      (error) => {
        console.error("Firestore Error:", error);
        if (error.code === 'permission-denied') {
          setDbError("데이터를 읽을 권한이 없습니다. Firebase 보안 규칙을 확인해주세요.");
        } else {
          setDbError("데이터를 불러오는 중 오류가 발생했습니다.");
        }
      }
    );

    return () => {
      unsubscribeAuth();
      unsubscribeWishes();
    };
  }, []);

  const handleAddWish = async (data: { author: string; content: string; lat: number; lng: number }) => {
    try {
      await addDoc(collection(db, 'wishes'), {
        ...data,
        cheers: 0,
        timestamp: Date.now(),
        horseType: ['red', 'gold', 'white'][Math.floor(Math.random() * 3)],
        userId: user?.uid,
      });
      setView('map');
    } catch (err) {
      console.error("Error adding wish:", err);
      alert("소원 등록 중 오류가 발생했습니다. 권한 설정을 확인해주세요.");
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

  const tryToViewWrite = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setView('write');
    }
  };

  const handleLogout = () => signOut(auth);

  if (showIntro) return <IntroScreen onFinish={() => setShowIntro(false)} />;

  return (
    <div className="relative h-screen w-full bg-red-50 flex flex-col overflow-hidden max-w-md mx-auto shadow-2xl">
      {showAuthModal && <AuthUI onClose={() => setShowAuthModal(false)} />}

      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-2xl gallop-anim shadow-md">
            🐎
          </div>
          <div>
            <h1 className="text-xl font-bold text-red-600 font-gaegu leading-none">소원 질주</h1>
            <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Year of the Red Horse</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 border border-gray-100"
            >
              로그아웃
            </button>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="px-4 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold shadow-sm"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {/* DB Error Alert */}
      {dbError && (
        <div className="bg-red-100 text-red-600 p-2 text-[10px] text-center font-bold z-20">
          ⚠️ {dbError}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {view === 'map' && (
          <div className="absolute inset-0 p-4">
            <WishMap wishes={wishes} onWishClick={(wish) => {
              setSelectedWish(wish);
              setView('list'); // 리스트에서 해당 소원을 강조하거나 보여줌
            }} />
          </div>
        )}

        {view === 'list' && (
          <div className="absolute inset-0 overflow-y-auto p-4 space-y-4 pb-24">
            <h2 className="text-2xl font-bold font-gaegu text-red-600 border-b-2 border-red-100 pb-2 mb-4">전국 소원 보관함</h2>
            {wishes.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-gaegu text-lg">아직 달리는 말이 없어요.</div>
            ) : (
              wishes.map((wish) => (
                <div key={wish.id} className={`bg-white p-5 rounded-3xl shadow-md border-b-4 ${selectedWish?.id === wish.id ? 'border-orange-400 ring-2 ring-orange-200' : 'border-red-200'} hover:translate-y-[-2px] transition-transform`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-3 py-0.5 rounded-full">{wish.author}</span>
                    <span className="text-[10px] text-gray-400 italic font-gaegu">{new Date(wish.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-800 font-medium mb-4 leading-relaxed font-gaegu text-xl">"{wish.content}"</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-red-400">
                      <span className="text-lg gallop-anim">🐎</span>
                      <span className="text-[10px] font-bold uppercase">Racing</span>
                    </div>
                    <button 
                      onClick={() => handleCheer(wish.id)}
                      className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      <span>🔥 응원해!</span>
                      <span className="bg-white/20 px-2 rounded-md">{wish.cheers}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'write' && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full">
              <WishForm onSubmit={handleAddWish} onCancel={() => setView('map')} />
            </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-xl border-t border-red-100 flex justify-around items-center h-20 px-4 rounded-t-[2.5rem] shadow-[0_-5px_20px_rgba(239,68,68,0.1)] z-20">
        <button 
          onClick={() => { setView('map'); setSelectedWish(null); }}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'map' ? 'text-red-500 scale-110' : 'text-gray-400'}`}
        >
          <div className={`p-2 rounded-2xl ${view === 'map' ? 'bg-red-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <span className="text-[10px] font-bold">지도</span>
        </button>

        <button 
          onClick={tryToViewWrite}
          className="relative -top-10 flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-gradient-to-tr from-red-600 via-red-500 to-orange-400 rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-200 hover:scale-110 active:scale-90 transition-all border-4 border-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="mt-1 text-xs font-bold text-red-600 bg-white px-4 py-1 rounded-full shadow-md border border-red-50 font-gaegu">소원 질주</span>
        </button>

        <button 
          onClick={() => setView('list')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'list' ? 'text-red-500 scale-110' : 'text-gray-400'}`}
        >
          <div className={`p-2 rounded-2xl ${view === 'list' ? 'bg-red-50' : 'bg-transparent'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="text-[10px] font-bold">보관함</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
