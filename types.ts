export interface Wish {
  id: string;
  author: string;
  content: string;
  lat: number;
  lng: number;
  cheers: number;
  timestamp: number;
  horseType: 'red' | 'gold' | 'white';
  userId: string;
  // Fix: Added optional fortune field for Gemini-generated encouragement
  fortune?: string;
}

export interface Comment {
  id: string;
  wishId: string;
  userId: string;
  author: string;
  content: string;
  timestamp: number;
}

export type ViewType = 'map' | 'list' | 'write' | 'edit';