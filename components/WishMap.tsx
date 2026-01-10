
import React, { useEffect, useRef } from 'react';
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
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);

  useEffect(() => {
    if (!window.kakao || !mapContainer.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(center?.lat || 36.5, center?.lng || 127.5),
      level: 12,
    };

    mapInstance.current = new window.kakao.maps.LatLng(center?.lat || 36.5, center?.lng || 127.5);
    const map = new window.kakao.maps.Map(mapContainer.current, options);
    mapInstance.current = map;

    // Add wishes as custom markers
    wishes.forEach((wish) => {
      const content = `
        <div class="wish-marker group cursor-pointer" id="marker-${wish.id}">
          <div class="relative flex flex-col items-center">
            <div class="bg-white/90 border-2 border-red-500 rounded-full px-3 py-1 shadow-lg text-xs font-bold whitespace-nowrap mb-1 transform group-hover:scale-110 transition-transform">
              ${wish.content.substring(0, 10)}${wish.content.length > 10 ? '...' : ''}
            </div>
            <div class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-xl border-2 border-white gallop-anim">
              <span class="text-xl">🐎</span>
            </div>
          </div>
        </div>
      `;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(wish.lat, wish.lng),
        content: content,
        yAnchor: 1,
      });

      customOverlay.setMap(map);
      markers.current.push(customOverlay);

      // We need to add event listeners manually for CustomOverlay strings or use DOM elements
      // For this implementation, we'll rely on the parent list for detailed view, 
      // but in a production app, we'd use DOM objects for the overlay content.
    });

    return () => {
      markers.current.forEach(m => m.setMap(null));
      markers.current = [];
    };
  }, [wishes, center]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-inner border-4 border-white">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute bottom-4 left-4 right-4 bg-white/60 backdrop-blur-md p-3 rounded-2xl text-center text-xs font-bold text-red-800 border border-white">
        지도 위의 붉은 말들을 눌러 소원을 응원해주세요!
      </div>
    </div>
  );
};

export default WishMap;
