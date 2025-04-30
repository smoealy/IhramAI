'use client';

import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';

const tokenAddress = '0x2f4fb395cf2a622fae074f7018563494072d1d95';

const tokenABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
];

export default function AIPlannerPage() {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    async function checkBalance() {
      try {
        if (!window.ethereum) return;
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send('eth_requestAccounts', []);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const token = new ethers.Contract(tokenAddress, tokenABI, provider);
        const balance = await token.balanceOf(userAddress);
        const decimals = await token.decimals();
        const readableBalance = ethers.formatUnits(balance, decimals);
        setHasAccess(parseFloat(readableBalance) >= 1000);
      } catch (err) {
        console.error('Error checking balance', err);
      } finally {
        setLoading(false);
      }
    }
    checkBalance();
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function handleSubmit() {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: newMessages }),
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
  }

  if (loading) return <div className="p-6 text-gray-500">Checking your token balance…</div>;
  if (!hasAccess)
    return (
      <div className="p-6 text-red-600 font-medium">
        ❌ You must hold at least <strong>1,000 IHRAM</strong> tokens to use the AI planner.
      </div>
    );

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-700">💬 Ihram AI Planner</h1>
      <div className="border rounded-lg h-[400px] overflow-y-auto p-4 bg-gray-50 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm p-2 rounded ${
              msg.role === 'user' ? 'bg-white text-right' : 'bg-green-100 text-left'
            }`}
          >
            <span className="block font-medium">{msg.role === 'user' ? '🧕 You' : '🤖 Ihram AI'}</span>
            <p>{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 text-sm"
          placeholder="Type your question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <button onClick={handleSubmit} className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800">
          Send
        </button>
      </div>
    </main>
  );
}
