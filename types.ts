
export interface Wish {
  id: string;
  author: string;
  content: string;
  lat: number;
  lng: number;
  cheers: number;
  timestamp: number;
  horseType: 'red' | 'gold' | 'white';
}

export type ViewType = 'map' | 'list' | 'write';
