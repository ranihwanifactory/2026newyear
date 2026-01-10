
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
    if (!window.kakao || !mapContainer.current) return;

    // SDK가 로드된 후 지도를 초기화하기 위해 kakao.maps.load 사용
    window.kakao.maps.load(() => {
      const options = {
        center: new window.kakao.maps.LatLng(center?.lat || 36.5, center?.lng || 127.5),
        level: 12,
      };

      const map = new window.kakao.maps.Map(mapContainer.current, options);
      mapInstance.current = map;
      setIsLoaded(true);
      renderMarkers();
    });

    return () => {
      clearOverlays();
    };
  }, []); // 최초 1회 로드

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
    if (!mapInstance.current) return;
    clearOverlays();

    wishes.forEach((wish) => {
      const content = document.createElement('div');
      content.className = 'wish-marker group cursor-pointer';
      content.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="bg-white/90 border-2 border-red-500 rounded-full px-3 py-1 shadow-lg text-[10px] font-bold whitespace-nowrap mb-1 transform group-hover:scale-110 transition-transform">
            ${wish.content.substring(0, 8)}${wish.content.length > 8 ? '..' : ''}
          </div>
          <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-xl border-2 border-white gallop-anim">
            <span class="text-xl">🐎</span>
          </div>
        </div>
      `;

      content.onclick = () => onWishClick(wish);

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
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-inner border-4 border-white bg-red-100">
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-50/80 backdrop-blur-sm">
          <div className="text-5xl gallop-anim mb-4">🐎</div>
          <p className="font-gaegu text-xl text-red-500 font-bold">지도를 불러오고 있어요...</p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
      {isLoaded && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/60 backdrop-blur-md p-3 rounded-2xl text-center text-xs font-bold text-red-800 border border-white z-10">
          전국의 붉은 말들이 소원을 싣고 달립니다!
        </div>
      )}
    </div>
  );
};

export default WishMap;
