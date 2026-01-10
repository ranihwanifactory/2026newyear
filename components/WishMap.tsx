
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
    // 카카오 지도 SDK 로드 확인
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps || !mapContainer.current) return;

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
    };

    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      // SDK가 아직 로드되지 않은 경우를 대비해 반복 확인
      const timer = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          initMap();
          clearInterval(timer);
        }
      }, 500);
      return () => clearInterval(timer);
    }

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
    if (!mapInstance.current) return;
    clearOverlays();

    wishes.forEach((wish) => {
      const content = document.createElement('div');
      content.className = 'wish-marker group cursor-pointer';
      content.style.transform = 'translate(-50%, -100%)';
      content.innerHTML = `
        <div class="relative flex flex-col items-center">
          <div class="bg-white/90 border-2 border-red-500 rounded-full px-3 py-1 shadow-lg text-[10px] font-bold whitespace-nowrap mb-1">
            ${wish.content.substring(0, 10)}${wish.content.length > 10 ? '..' : ''}
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
    <div className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden shadow-inner border-4 border-white bg-red-100">
      {!isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-50/80 backdrop-blur-sm">
          <div className="text-5xl gallop-anim mb-4">🐎</div>
          <p className="font-gaegu text-xl text-red-500 font-bold">지도를 불러오고 있어요...</p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '100%' }} />
    </div>
  );
};

export default WishMap;
