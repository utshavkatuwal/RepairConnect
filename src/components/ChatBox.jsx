import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '../lib/auth';

const fmtTime = (s) => {
  if (!s) return '';
  const d = new Date(String(s).replace(' ', 'T'));
  if (isNaN(d)) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};

const ChatBox = ({ requestId, viewerId }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const load = () => {
    fetch(`${API_URL}/get_messages.php?request_id=${requestId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setMessages(d.messages || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await fetch(`${API_URL}/send_message.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, sender_id: viewerId, message: text.trim() }),
      });
      setText('');
      load();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-head">Chat with {messages.length ? 'your technician/client' : ''}</div>
      <div className="chat-window" ref={scrollRef}>
        {loading ? (
          <p className="chat-empty">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="chat-empty">Say hello to start the conversation.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === viewerId;
            return (
              <div key={m.id} className={`msg ${mine ? 'mine' : 'theirs'}`}>
                <div className="msg-bubble">
                  <span className="msg-sender">{m.sender_name}</span>
                  <div className="msg-text">{m.message}</div>
                  <span className="msg-time">{fmtTime(m.created_at)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form className="chat-form" onSubmit={send}>
        <input
          className="chat-input"
          type="text"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-brand btn-sm" type="submit" disabled={sending || !text.trim()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4zM22 2 11 13" />
          </svg>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;