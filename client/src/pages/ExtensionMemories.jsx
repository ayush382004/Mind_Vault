import { useEffect, useState } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import {
  FaPuzzlePiece,
  FaLink,
  FaClock,
  FaRegSmile,
  FaRegCopy,
  FaTrash,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET;
const EXTENSION_ID = import.meta.env.VITE_EXTENSION_ID;

// Decrypt function
const decryptMemory = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[Failed to decrypt]";
  }
};

export default function ExtensionMemories({ userId }) {
  const [extensionNotes, setExtensionNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const connectWithExtension = () => {
    if (!window.chrome?.runtime?.sendMessage) {
      toast.error("Chrome extension not detected.");
      return;
    }

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { type: "SET_USER_ID", userId },
      (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          toast.error("❌ Failed to connect to the extension.");
          console.warn(chrome.runtime.lastError);
        } else {
          toast.success("Extension connected!");
          setIsConnected(true);
        }
      }
    );
  };

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/memories/${userId}`
        );
        const extensionMems = res.data.extensions || [];

        const withDecryption = await Promise.all(
          extensionMems.map(async (mem) => {
            if (mem.encrypted && mem.ipfsUrl) {
              try {
                const { data } = await axios.get(mem.ipfsUrl);
                const decrypted = decryptMemory(data);
                return { ...mem, decryptedContent: decrypted };
              } catch {
                return { ...mem, decryptedContent: "[IPFS fetch failed]" };
              }
            } else {
              return { ...mem, decryptedContent: mem.content };
            }
          })
        );

        setExtensionNotes(withDecryption);
      } catch (err) {
        console.error("❌ Failed to fetch extension memories", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchMemories();
  }, [userId]);

  return (
    <div className="w-full bg-gradient-to-br from-zinc-900/40 to-zinc-800/20 backdrop-blur-lg border border-zinc-700 rounded-2xl p-6 shadow-xl shadow-blue-900/10">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <FaPuzzlePiece className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Extension-Saved Notes</h2>
            <p className="text-zinc-400 text-sm">
              Notes captured from your browser extension
            </p>
          </div>
        </div>

        <button
          onClick={connectWithExtension}
          className={`px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
            isConnected
              ? "bg-gradient-to-r from-green-600/30 to-green-700/20 border border-green-700/50 text-green-400"
              : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-500 hover:to-indigo-600"
          }`}
        >
          <FaLink className="text-sm" />
          {isConnected ? " Connected" : " Connect Extension"}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-zinc-500">Loading extension memories...</p>
        </div>
      ) : extensionNotes.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-zinc-700 rounded-xl bg-gradient-to-br from-zinc-900/20 to-zinc-800/10">
          <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 mx-auto">
            <FaPuzzlePiece className="text-2xl text-zinc-600" />
          </div>
          <h3 className="text-lg font-medium text-zinc-400">
            No extension notes found
          </h3>
          <p className="text-zinc-600 mt-1 max-w-md mx-auto">
            {isConnected
              ? "Your browser-saved notes will appear here automatically"
              : "Connect the extension to view your saved notes"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {extensionNotes.map((mem) => (
            <div
              key={mem._id}
              className="bg-gradient-to-br from-zinc-900/30 to-zinc-800/20 border border-zinc-700 rounded-xl p-5 group hover:border-zinc-600 transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <FaClock className="text-xs" />
                  <span>{new Date(mem.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(mem.decryptedContent)
                    }
                    className="text-zinc-500 hover:text-blue-400 transition-colors p-1.5"
                    title="Copy content"
                  >
                    <FaRegCopy className="text-sm" />
                  </button>
                </div>
              </div>

              <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-700 mb-3">
                <p className="text-zinc-200 whitespace-pre-wrap">
                  {mem.decryptedContent || "[No content]"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {mem.emotion && (
                  <div className="flex items-center gap-1 text-xs bg-amber-900/20 text-amber-400 px-2.5 py-1 rounded-full">
                    <FaRegSmile className="text-xs" />
                    <span>{mem.emotion}</span>
                  </div>
                )}

                {mem.tags &&
                  mem.tags.length > 0 &&
                  mem.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-900/20 text-blue-400 px-2.5 py-1 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
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
      `}</style>
    </div>
  );
}
