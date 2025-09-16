"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/firebase";

export default function WorkPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for real-time messages from Firestore
  useEffect(() => {
    if (!isJoined) return;

    const messagesRef = collection(firestore, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log("Received snapshot with", snapshot.docs.length, "messages");
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.()?.toLocaleTimeString() || new Date().toLocaleTimeString()
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

  const handleJoin = async () => {
    if (username.trim()) {
      setIsJoined(true);
      try {
        // Add join message to Firestore
        await addDoc(collection(firestore, "messages"), {
          text: `${username} joined`,
          sender: "System",
          timestamp: serverTimestamp(),
          isSystem: true
        });
        console.log("Join message sent successfully");
      } catch (error) {
        console.error("Error sending join message:", error);
        // Fallback: add join message locally
        const fallbackMessage = {
          id: Date.now(),
          text: `${username} joined`,
          sender: "System",
          timestamp: new Date().toLocaleTimeString(),
          isSystem: true
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() && isJoined) {
      const messageText = newMessage.trim();
      setNewMessage(""); // Clear input immediately for better UX
      
      try {
        await addDoc(collection(firestore, "messages"), {
          text: messageText,
          sender: username,
          timestamp: serverTimestamp(),
          isSystem: false
        });
        console.log("Message sent successfully");
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
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
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
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">Chat</h1>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500 text-center">
                  <div className="text-lg mb-2">Welcome to the chat!</div>
                  <div className="text-sm">Start a conversation by typing a message below.</div>
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
                    <div className="text-sm">{message.text}</div>
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

        {/* Message Input */}
        <div className="mt-4 flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}