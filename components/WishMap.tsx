
import React, { useEffect, useRef, useState } from 'react';
import { Wish } from '../types';

interface WishMapProps {
  wishes: Wish[];
  onWishClick: (wish: Wish) => void;
  center?: { lat: number; lng: number };
}

declare global {
  interface Window {
    kakao: any;
  }
}

const WishMap: React.FC<WishMapProps> = ({ wishes, onWishClick, center }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapInstance = useRef<any>(null);
  const overlays = useRef<any[]>([]);

  useEffect(() => {
    const initMap = () => {
      // 카카오 객체가 로드되었는지 엄격히 확인
      if (typeof window.kakao === 'undefined' || !window.kakao.maps) {
        return false;
      }

      window.kakao.maps.load(() => {
        if (!mapContainer.current) return;
        
        const options = {
          center: new window.kakao.maps.LatLng(center?.lat || 36.5, center?.lng || 127.5),
          level: 12,
        };

        const map = new window.kakao.maps.Map(mapContainer.current, options);
        mapInstance.current = map;
        
        // 지도 크기 업데이트 강제 트리거
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.relayout();
            setIsLoaded(true);
          }
        }, 100);
      });
      return true;
    };

    let retryCount = 0;
    const maxRetries = 20;

    const tryInit = () => {
      if (!initMap() && retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryInit, 300);
      }
    };

    tryInit();

    return () => clearOverlays();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      renderMarkers();
    }
  }, [wishes, isLoaded]);

  const clearOverlays = () => {
    overlays.current.forEach(o => o.setMap(null));
    overlays.current = [];
  };

  const renderMarkers = () => {
    if (!mapInstance.current || !window.kakao || !window.kakao.maps) return;
    clearOverlays();

    wishes.forEach((wish) => {
      if (!wish.lat || !wish.lng) return;

      const content = document.createElement('div');
      content.className = 'wish-marker cursor-pointer';
      content.style.cssText = 'transform: translate(-50%, -100%); position: relative;';
      content.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="bg-white/95 border-2 border-red-500 rounded-full px-3 py-1 shadow-xl text-[10px] font-bold whitespace-nowrap mb-1 font-gaegu max-w-[100px] overflow-hidden truncate">
            ${wish.content}
          </div>
          <div class="w-10 h-10 bg-gradient-to-tr from-red-600 to-orange-500 rounded-full flex items-center justify-center shadow-2xl border-2 border-white gallop-anim">
            <span class="text-xl">🐎</span>
          </div>
          <div class="w-2 h-2 bg-red-600 rounded-full -mt-1 shadow-md"></div>
        </div>
      `;

      content.onclick = (e) => {
        e.stopPropagation();
        onWishClick(wish);
      };

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(wish.lat, wish.lng),
        content: content,
        yAnchor: 1,
      });

      customOverlay.setMap(mapInstance.current);
      overlays.current.push(customOverlay);
    });
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-red-100/30 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
      {!isLoaded && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-50/90 backdrop-blur-sm">
          <div className="text-7xl gallop-anim mb-6">🐎</div>
          <h3 className="font-gaegu text-3xl text-red-600 font-bold mb-2">붉은 말이 지도를 그리는 중...</h3>
          <p className="text-sm text-gray-400 animate-pulse">잠시만 기다려주세요 히히힝!</p>
        </div>
      )}
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
      />
    </div>
  );
};

export default WishMap;
