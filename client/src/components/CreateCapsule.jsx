import { useState } from "react";
import { ethers,isAddress } from "ethers";
import { abi, contractAddress } from "../contracts/LegacyCapsule";
import CryptoJS from "crypto-js";

const CreateCapsule = () => {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [status, setStatus] = useState("");

  const LIGHTHOUSE_KEY = import.meta.env.VITE_LIGHTHOUSE_KEY;
  const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET;

  const encryptMessage = (msg) => {
    if (!ENCRYPTION_SECRET) {
      throw new Error("❌ ENCRYPTION_SECRET is missing");
    }
    return CryptoJS.AES.encrypt(msg, ENCRYPTION_SECRET).toString();
  };

  const uploadToIPFS = async (encryptedMessage) => {
    const formData = new FormData();
    const file = new Blob([encryptedMessage], { type: "text/plain" });
    formData.append("file", file, "capsule.txt");

    const res = await fetch("https://node.lighthouse.storage/api/v0/add", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LIGHTHOUSE_KEY}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error("IPFS upload failed: " + err.message);
    }

    const data = await res.json();
    return data.Hash; 
  };

  const createCapsule = async () => {
    try {
      setStatus("⏳ Encrypting and uploading...");

      if (!window.ethereum) throw new Error("Please install MetaMask");

      if (!isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      const encrypted = encryptMessage(message);
      const cid = await uploadToIPFS(encrypted);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      const unlockTimestamp = Math.floor(new Date(unlockDate).getTime() / 1000);
      const tx = await contract.createCapsule(recipient, cid, unlockTimestamp);

      setStatus("📦 Waiting for confirmation...");
      await tx.wait();

      setStatus("✅ Capsule created successfully!");
      setRecipient("");
      setMessage("");
      setUnlockDate("");
    } catch (err) {
      console.error("❌ Capsule creation error:", err);
      setStatus("❌ Failed to create capsule: " + err.message);
    }
  };

  return (
  <div className="h-full flex flex-col">
    <div className="mb-6 pb-4 border-b border-zinc-700">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/20 flex items-center justify-center border border-blue-600/30">
          <span className="text-2xl">📦</span>
        </div>
        Create Time Capsule
      </h2>
      <p className="text-zinc-400 text-sm mt-2">
        Seal a message for the future. Your digital legacy awaits.
      </p>
    </div>

    <div className="space-y-5 flex-1">
      <div>
        <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Recipient Wallet Address
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full p-3 pl-10 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none transition-all placeholder:text-zinc-500"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-500 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Your Secret Message
        </label>
        <div className="relative">
          <textarea
            placeholder="Write your message for the future..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent outline-none min-h-[150px] resize-none transition-all placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Unlock Date & Time
        </label>
        <div className="relative">
          <input
            type="datetime-local"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-transparent outline-none transition-all"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-500 absolute right-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {status && (
        <div className={`p-3 rounded-xl border ${
          status.startsWith("✅") 
            ? "bg-green-900/20 border-green-800/50 text-green-400" 
            : status.startsWith("❌") 
              ? "bg-red-900/20 border-red-800/50 text-red-400" 
              : "bg-amber-900/20 border-amber-800/50 text-amber-400"
        } flex items-center gap-2`}>
          {status.startsWith("✅") ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : status.startsWith("❌") ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
          <span>{status}</span>
        </div>
      )}

      <button
        onClick={createCapsule}
        disabled={!recipient || !message || !unlockDate}
        className={`mt-2 w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${
          !recipient || !message || !unlockDate
            ? "bg-zinc-800/50 text-zinc-500 border border-zinc-700 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-500 hover:to-indigo-600 hover:shadow-blue-500/30"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        🚀 Launch Time Capsule
      </button>
    </div>

    <div className="mt-auto pt-5 border-t border-zinc-800">
      <div className="flex items-center gap-3 bg-zinc-900/30 border border-zinc-700 rounded-xl p-3">
        <div className="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <p className="text-xs text-zinc-400">
          Your message is encrypted and stored securely on the blockchain. 
          Only the recipient will be able to unlock it at the specified time.
        </p>
      </div>
    </div>
  </div>
);
};

export default CreateCapsule;
