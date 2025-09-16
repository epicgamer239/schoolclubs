"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WorkPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Welcome to the secret hideout! 🕵️‍♂️",
      sender: "System",
      timestamp: new Date().toLocaleTimeString(),
      isSystem: true
    },
    {
      id: 2,
      text: "This is our underground chatroom. No one knows about this place...",
      sender: "System", 
      timestamp: new Date().toLocaleTimeString(),
      isSystem: true
    }
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleJoin = () => {
    if (username.trim()) {
      setIsJoined(true);
      const joinMessage = {
        id: Date.now(),
        text: `${username} has entered the hideout! 👋`,
        sender: "System",
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      };
      setMessages(prev => [...prev, joinMessage]);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && isJoined) {
      const message = {
        id: Date.now(),
        text: newMessage,
        sender: username,
        timestamp: new Date().toLocaleTimeString(),
        isSystem: false
      };
      setMessages(prev => [...prev, message]);
      setNewMessage("");
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        {/* Secret Header */}
        <header className="bg-black/20 border-b border-purple-500/30 px-6 py-4">
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🔒</span>
                </div>
                <h1 className="text-xl font-semibold text-white">Secret Hideout</h1>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border border-purple-500/30">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🕵️‍♂️</span>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">
                Enter the Hideout
              </h1>
              
              <p className="text-gray-300 mb-6">
                Choose your codename to enter our secret chatroom...
              </p>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your codename..."
                  className="w-full px-4 py-3 bg-black/20 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                  onKeyPress={(e) => e.key === "Enter" && handleJoin()}
                />
                
                <button
                  onClick={handleJoin}
                  disabled={!username.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enter Hideout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Secret Header */}
      <header className="bg-black/20 border-b border-purple-500/30 px-6 py-4">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔒</span>
              </div>
              <h1 className="text-xl font-semibold text-white">Secret Hideout</h1>
              <span className="text-sm text-gray-300">({username})</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white transition-colors"
            >
              ← Leave Hideout
            </button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === username ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    message.isSystem
                      ? "bg-yellow-500/20 text-yellow-200 mx-auto text-center"
                      : message.sender === username
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-gray-600/50 text-gray-200"
                  }`}
                >
                  {!message.isSystem && message.sender !== username && (
                    <div className="text-xs text-gray-400 mb-1">{message.sender}</div>
                  )}
                  <div className="text-sm">{message.text}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
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
            placeholder="Type your secret message..."
            className="flex-1 px-4 py-3 bg-black/20 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
