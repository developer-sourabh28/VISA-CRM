import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000'; // Adjust if needed

export const MessageBox = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user } = useUser();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Connect to socket.io and handle online users
  useEffect(() => {
    if (!user) return;
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }
    const socket = socketRef.current;
    socket.emit('user-online', { userId: user._id || user.id });
    socket.on('online-users', (onlineUserIds) => {
      setOnlineUsers(onlineUserIds);
    });
    socket.on('private-message', ({ senderId, message }) => {
      if (selectedUser && senderId === (selectedUser._id || selectedUser.id)) {
        setMessages((prev) => [...prev, message]);
      }
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, selectedUser]);

  // Fetch all users for the user list
  useEffect(() => {
    if (!user) return;
    fetch('/api/messages/users/all')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.filter((u) => (u._id || u.id) !== (user._id || user.id)));
      });
  }, [user]);

  // Fetch private messages when a user is selected
  useEffect(() => {
    if (!user || !selectedUser) return;
    fetch(`/api/messages/private/${user._id || user.id}/${selectedUser._id || selectedUser.id}`)
      .then((res) => res.json())
      .then((data) => setMessages(data));
  }, [user, selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedUser) return;
    const messageObj = {
      content: newMessage,
      userId: user._id || user.id,
      username: user.fullName || user.name || user.username,
      recipientId: selectedUser._id || selectedUser.id,
      isPrivate: true,
      timestamp: new Date(),
    };
    // Send to backend (save in DB)
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageObj),
    });
    // Emit via socket for real-time
    socketRef.current.emit('private-message', {
      senderId: user._id || user.id,
      recipientId: selectedUser._id || selectedUser.id,
      message: messageObj,
    });
    setMessages((prev) => [...prev, messageObj]);
    setNewMessage('');
  };

  const handleDeleteMessage = async (messageId) => {
    if (!user) return;
    await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user._id || user.id }),
    });
    setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
  };

  if (!user) return null;

  return (
    <>
      {/* Message Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>

      {/* Message Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 flex flex-col h-[90vh] max-h-[550px] min-h-[400px] mb-[-50px] relative">
            
            {/* Modal Header - Fixed positioning within modal */}
            <div className="relative flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800 rounded-t-lg z-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full z-20"
                aria-label="Close messages"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Online Users List */}
            <div className="flex gap-2 p-3 border-b h-[19%] border-gray-200 dark:border-gray-700 overflow-x-auto flex-shrink-0 bg-gray-50 dark:bg-gray-750">
              {users.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm py-2">
                  No users available
                </div>
              ) : (
                users.map((u) => (
                  <button
                    key={u._id || u.id}
                    className={`flex flex-col items-center px-3 py-2 rounded-lg border transition-all duration-200 flex-shrink-0 min-w-[80px] ${
                      selectedUser && (selectedUser._id || selectedUser.id) === (u._id || u.id) 
                        ? 'bg-blue-100 dark:bg-blue-900 border-blue-400 shadow-md' 
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    } ${
                      onlineUsers.includes(u._id || u.id) 
                        ? 'ring-2 ring-green-400 ring-opacity-50' 
                        : ''
                    }`}
                    onClick={() => setSelectedUser(u)}
                    title={`${u.fullName || u.username} ${onlineUsers.includes(u._id || u.id) ? '(Online)' : '(Offline)'}`}
                  >
                    <div className="relative">
                      <span className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {(u.fullName || u.username || '').charAt(0).toUpperCase()}
                      </span>
                      {onlineUsers.includes(u._id || u.id) && (
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-700 rounded-full"></span>
                      )}
                    </div>
                    <span className="text-xs mt-1 text-center text-gray-700 dark:text-gray-300 font-medium truncate w-full">
                      {u.fullName || u.username}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Chat Content Area */}
            <div className="flex-1 flex flex-col min-h-0">
              {!selectedUser ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-750">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-lg font-medium">Select a user to start chatting</p>
                    <p className="text-sm mt-1">Choose someone from the list above</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Selected User Header */}
                  <div className="px-4 py-3 bg-gray-50 h-[12%] dark:bg-gray-750 border-b border-gray-200 dark:border-gray-600 flex items-center gap-3">
                    <div className="relative">
                      <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {(selectedUser.fullName || selectedUser.username || '').charAt(0).toUpperCase()}
                      </span>
                      {onlineUsers.includes(selectedUser._id || selectedUser.id) && (
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-700 rounded-full"></span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedUser.fullName || selectedUser.username}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {onlineUsers.includes(selectedUser._id || selectedUser.id) ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-800">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <p className="text-lg">No messages yet</p>
                          <p className="text-sm mt-1">Start a conversation with {selectedUser.fullName || selectedUser.username}!</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message, idx) => (
                        <div
                          key={message._id || idx}
                          className={`flex ${message.userId === (user._id || user.id) ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[50%] rounded-2xl px-4 py-3 relative group shadow-sm ${
                              message.userId === (user._id || user.id)
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-md'
                            }`}
                          >
                            {message.userId !== (user._id || user.id) && (
                              <div className={`font-semibold text-sm mb-1 text-gray-600 dark:text-gray-300`}>
                                {message.username}
                              </div>
                            )}
                            <div className="break-words leading-relaxed">{message.content}</div>
                            <div className={`text-xs mt-2 ${
                              message.userId === (user._id || user.id)
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {new Date(message.timestamp).toLocaleString()}
                            </div>
                            {message.userId === (user._id || user.id) && (
                              <button
                                onClick={() => handleDeleteMessage(message._id)}
                                className="absolute -top-2 -right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-600"
                                title="Delete message"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Form */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${selectedUser.fullName || selectedUser.username}...`}
                        className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        maxLength={500}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageBox;