import React, { useState, useEffect } from 'react';
import api from './api/axios';
import './App.css';

function App() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [chatrooms, setChatrooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState('');

  const login = async () => {
    try {
      const response = await api.post('/api/chat/login/', { username, password });
      setToken(response.data.token);
      setIsAuthenticated(true);
      fetchChatrooms();
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const register = async () => {
    if (password !== passwordConfirm) {
      alert('Passwords do not match');
      return;
    }
    try {
      await api.post('/api/chat/register/', {
        username,
        email,
        password,
        password_confirm: passwordConfirm,
        nickname
      });
      alert('Registration successful! Please login.');
      setIsRegistering(false);
      setPassword('');
      setPasswordConfirm('');
    } catch (error) {
      console.error('Register error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const fetchChatrooms = async () => {
    try {
      const response = await api.get('/api/chat/rooms/', {
        headers: { Authorization: `Token ${token}` }
      });
      setChatrooms(response.data);
    } catch (error) {
      console.error('Error fetching chatrooms:', error);
    }
  };

  const createChatroom = async () => {
    if (!newRoomName.trim()) return;
    try {
      await api.post('/api/chat/rooms/', {
        name: newRoomName,
        description: newRoomDescription,
        is_private: newRoomIsPrivate
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      setNewRoomName('');
      setNewRoomDescription('');
      setNewRoomIsPrivate(false);
      setShowCreateRoom(false);
      fetchChatrooms();
    } catch (error) {
      console.error('Error creating chatroom:', error);
      alert('Failed to create chatroom.');
    }
  };

  const joinRoom = async (roomId) => {
    try {
      await api.post(`/api/chat/rooms/${roomId}/join/`, {}, {
        headers: { Authorization: `Token ${token}` }
      });
      setSelectedRoom(roomId);
      fetchMessages(roomId);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/chat/rooms/${roomId}/messages/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      await api.post(`/api/chat/rooms/${selectedRoom}/messages/`, {
        content: newMessage
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      setNewMessage('');
      fetchMessages(selectedRoom);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const editMessage = async (messageId) => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/api/chat/rooms/${selectedRoom}/messages/${messageId}/`, {
        content: editContent
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      setEditingMessage(null);
      setEditContent('');
      fetchMessages(selectedRoom);
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Failed to edit message.');
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await api.delete(`/api/chat/rooms/${selectedRoom}/messages/${messageId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      fetchMessages(selectedRoom);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message.');
    }
  };

  const startEditing = (message) => {
    setEditingMessage(message.id);
    setEditContent(message.content);
  };

  useEffect(() => {
    if (selectedRoom) {
      const interval = setInterval(() => fetchMessages(selectedRoom), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom]);

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="login-container">
          <h1>{isRegistering ? 'Register' : 'Chat Room Login'}</h1>
          <div className="login-form">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {isRegistering && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                />
              </>
            )}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {isRegistering && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            )}
            {isRegistering ? (
              <button onClick={register}>Register</button>
            ) : (
              <button onClick={login}>Login</button>
            )}
            <button
              className="toggle-auth"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <h1>Chat Room</h1>
          <span className="username">{username}</span>
        </div>

        <div className="chat-content">
          <div className="rooms-sidebar">
            <div className="rooms-header">
              <h3>Chat Rooms</h3>
              <button
                className="create-room-btn"
                onClick={() => setShowCreateRoom(!showCreateRoom)}
              >
                +
              </button>
            </div>
            {showCreateRoom && (
              <div className="create-room-form">
                <input
                  type="text"
                  placeholder="Room name"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                />
                <label className="private-checkbox">
                  <input
                    type="checkbox"
                    checked={newRoomIsPrivate}
                    onChange={(e) => setNewRoomIsPrivate(e.target.checked)}
                  />
                  Private
                </label>
                <button onClick={createChatroom}>Create</button>
              </div>
            )}
            {chatrooms.map(room => (
              <div
                key={room.id}
                className={`room-item ${selectedRoom === room.id ? 'active' : ''}`}
                onClick={() => joinRoom(room.id)}
              >
                {room.name}
              </div>
            ))}
          </div>

          <div className="messages-area">
            {selectedRoom ? (
              <>
                <div className="messages-container">
                  {loading ? (
                    <div className="loading">Loading messages...</div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="message">
                        {editingMessage === msg.id ? (
                          <div className="edit-form">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && editMessage(msg.id)}
                            />
                            <button onClick={() => editMessage(msg.id)}>Save</button>
                            <button onClick={() => setEditingMessage(null)}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <div className="message-content">
                              <span className="message-user">{msg.sender}:</span>
                              <span className="message-text">{msg.content}</span>
                              <span className="message-time">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="message-actions">
                              <button
                                className="edit-btn"
                                onClick={() => startEditing(msg)}
                              >
                                Edit
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => deleteMessage(msg.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="message-input-container">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <button onClick={sendMessage}>Send</button>
                </div>
              </>
            ) : (
              <div className="select-room">Select a chat room to start messaging</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
