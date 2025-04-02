import { useState } from 'react';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages }),
    });

    const data = await res.json();
    setMessages([...updatedMessages, { role: "assistant", content: data.reply }]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-3xl font-bold text-center text-green-700">Ihram AI – Your Pilgrimage Companion</h1>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {messages.map((msg, i) => (
            <div key={i} className={`p-2 rounded ${msg.role === "user" ? "bg-green-100 text-right" : "bg-gray-200 text-left"}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 p-2 border rounded"
            placeholder="Ask about Hajj, Umrah, or Ihram Token..."
          />
          <button onClick={sendMessage} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
