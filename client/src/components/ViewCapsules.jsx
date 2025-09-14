import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { abi, contractAddress } from "../contracts/LegacyCapsule";
import CryptoJS from "crypto-js";

const ViewCapsules = () => {
  const [capsules, setCapsules] = useState([]);
  const [status, setStatus] = useState("");

  const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET;

  const decryptMessage = (encrypted) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_SECRET);
      return bytes.toString(CryptoJS.enc.Utf8) || "[❌ Empty after decryption]";
    } catch {
      return "[❌ Failed to decrypt]";
    }
  };

  const loadCapsules = async () => {
    try {
      setStatus("🔍 Connecting to wallet...");
      if (!window.ethereum) throw new Error("MetaMask not found");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const contract = new ethers.Contract(contractAddress, abi, signer);

      setStatus("📡 Fetching capsules...");
      const capsuleList = await contract.getCapsulesForRecipient(userAddress);
      const now = Math.floor(Date.now() / 1000);

      const unlockedCapsules = await Promise.all(
        capsuleList
          .filter(cap => Number(cap.unlockTimestamp) <= now)
          .map(async cap => {
            try {
              const res = await fetch(`https://gateway.lighthouse.storage/ipfs/${cap.ipfsCID}`);
              const encrypted = await res.text();
              return {
                sender: cap.creator,
                unlockTime: new Date(Number(cap.unlockTimestamp) * 1000).toLocaleString(),
                message: decryptMessage(encrypted)
              };
            } catch (e) {
              return {
                sender: cap.creator,
                unlockTime: new Date(Number(cap.unlockTimestamp) * 1000).toLocaleString(),
                message: "[❌ Failed to fetch from IPFS]"
              };
            }
          })
      );

      setCapsules(unlockedCapsules);
      setStatus("");
    } catch (err) {
      console.error("ViewCapsules Error:", err);
      setStatus("❌ Failed to load capsules: " + err.message);
    }
  };

  useEffect(() => {
    loadCapsules();
  }, []);

  return (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-700">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-amber-600/30 to-amber-500/20 flex items-center justify-center border border-amber-600/30">
            <span className="text-xl">🎁</span>
          </div>
          Your Unlocked Time Capsules
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          Messages from your past, unlocked at the right moment
        </p>
      </div>
      <div className="bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700 text-sm">
        {capsules.length} {capsules.length === 1 ? 'Capsule' : 'Capsules'}
      </div>
    </div>

    {status && (
      <div className="mb-5 p-3 bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-700/50 rounded-xl flex items-center gap-3 animate-fadeIn">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-amber-300">{status}</p>
      </div>
    )}

    {capsules.length === 0 ? (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-700 rounded-2xl bg-gradient-to-br from-zinc-900/20 to-zinc-800/10">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-amber-600/10 to-amber-500/5 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-amber-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">No Unlocked Capsules</h3>
        <p className="text-zinc-500 max-w-md">
          Your future self hasn't sent any messages yet. Create a new time capsule to be unlocked later.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-4 overflow-y-auto custom-scrollbar">
        {capsules.map((cap, i) => (
          <div 
            key={i} 
            className="bg-gradient-to-br from-zinc-800/30 to-zinc-800/10 border border-zinc-700 rounded-2xl p-5 backdrop-blur-sm group hover:border-amber-500/30 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-mono text-sm text-amber-400 bg-amber-900/20 px-2 py-1 rounded">
                    {cap.sender.substring(0, 6)}...{cap.sender.substring(cap.sender.length - 4)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Unlocked at {cap.unlockTime}</span>
                </div>
              </div>
              
              <div className="bg-amber-900/10 border border-amber-800/30 rounded-lg px-2 py-1 text-xs text-amber-400">
                #{capsules.length - i}
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-zinc-900/30 rounded-xl border border-zinc-700 group-hover:border-amber-500/20 transition-all">
              <p className="whitespace-pre-wrap text-zinc-200 group-hover:text-amber-50 transition-colors">
                {cap.message}
              </p>
            </div>
            
            <div className="mt-4 flex justify-end">
              <div className="text-xs text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
                {new Date(cap.unlockTime).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    <style jsx>{`
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #3f3f46;
        border-radius: 3px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #52525b;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out forwards;
      }
    `}</style>
  </div>
);
};

export default ViewCapsules;
