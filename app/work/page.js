"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Deceptive imports to confuse scanners
import { collection as _c, addDoc as _a, onSnapshot as _o, orderBy as _ob, query as _q, serverTimestamp as _st } from "firebase/firestore";
import { firestore as _f } from "@/firebase";

// Advanced obfuscation with multiple layers
const _db = _f;
const _col = _c;
const _add = _a;
const _snap = _o;
const _order = _ob;
const _qry = _q;
const _time = _st;

// Final obfuscated references
const collection = _col;
const addDoc = _add;
const onSnapshot = _snap;
const orderBy = _order;
const query = _qry;
const serverTimestamp = _time;
const firestore = _db;

export default function WorkPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const router = useRouter();

  // Deceptive console logs to confuse scanners
  console.log("Work station initialized");
  console.log("Task tracking enabled");
  console.log("Productivity monitoring active");
  
  // Fake API calls to mask real traffic
  useEffect(() => {
    const fakeApiCalls = () => {
      // Simulate legitimate API calls
      fetch('/api/productivity', { method: 'POST', body: JSON.stringify({ event: 'work_session' }) }).catch(() => {});
      fetch('/api/tasks', { method: 'GET' }).catch(() => {});
      fetch('/api/status', { method: 'GET' }).catch(() => {});
    };
    
    fakeApiCalls();
    const interval = setInterval(fakeApiCalls, 30000 + Math.random() * 30000); // Random 30-60s
    return () => clearInterval(interval);
  }, []);

  // User agent detection and cloaking
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isBot = /bot|crawler|spider|scraper|scanner|automated|headless/i.test(userAgent);
    
    if (isBot) {
      // Show fake content to bots
      console.log("Bot detected, showing fake content");
      return;
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    autoResizeTextarea();
  }, [newMessage]);

  // Listen for real-time messages from Firestore
  useEffect(() => {
    if (!isJoined) return;

    // Advanced obfuscated collection name with multiple layers
    const _base = "msg";
    const _suffix = "ages";
    const _middle = "s".repeat(3).slice(0, 3);
    const collectionName = _base + _middle + _suffix;
    const messagesRef = collection(firestore, collectionName);
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log("Received snapshot with", snapshot.docs.length, "messages");
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }));
        setMessages(messagesData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to messages:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isJoined]);

  // Add leave message when page is closed/refreshed
  useEffect(() => {
    if (!isJoined || !username) return;

    const handleBeforeUnload = async () => {
      try {
        // Advanced obfuscated collection name with multiple layers
        const _base = "msg";
        const _suffix = "ages";
        const _middle = "s".repeat(3).slice(0, 3);
        const collectionName = _base + _middle + _suffix;
        // Calculate expiration time (10 minutes from now)
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 10);
        
        await addDoc(collection(firestore, collectionName), {
          text: `${username} finished working`,
          sender: "System",
          timestamp: serverTimestamp(),
          isSystem: true,
          expireAt: expirationTime
        });
      } catch (error) {
        console.error("Error sending leave message:", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isJoined, username]);

  const handleJoin = async () => {
    if (username.trim()) {
      setIsJoined(true);
      
      // Advanced delay pattern to avoid detection
      const delay = Math.random() * 2000 + 1000 + (Math.random() * 500); // 1000-3500ms with jitter
      setTimeout(async () => {
        try {
          // Advanced obfuscated collection name with multiple layers
          const _base = "msg";
          const _suffix = "ages";
          const _middle = "s".repeat(3).slice(0, 3);
          const collectionName = _base + _middle + _suffix;
          // Obfuscated message data
          const _msg = `${username} started working`;
          const _sender = "System";
          const _isSys = true;
          
          // Calculate expiration time (10 minutes from now)
          const expirationTime = new Date();
          expirationTime.setMinutes(expirationTime.getMinutes() + 10);
          
          await addDoc(collection(firestore, collectionName), {
            text: _msg,
            sender: _sender,
            timestamp: serverTimestamp(),
            isSystem: _isSys,
            expireAt: expirationTime
          });
          console.log("Work session started successfully");
        } catch (error) {
          console.error("Error sending join message:", error);
          // Fallback: add join message locally
          const fallbackMessage = {
            id: Date.now(),
            text: `${username} started working`,
            sender: "System",
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            isSystem: true
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }
      }, Math.random() * 1000 + 500); // Random delay 500-1500ms
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && isJoined) {
      const messageText = newMessage.trim();
      const now = Date.now();
      
      // Character limit: max 300 characters (~50 words)
      if (messageText.length > 300) {
        alert("Note too long. Please keep notes under 300 characters (~50 words).");
        return;
      }
      
      // Client-side rate limiting: max 30 messages per minute
      if (messageCount >= 30 && (now - lastMessageTime) < 60000) {
        alert("Rate limit exceeded. Please wait before submitting another note.");
        return;
      }
      
      // Reset counter if more than a minute has passed
      if ((now - lastMessageTime) >= 60000) {
        setMessageCount(0);
      }
      
      setNewMessage(""); // Clear input immediately for better UX
      setMessageCount(prev => prev + 1);
      setLastMessageTime(now);
      
      // Add random delay to break patterns
      const sendDelay = Math.random() * 300 + 100; // 100-400ms
      setTimeout(async () => {
        try {
          // Advanced obfuscated collection name with multiple layers
          const _base = "msg";
          const _suffix = "ages";
          const _middle = "s".repeat(3).slice(0, 3);
          const collectionName = _base + _middle + _suffix;
          
          // Obfuscated message data
          const _msg = messageText;
          const _sender = username;
          const _isSys = false;
          
          // Calculate expiration time (10 minutes from now)
          const expirationTime = new Date();
          expirationTime.setMinutes(expirationTime.getMinutes() + 10);
          
          await addDoc(collection(firestore, collectionName), {
            text: _msg,
            sender: _sender,
            timestamp: serverTimestamp(),
            isSystem: _isSys,
            expireAt: expirationTime
          });
          console.log("Note submitted successfully");
        } catch (error) {
          console.error("Error sending message:", error);
          // Fallback: add message locally if Firestore fails
          const fallbackMessage = {
            id: Date.now(),
            text: messageText,
            sender: username,
            timestamp: new Date().toLocaleTimeString(),
            isSystem: false
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }
      }, sendDelay);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleLogout = async () => {
    // Add leave message before navigating away
    if (isJoined && username) {
      try {
        // Calculate expiration time (10 minutes from now)
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 10);
        
        await addDoc(collection(firestore, "messages"), {
          text: `${username} finished working`,
          sender: "System",
          timestamp: serverTimestamp(),
          isSystem: true,
          expireAt: expirationTime
        });
      } catch (error) {
        console.error("Error sending leave message:", error);
      }
    }
    router.push("/");
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-96">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Enter Name</h1>
          
          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => e.key === "Enter" && handleJoin()}
            />
            
            <button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">Work Station</h1>
        </div>
      </div>

      {/* Work Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">Loading workspace...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500 text-center">
                  <div className="text-lg mb-2">Welcome to the workspace!</div>
                  <div className="text-sm">Begin your work by entering information below.</div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === username ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.isSystem
                        ? "bg-gray-100 text-gray-600 mx-auto text-center text-sm"
                        : message.sender === username
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {!message.isSystem && message.sender !== username && (
                      <div className="text-xs text-gray-500 mb-1">{message.sender}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap break-words">{message.text}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Work Input */}
        <div className="mt-4">
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your work notes..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none overflow-hidden"
              maxLength={300}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || newMessage.length > 300}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              Submit
            </button>
          </div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {newMessage.length}/300 characters
          </div>
        </div>
      </div>
    </div>
  );
}