export interface FAQ {
  id?: string;
  category: string;
  question: string;
  answer: string;
  keywords?: string[];
}

export interface ChatLog {
  id?: string;
  userMessage: string;
  botResponse: string;
  timestamp: any; // ServerTimestamp
  userId?: string;
}

export interface SchoolInfo {
  id?: string;
  type: 'admission' | 'fees' | 'registration' | 'timetable' | 'contact';
  title: string;
  content: string;
  lastUpdated?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'student';
  displayName?: string;
}
