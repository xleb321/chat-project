import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "./hooks/useAuth.js";
import { useWebSocket } from "./hooks/useWebSocket.js";
import api from "./services/api.js";
import AuthForm from "./components/AuthForm/AuthForm.js";
import FriendsList from "./components/FriendsList/FriendsList.js";
import ChatArea from "./components/ChatArea/ChatArea.js";
import MessageInput from "./components/MessageInput/MessageInput.js";
import "./App.css";

function App() {
  const { user, loading, login, register, logout } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleWebSocketMessage = useCallback(data => {
    if (data.type === "message") {
      setMessages(prev => [...prev, data.data]);
    }
  }, []);

  const { connect, disconnect, sendMessage, isConnected } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    if (user) {
      connect();
      loadFriends();
    } else {
      disconnect();
    }
  }, [user, connect, disconnect]);

  const loadFriends = async () => {
    try {
      const response = await api.get("/friends");
      setFriends(response.data.friends);
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const handleAuth = async formData => {
    setAuthLoading(true);
    try {
      if (isRegistering) {
        await register(formData);
      } else {
        await login(formData);
      }
    } catch (error) {
      alert(isRegistering ? "Registration failed" : "Login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddFriend = async username => {
    try {
      await api.post("/friends", { friendUsername: username });
      loadFriends(); // Reload friends list
    } catch (error) {
      alert("Error adding friend");
    }
  };

  const handleSendMessage = content => {
    if (selectedFriend && isConnected) {
      sendMessage({
        type: "message",
        to: selectedFriend.id,
        content,
      });
    }
  };

  if (loading) {
    return <div className="app-loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="app">
        <AuthForm isRegistering={isRegistering} onSubmit={handleAuth} onToggleMode={() => setIsRegistering(!isRegistering)} loading={authLoading} />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Chat App</h1>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="app-content">
        <FriendsList friends={friends} selectedFriend={selectedFriend} onSelectFriend={setSelectedFriend} onAddFriend={handleAddFriend} />

        <div className="chat-section">
          <ChatArea selectedFriend={selectedFriend} messages={messages} />

          {selectedFriend && <MessageInput onSendMessage={handleSendMessage} disabled={!isConnected} />}
        </div>
      </div>

      {!isConnected && <div className="connection-status">Connecting...</div>}
    </div>
  );
}

export default App;
