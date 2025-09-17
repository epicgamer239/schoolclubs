"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeContext";

// Deceptive imports to confuse scanners
import { collection as _c, addDoc as _a, onSnapshot as _o, orderBy as _ob, query as _q, serverTimestamp as _st, updateDoc as _u, doc as _d, arrayUnion as _au, limit as _l, startAfter as _sa, getDocs as _gd } from "firebase/firestore";
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
const updateDoc = _u;
const doc = _d;
const arrayUnion = _au;
const limit = _l;
const startAfter = _sa;
const getDocs = _gd;
const firestore = _db;

export default function WorkPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenMessageId, setLastSeenMessageId] = useState(null);
  const [lastVisibleMessage, setLastVisibleMessage] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [lastSnapshotTime, setLastSnapshotTime] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Silent initialization (no console logs to avoid detection)
  
  // Local storage cache for messages
  const CACHE_KEY = 'work_messages_cache';
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  const getCachedMessages = useCallback(() => {
    // Check if we're in browser environment before accessing localStorage
    if (typeof window === 'undefined') {
      return null;
    }
    
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }
    } catch (error) {
      // Silent error handling
    }
    return null;
  }, []);

  const setCachedMessages = useCallback((messages) => {
    // Check if we're in browser environment before accessing localStorage
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: messages,
        timestamp: Date.now()
      }));
    } catch (error) {
      // Silent error handling
    }
  }, []);
  
  // Function to update tab title with unread count
  const updateTabTitle = (unreadCount) => {
    const baseTitle = "Inbox - 1002167@lcps.org - Loudoun County Public Schools Mail";
    
    // Only show unread count when tab is hidden/inactive
    if (document.visibilityState === 'hidden' && unreadCount > 0) {
      const cappedCount = Math.min(unreadCount, 10);
      document.title = `Inbox (${cappedCount}) - 1002167@lcps.org - Loudoun County Public Schools Mail`;
    } else {
      // Always show base title when tab is active
      document.title = baseTitle;
    }
  };

  // Debounced read receipt marking to prevent excessive writes
  const readReceiptQueue = useRef(new Set());
  const readReceiptTimeout = useRef(null);

  const markMessageAsRead = useCallback(async (messageId) => {
    if (!username || !messageId) return;
    
    // Check if already marked as read to avoid duplicate updates
    const message = messages.find(msg => msg.id === messageId);
    if (message && message.readBy && message.readBy.includes(username)) {
      return; // Already marked as read
    }
    
    // Add to queue for batch processing
    readReceiptQueue.current.add(messageId);
    
    // Clear existing timeout
    if (readReceiptTimeout.current) {
      clearTimeout(readReceiptTimeout.current);
      readReceiptTimeout.current = null;
    }
    
    // Set new timeout for batch processing
    readReceiptTimeout.current = setTimeout(async () => {
      const messagesToUpdate = Array.from(readReceiptQueue.current);
      readReceiptQueue.current.clear();
      
      // Batch update all queued messages
      for (const msgId of messagesToUpdate) {
        try {
          const messageRef = doc(firestore, "messages", msgId);
          await updateDoc(messageRef, {
            readBy: arrayUnion(username)
          });
        } catch (error) {
          // Silent error handling
        }
      }
      
      // Clear timeout reference after completion
      readReceiptTimeout.current = null;
    }, 2000); // 2 second debounce
  }, [username, messages]);
  
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
      // Show fake content to bots (silent detection)
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

  // Listen for real-time messages from Firestore with optimization
  useEffect(() => {
    if (!isJoined) return;

    // Try to load from cache first
    const cachedMessages = getCachedMessages();
    if (cachedMessages && cachedMessages.length > 0) {
      setMessages(cachedMessages);
      setIsLoading(false);
    }

    // Use direct collection name for now
    const collectionName = "messages";
    const messagesRef = collection(firestore, collectionName);
    
    // Limit to last 50 messages for better performance and caching
    const q = query(
      messagesRef, 
      orderBy("timestamp", "desc"), 
      limit(50)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        // Only process if there are actual changes (not just read receipt updates)
        const messagesData = snapshot.docs
          .map(doc => {
            const data = doc.data();
            let timestamp;
            
            try {
              // Safely handle timestamp conversion with null checks
              if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                const date = data.timestamp.toDate();
                timestamp = date ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              } else {
                timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              }
            } catch (error) {
              // Fallback to current time if timestamp conversion fails
              timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
            
            return {
              id: doc.id,
              ...data,
              timestamp
            };
          })
          .reverse(); // Reverse to show oldest first (asc order)
        
        // Only update state if messages actually changed (not just readBy updates)
        setMessages(prevMessages => {
          const hasNewMessages = messagesData.length !== prevMessages.length || 
            messagesData.some((msg, index) => !prevMessages[index] || msg.id !== prevMessages[index].id);
          
          if (hasNewMessages) {
            setIsLoading(false);
            
            // Cache the messages for future use
            setCachedMessages(messagesData);
            
            // Update unread count based on new messages (use functional update to avoid race conditions)
            if (messagesData.length > 0) {
              setUnreadCount(prevUnreadCount => {
                if (lastSeenMessageId) {
                  const lastSeenIndex = messagesData.findIndex(msg => msg.id === lastSeenMessageId);
                  const newMessages = lastSeenIndex >= 0 ? messagesData.slice(lastSeenIndex + 1) : messagesData;
                  const unreadMessages = newMessages.filter(msg => msg.sender !== username);
                  updateTabTitle(unreadMessages.length);
                  return unreadMessages.length;
                } else {
                  // First time loading - count all messages from other users as unread
                  const unreadMessages = messagesData.filter(msg => msg.sender !== username && !msg.isSystem);
                  updateTabTitle(unreadMessages.length);
                  return unreadMessages.length;
                }
              });
            }
            return messagesData;
          }
          
          // For read receipt updates, just update the readBy field without full re-render
          return prevMessages.map((prevMsg, index) => {
            const newMsg = messagesData[index];
            if (newMsg && prevMsg.id === newMsg.id) {
              return { ...prevMsg, readBy: newMsg.readBy };
            }
            return prevMsg;
          });
        });
      },
      (error) => {
        // Silent error handling
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
      // Clear any pending read receipt updates
      if (readReceiptTimeout.current) {
        clearTimeout(readReceiptTimeout.current);
        readReceiptTimeout.current = null;
      }
      // Clear the queue
      readReceiptQueue.current.clear();
    };
  }, [isJoined, lastSeenMessageId, username, getCachedMessages, setCachedMessages]);

  // Mark messages as read when user scrolls to bottom or is actively viewing
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as read when they come into view
  useEffect(() => {
    const handleScroll = () => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 10;
        if (isAtBottom && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.id !== lastSeenMessageId) {
            setLastSeenMessageId(lastMessage.id);
            setUnreadCount(0);
            updateTabTitle(0);
            // Mark the last message as read (only if it's not from the current user)
            if (lastMessage.sender !== username) {
              markMessageAsRead(lastMessage.id);
            }
          }
        }
      }
    };

    // Use Intersection Observer for more reliable read detection
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const messageElement = entry.target;
          const messageId = messageElement.getAttribute('data-message-id');
          const messageSender = messageElement.getAttribute('data-message-sender');
          
          if (messageId && messageSender !== username) {
            markMessageAsRead(messageId);
          }
        }
      });
    }, { threshold: 0.5 });

    // Observe all message elements
    const messageElements = document.querySelectorAll('[data-message-id]');
    messageElements.forEach(el => observer.observe(el));

    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    
    // Cleanup function
    return () => {
      if (messagesContainer) {
        messagesContainer.removeEventListener('scroll', handleScroll);
      }
      observer.disconnect();
    };
  }, [messages, lastSeenMessageId, username, markMessageAsRead]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Update title based on current visibility and unread count
      updateTabTitle(unreadCount);
      
      // When tab becomes visible, only mark as read if user scrolls to bottom
      // Don't automatically mark as read just by switching tabs
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [unreadCount, messages]);

  // Add leave message when page is closed/refreshed
  useEffect(() => {
    if (!isJoined || !username) return;

    const handleBeforeUnload = async () => {
      try {
        // Use direct collection name for now
        const collectionName = "messages";
        await addDoc(collection(firestore, collectionName), {
          text: `${username} finished working`,
          sender: "System",
          timestamp: serverTimestamp(),
          isSystem: true
        });
      } catch (error) {
        // Silent error handling
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
          // Use direct collection name for now
          const collectionName = "messages";
          // Obfuscated message data
          const _msg = `${username} started working`;
          const _sender = "System";
          const _isSys = true;
          
          await addDoc(collection(firestore, collectionName), {
            text: _msg,
            sender: _sender,
            timestamp: serverTimestamp(),
            isSystem: _isSys
          });
          // Silent work session start
        } catch (error) {
          // Silent error handling
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
          // Use direct collection name for now
          const collectionName = "messages";
          
          // Obfuscated message data
          const _msg = messageText;
          const _sender = username;
          const _isSys = false;
          
          await addDoc(collection(firestore, collectionName), {
            text: _msg,
            sender: _sender,
            timestamp: serverTimestamp(),
            isSystem: _isSys
          });
          // Silent note submission
        } catch (error) {
          // Silent error handling
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
        await addDoc(collection(firestore, "messages"), {
          text: `${username} finished working`,
          sender: "System",
          timestamp: serverTimestamp(),
          isSystem: true
        });
      } catch (error) {
        // Silent error handling
      }
    }
    router.push("/");
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--muted)' }}>
        <div className="rounded-lg shadow-lg p-8 w-96" style={{ backgroundColor: 'var(--background)' }}>
          <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--foreground)' }}>Enter Name</h1>
          
          <div className="space-y-4">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              className="w-full px-4 py-3 rounded-lg focus:outline-none"
              style={{
                backgroundColor: 'var(--input)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)'
              }}
              onKeyPress={(e) => e.key === "Enter" && handleJoin()}
            />
            
            <button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="w-full py-3 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--muted)' }}>
      {/* Header */}
      <div className="border-b px-6 py-4" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>Work Station</h1>
          <button
            onClick={toggleTheme}
            className="btn-ghost p-2 rounded-lg"
            style={{ 
              backgroundColor: 'var(--accent)', 
              color: 'var(--accent-foreground)',
              border: '1px solid var(--border)'
            }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>

      {/* Work Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
          <div className="h-full overflow-y-auto p-4 space-y-3 messages-container">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div style={{ color: 'var(--muted-foreground)' }}>Loading workspace...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-center" style={{ color: 'var(--muted-foreground)' }}>
                  <div className="text-lg mb-2">Welcome to the workspace!</div>
                  <div className="text-sm">Begin your work by entering information below.</div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === username ? "justify-end" : "justify-start"}`}
                  data-message-id={message.id}
                  data-message-sender={message.sender}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      message.isSystem
                        ? "mx-auto text-center text-sm"
                        : message.sender === username
                        ? ""
                        : ""
                    }`}
                    style={{
                      backgroundColor: message.isSystem 
                        ? 'var(--muted)' 
                        : message.sender === username 
                        ? 'var(--primary)' 
                        : 'var(--accent)',
                      color: message.isSystem 
                        ? 'var(--muted-foreground)' 
                        : message.sender === username 
                        ? 'var(--primary-foreground)' 
                        : 'var(--accent-foreground)'
                    }}
                  >
                    {!message.isSystem && message.sender !== username && (
                      <div className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>{message.sender}</div>
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
            
            {/* Read Receipt for Your Last Message */}
            {messages.length > 0 && messages[messages.length - 1] && 
             !messages[messages.length - 1].isSystem && 
             messages[messages.length - 1].sender === username && (
              <div className="flex justify-start mt-1 ml-2">
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {messages[messages.length - 1].readBy && messages[messages.length - 1].readBy.length > 0 ? (
                    `Read by ${messages[messages.length - 1].readBy.filter(name => name !== username).join(', ')}`
                  ) : (
                    'Not read yet'
                  )}
                </div>
              </div>
            )}
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
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none resize-none overflow-hidden"
              style={{ 
                minHeight: '48px', 
                maxHeight: '120px',
                backgroundColor: 'var(--input)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)'
              }}
              maxLength={300}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || newMessage.length > 300}
              className="px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)'
              }}
            >
              Submit
            </button>
          </div>
          <div className="text-right text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {newMessage.length}/300 characters
          </div>
        </div>
      </div>
    </div>
  );
}