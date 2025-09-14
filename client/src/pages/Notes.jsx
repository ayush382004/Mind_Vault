import React, { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";

import { FiFileText, FiMic, FiFolder } from "react-icons/fi";
import { FaPuzzlePiece, FaImage } from "react-icons/fa";
import VoiceMemoUpload from "./VoiceMemoUpload";
import DocumentUpload from "./DocumentUpload";
import ExtensionMemories from "./ExtensionMemories";
import ImageUploader from "./ImageUploader";
import { toast } from "react-toastify";


const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET;

const decryptMemory = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[Failed to decrypt]";
  }
};

const Notes = () => {
  const [activeTab, setActiveTab] = useState("notes");
  const [note, setNote] = useState("");
  const [notesHistory, setNotesHistory] = useState([]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  const tabIcons = {
    notes: <FiFileText className="w-5 h-5" />,
    voice: <FiMic className="w-5 h-5" />,
    file: <FiFolder className="w-5 h-5" />,
    extension: <FaPuzzlePiece className="w-5 h-5" />,
    image: <FaImage className="w-5 h-5" />,
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/memories/${userId}`
      );
      const notes = res.data.notes || [];

      const decryptedNotes = await Promise.all(
        notes.map(async (note) => {
          if (note.encrypted && note.ipfsUrl) {
            try {
              const ipfsRes = await axios.get(note.ipfsUrl);
              const decrypted = decryptMemory(ipfsRes.data);
              return { ...note, content: decrypted || "[Failed to decrypt]" };
            } catch (err) {
              return { ...note, content: "[IPFS fetch error]" };
            }
          } else {
            return note;
          }
        })
      );

      setNotesHistory(decryptedNotes);
    } catch (err) {
      console.error("❌ Failed to fetch notes:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note.trim()) return;

    try {
      await axios.post("http://localhost:5000/api/memories", {
        userId,
        content: note,
        tags: ["note"],
        emotion: "neutral",
      });

      setNote("");
      setSuccess(true);
      fetchNotes();
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error("❌ Failed to save note:", err.message);
      toast.error("Error saving note");
    }
  };

  useEffect(() => {
    if (userId) fetchNotes();
  }, []);

  return (
    <div className="h-full flex flex-col p-3 relative ">
      {/* Tabs */}
      <div className="flex mb-4 gap-2">
        {["notes", "voice", "file", "extension", "image"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[16px] font-medium capitalize border transition-all duration-300 ${
              activeTab === tab
                ? "bg-gradient-to-r from-blue-600/80 to-indigo-600/80 shadow-lg shadow-blue-500/10 border-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            }`}
          >
            {tabIcons[tab]}
            {tab}
          </button>
        ))}
      </div>

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="flex flex-col md:flex-row gap-4 md:h-[90%] overflow-y-scroll md:overflow-hidden custom-scrollbar">
          {/* Note Creation Card */}
          <div className="relative md:w-2/4 flex flex-col bg-[#0f11178b] backdrop-blur-lg rounded-xl border border-zinc-700 p-5 shadow-lg shadow-blue-900/10 h-full">
            {/* Header + Textarea */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <label className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                New Secure Note
              </label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type your private note here..."
                className="flex-1 p-4 rounded-xl bg-zinc-900/60 border border-zinc-700 text-zinc-100 placeholder-zinc-500 outline-none
        focus:border-1 focus:border-blue-500/70 transition-all duration-200
        resize-none scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
              />
            </div>

            {/* Footer */}
            <div className="mt-4">
              {success && (
                <div className="mb-3 flex items-center text-green-400 bg-green-900/20 rounded-lg p-3 border border-green-800/50 animate-fadeIn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Note secured successfully!
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-zinc-400 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  End-to-end encrypted
                </div>

                <button
                  onClick={handleSaveNote}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl font-medium text-white
          hover:from-blue-500 hover:to-indigo-600 transition-all duration-300
          transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
          flex items-center justify-center gap-2 min-w-[140px]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Save Note
                </button>
              </div>
            </div>
          </div>

          {/* Saved Notes */}
          <div className="flex-1 flex flex-col bg-[#0f11178b] border border-zinc-700 rounded-xl backdrop-blur-lg ">
            <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-900/20">
              <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Your Encrypted Notes
              </h2>
              <span className="bg-zinc-800/50 text-xs text-zinc-400 rounded-full px-3 py-1 border border-zinc-700">
                {notesHistory.length}{" "}
                {notesHistory.length === 1 ? "note" : "notes"}
              </span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="w-12 h-12 border-4 border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-500">Decrypting your notes...</p>
                </div>
              ) : notesHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 border-2 border-dashed border-zinc-700 rounded-xl bg-gradient-to-br from-zinc-900/10 to-zinc-800/5">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 border border-zinc-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-zinc-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-zinc-400">
                    No notes yet
                  </h3>
                  <p className="text-zinc-600 mt-1 max-w-md">
                    Your saved notes will appear here. All notes are encrypted
                    for maximum security.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {notesHistory.map((n, i) => (
                    <div
                      key={i}
                      className="bg-zinc-800/40 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50 hover:border-zinc-600 transition-all duration-300 group"
                    >
                      <p className="text-zinc-200 whitespace-pre-wrap mb-3 group-hover:text-zinc-100 transition-colors">
                        {n.content}
                      </p>
                      <div className="flex justify-between items-center text-xs text-zinc-500 pt-3 border-t border-zinc-800/50">
                        <span className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                        <span className="bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Voice Tab */}
      {activeTab === "voice" && (
        <div className="h-full lg:h-[90%] pb-10 lg:pb-0">
          <VoiceMemoUpload userId={userId} />
        </div>
      )}

      {/* File Tab */}
      {activeTab === "file" && (
        <div className="h-full lg:h-[94%] pb-10 lg:pb-0">
          <DocumentUpload userId={userId} />
        </div>
      )}

      {activeTab === "extension" && (
        <div className="h-full lg:h-[94%] pb-10 lg:pb-0">
          <ExtensionMemories userId={userId} />
        </div>
      )}
      
      {activeTab === "image" && (
        <div className="h-full lg:h-[94%] pb-10 lg:pb-0">
         <ImageUploader userId={userId} />
        </div>
      )}
      {/* Scrollbar and fade animation CSS */}
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

export default Notes;
