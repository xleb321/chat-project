import React from "react";
import "./ChatArea.css";

const ChatArea = ({ selectedFriend, messages }) => {
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!selectedFriend) {
    return (
      <div className="chat-area">
        <div className="select-friend">
          <h3>Select a friend to start chatting</h3>
          <p>Choose someone from your friends list to begin conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <h3>{selectedFriend.username}</h3>
      </div>

      <div className="messages-container">
        {messages
          .filter(
            message =>
              message.from === selectedFriend.id ||
              message.to === selectedFriend.id ||
              message.from === selectedFriend.username ||
              message.to === selectedFriend.username
          )
          .map(message => (
            <div key={message.id} className={`message ${message.from === selectedFriend.username ? "received" : "sent"}`}>
              <div className="message-content">{message.content}</div>
              <div className="message-time">{new Date(message.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatArea;
