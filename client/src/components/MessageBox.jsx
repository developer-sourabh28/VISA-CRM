import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

export const MessageBox = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user && isOpen) {
      fetchMessages();
    }
  }, [user, isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      // Sort messages by timestamp in ascending order (oldest first)
      const sortedMessages = data.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          userId: user._id || user.id,
          username: user.fullName || user.name || user.username,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user._id || user.id
        }),
      });

      if (response.ok) {
        fetchMessages();
      } else {
        const error = await response.json();
        console.error('Error deleting message:', error.message);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (!user) {
    return null;
  }

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-lg rounded-lg shadow-xl w-full max-w-2xl mx-4 border border-white/20">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-4 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white">Messages</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-red-300"
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
      
          {/* Messages Display */}
          <div className="h-96 overflow-y-auto p-4 flex flex-col">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`mb-4 p-3 rounded-lg ${
                  message.userId === (user._id || user.id)
                    ? 'bg-blue-500/20 ml-auto text-white'
                    : 'bg-white/20 text-white'
                } max-w-[80%] relative group`}
              >
                <div className="font-semibold text-sm text-gray-200">
                  {message.username}
                </div>
                <div>{message.content}</div>
                <div className="text-xs text-gray-300 mt-1">
                  {new Date(message.timestamp).toLocaleString()}
                </div>
                {message.userId === (user._id || user.id) && (
                  <button
                    onClick={() => handleDeleteMessage(message._id)}
                    className="absolute top-2 right-2 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
            ))}
            <div ref={messagesEndRef} />
          </div>
      
          {/* Message Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 bg-white/10 text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
      
      
      )}
    </>
  );
};

export default MessageBox; 