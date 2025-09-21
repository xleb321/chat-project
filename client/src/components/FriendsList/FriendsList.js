import React from "react";
import "./FriendsList.css";

const FriendsList = ({ friends, selectedFriend, onSelectFriend, onAddFriend }) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [friendUsername, setFriendUsername] = React.useState("");

  const handleAddFriend = e => {
    e.preventDefault();
    if (friendUsername.trim()) {
      onAddFriend(friendUsername.trim());
      setFriendUsername("");
      setShowAddForm(false);
    }
  };

  return (
    <div className="friends-list">
      <div className="friends-header">
        <h3>Friends</h3>
        <button onClick={() => setShowAddForm(!showAddForm)} className="add-friend-btn">
          +
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddFriend} className="add-friend-form">
          <input type="text" placeholder="Enter username" value={friendUsername} onChange={e => setFriendUsername(e.target.value)} />
          <button type="submit">Add</button>
        </form>
      )}

      <div className="friends-container">
        {friends.map(friend => (
          <div key={friend.id} className={`friend-item ${selectedFriend?.id === friend.id ? "selected" : ""}`} onClick={() => onSelectFriend(friend)}>
            <span className="friend-username">{friend.username}</span>
          </div>
        ))}

        {friends.length === 0 && <div className="no-friends">No friends yet</div>}
      </div>
    </div>
  );
};

export default FriendsList;
