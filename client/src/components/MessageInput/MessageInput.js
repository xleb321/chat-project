import React, { useState } from "react";
import "./MessageInput.css";

const MessageInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = e => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input">
      <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." disabled={disabled} />
      <button type="submit" disabled={!message.trim() || disabled}>
        Send
      </button>
    </form>
  );
};

export default MessageInput;
