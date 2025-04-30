'use client';

import { useEffect, useState } from "react";
import { ethers } from "ethers";

const tokenAddress = "0x2f4fb395cf2a622fae074f7018563494072d1d95";

const tokenABI = [
  {
    "inputs":[{"internalType":"address","name":"account","type":"address"}],
    "name":"balanceOf",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[],
    "name":"decimals",
    "outputs":[{"internalType":"uint8","name":"","type":"uint8"}],
    "stateMutability":"view",
    "type":"function"
  }
];

export default function AIPlannerPage() {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function checkBalance() {
      try {
        if (!window.ethereum) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();

        const token = new ethers.Contract(tokenAddress, tokenABI, provider);
        const balance = await token.balanceOf(userAddress);
        const decimals = await token.decimals();

        const readableBalance = ethers.formatUnits(balance, decimals);
        setHasAccess(parseFloat(readableBalance) >= 1000);
      } catch (err) {
        console.error("Error checking balance", err);
      } finally {
        setLoading(false);
      }
    }

    checkBalance();
  }, []);

  async function handleAskAI() {
    setResponse("Thinking...");
    const messages = [
      { role: "user", content: prompt }
    ];

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    setResponse(data.reply || "No response received.");
  }

  async function submitFeedback() {
    const res = await fetch("/api/feedback", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        response,
        correction: feedback
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });

    const msg = await res.text();
    alert(msg === "ok" ? "✅ Feedback submitted. Thank you!" : "❌ Something went wrong.");
    setFeedback("");
  }

  if (loading) {
    return <div className="p-6 text-gray-600">Checking token balance...</div>;
  }

  if (!hasAccess) {
    return (
      <div className="p-6 text-red-600 font-medium">
        ❌ You must hold at least <b>1,000 IHRAM</b> tokens to access the AI planner.
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-green-700">Ihram AI Planner</h1>
      <p className="text-gray-600">
        Ask personalized questions about your Hajj or Umrah journey. Earn tokens by helping improve the AI.
      </p>

      <textarea
        className="w-full border p-3 rounded text-sm"
        rows={4}
        placeholder="Ask a question about Umrah, Hajj, planning, or pricing..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <button
        onClick={handleAskAI}
        className="mt-3 bg-green-700 text-white px-5 py-2 rounded hover:bg-green-800"
      >
        Ask AI
      </button>

      {response && (
        <div className="mt-6 bg-gray-100 p-4 rounded">
          <p className="font-semibold text-gray-700 mb-2">AI Response:</p>
          <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
        </div>
      )}

      {response && (
        <div className="mt-6">
          <p className="text-sm text-gray-700 mb-2">Suggest a correction (Train-to-Earn):</p>
          <textarea
            className="w-full border p-2 rounded text-sm"
            rows={3}
            placeholder="Your correction or improvement..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <button
            onClick={submitFeedback}
            className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit Feedback
          </button>
        </div>
      )}
    </main>
  );
}
