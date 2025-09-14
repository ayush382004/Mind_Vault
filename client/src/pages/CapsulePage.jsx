import { useState } from "react";
import CreateCapsule from "../components/CreateCapsule";
import ViewCapsules from "../components/ViewCapsules";
import { ethers } from "ethers";

const CapsulePage = () => {
  const [activeTab, setActiveTab] = useState("none");
  const [walletConnected, setWalletConnected] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("MetaMask not detected");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      setWalletConnected(true);
      setError("");
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError("🦊 Please connect your MetaMask wallet to proceed.");
    }
  };

  const handleAction = async (tab) => {
    await connectWallet();
    if (window.ethereum) {
      setActiveTab(tab);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 mx-4 my-2 p-1 rounded-xl max-w-md ">
        {[
          { id: "create", label: "Create Capsule", icon: "✍️" },
          { id: "view", label: "View Capsules", icon: "🎁" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleAction(tab.id)}
            className={`px-4 py-3 rounded-xl flex-1 flex items-center justify-center gap-2 transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-600/80 to-indigo-600/80 shadow-lg shadow-blue-500/10"
                : "bg-zinc-800/30 hover:bg-zinc-700/50 text-zinc-400"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-xl flex items-center gap-3 max-w-md mx-auto animate-fadeIn">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-300">{error}</p>
        </div>
      )}

      <div className="flex-1 bg-gradient-to-br from-zinc-900/30 to-zinc-800/20 border border-zinc-700 rounded-2xl p-6 backdrop-blur-lg overflow-auto mx-4 mb-2 custom-scrollbar">
        {walletConnected ? (
          <>
            {activeTab === "create" && <CreateCapsule />}
            {activeTab === "view" && <ViewCapsules />}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Wallet Not Connected</h3>
            <p className="text-zinc-400 max-w-md">
              Connect your wallet to create and view your time capsules. Your
              digital legacy awaits.
            </p>
          </div>
        )}
      </div>

      <div className="absolute top-20 right-10 w-4 h-4 rounded-full bg-blue-500/30 blur-md"></div>
      <div className="absolute bottom-1/3 left-10 w-6 h-6 rounded-full bg-indigo-500/30 blur-md"></div>

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
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in;
        }
      `}</style>
    </div>
  );
};

export default CapsulePage;
