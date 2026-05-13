import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, query, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { FAQ, ChatLog } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Send, User as UserIcon, Bot, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hello! I'm your TTSET Support Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      const q = query(collection(db, "faqs"));
      const snapshot = await getDocs(q);
      const fetchedFaqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ));
      setFaqs(fetchedFaqs);
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const findResponse = (userMsg: string): string => {
    const lowerMsg = userMsg.toLowerCase();
    
    // Exact match or partial keyword match
    const match = faqs.find(faq => {
      const qMatch = faq.question.toLowerCase().includes(lowerMsg);
      const kMatch = faq.keywords?.some(k => lowerMsg.includes(k.toLowerCase()));
      return qMatch || kMatch;
    });

    if (match) return match.answer;

    // Fallback logic
    return "Sorry, I don't understand that. Please contact administration at 0123-456-789 or email info@ttset.edu for further assistance.";
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsgText = input.trim();
    setInput("");

    const userMessage: Message = {
      id: Date.now().toString(),
      text: userMsgText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate bot thinking delay
    setTimeout(async () => {
      const botAns = findResponse(userMsgText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botAns,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      // Record to ChatLog database
      try {
        await addDoc(collection(db, "chatLogs"), {
          userMessage: userMsgText,
          botResponse: botAns,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        console.error("Error logging chat:", error);
      }
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col">
      <Card className="flex-grow flex flex-col overflow-hidden shadow-xl border-none">
        <CardHeader className="bg-ttset-green text-white py-4 rounded-t-xl shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-ttset-orange rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">TTSET Assistant</CardTitle>
              <p className="text-xs text-green-200">Online | Instant Support</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent 
          ref={scrollRef}
          className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col pt-6"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                className={cn(
                  "flex items-end gap-2",
                  msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1",
                  msg.sender === 'user' ? "bg-ttset-orange" : "bg-ttset-green"
                )}>
                  {msg.sender === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                  msg.sender === 'user' 
                    ? "bg-ttset-green text-white rounded-tr-none" 
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                )}>
                  {msg.text}
                  <div className={cn(
                    "text-[10px] mt-1 opacity-60",
                    msg.sender === 'user' ? "text-right" : "text-left"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 bg-white w-fit px-4 py-2 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm"
            >
              <div className="typing-indicator">
                <div className="typing-dot" style={{ animationDelay: '0s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span className="text-xs text-gray-400">Bot is typing...</span>
            </motion.div>
          )}
        </CardContent>

        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about admissions, fees, or courses..."
              className="rounded-full bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isTyping}
              className="rounded-full bg-ttset-green hover:bg-green-900 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button 
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setMessages([messages[0]])}
              className="rounded-full border-gray-200 text-gray-400 shrink-0"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2">
            Tip: Try asking "admission requirements" or "fees structure"
          </p>
        </div>
      </Card>
    </div>
  );
}
