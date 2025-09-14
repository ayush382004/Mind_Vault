import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUpload,
  FaMicrophone,
  FaHistory,
  FaFileAudio,
  FaCalendar,
  FaTags,
  FaBrain,
  FaCloudUploadAlt,
  FaRegClock,
  FaSmile,
} from "react-icons/fa";

import CryptoJS from "crypto-js";

const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET;

const decryptMemory = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[Failed to decrypt]";
  }
};

const base64ToBlobURL = (base64, mimeType = "audio/mpeg") => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
};

const VoiceMemoUpload = ({ userId }) => {
  const [audioFile, setAudioFile] = useState(null);
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState([]);

  const handleUpload = async () => {
    if (!audioFile || !userId) {
      setStatus("❌ Please select an audio file and ensure you're logged in.");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("userId", userId);
    formData.append("emotion", "neutral");
    formData.append("tags", "voice");

    try {
      setStatus("⏳ Uploading and transcribing...");
      const res = await axios.post(
        "http://localhost:5000/api/voice-memory",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setStatus("✅ Voice memo saved!");
      setTranscript(res.data.transcript);
      setAudioFile(null);
      fetchHistory();
    } catch (err) {
      console.error("Upload failed:", err);
      setStatus(
        "❌ Upload failed: " + (err.response?.data?.error || err.message)
      );
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/memories/${userId}`
      );
      const voiceMemos = res.data.voices || [];

      const decrypted = await Promise.all(
        voiceMemos.map(async (m) => {
          let content = "[Failed to decrypt transcript]";
          let audioUrl = null;

          // Decrypt transcript
          if (m.encrypted && m.ipfsUrl) {
            try {
              const ipfsRes = await axios.get(m.ipfsUrl);
              content = decryptMemory(ipfsRes.data);
            } catch {
              console.warn("Transcript decryption failed for:", m.ipfsUrl);
            }
          }

          // Decrypt voice (audio)
          if (m.encrypted && m.voiceUrl) {
            try {
              const audioRes = await axios.get(m.voiceUrl);
              const decryptedBase64 = decryptMemory(audioRes.data);
              audioUrl = base64ToBlobURL(decryptedBase64);
            } catch {
              console.warn("Audio decryption failed for:", m.voiceUrl);
            }
          }

          return { ...m, content, audioUrl };
        })
      );

      setHistory(decrypted);
    } catch (err) {
      console.error("❌ Failed to fetch voice history:", err);
    }
  };

  useEffect(() => {
    if (userId) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="w-full h-full pr-1 lg:pr-0 overflow-y-scroll custom-scrollbar">

      <div className="flex flex-col lg:flex-row gap-4 h-full rounded-2xl">
        <div className="flex flex-col lg:w-2/5 bg-[#0f11178b] backdrop-blur-lg border border-zinc-700 rounded-2xl p-4 shadow-xl shadow-blue-900/10">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-700">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
              <FaMicrophone className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Voice Memos</h2>
              <p className="text-zinc-400 text-sm">
                Capture thoughts with voice, transcribed instantly
              </p>
            </div>
          </div>{" "}
          <div className=" overflow-y-auto custom-scrollbar pr-1">
            {/* Upload Section */}
            <div className="mb-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FaUpload className="text-blue-400" />
                Upload Voice Memo
              </h3>

              <div className="relative group mb-4">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
                <label className="relative w-full h-40 bg-zinc-800/50 border-2 border-dashed border-zinc-600 rounded-xl flex flex-col items-center justify-center cursor-pointer group-hover:border-blue-500 transition-all">
                  <FaCloudUploadAlt className="text-3xl text-blue-400 mb-3" />
                  <p className="text-zinc-300 font-medium">
                    Drop audio file here
                  </p>
                  <p className="text-zinc-500 text-sm mt-1">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files[0])}
                    className="hidden"
                  />
                  {audioFile && (
                    <p className="text-sm text-zinc-400 mt-2 text-center">
                      Selected:{" "}
                      <span className="font-medium text-blue-400">
                        {audioFile.name}
                      </span>
                    </p>
                  )}
                </label>
              </div>

              <button
                onClick={handleUpload}
                disabled={!audioFile}
                className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                  !audioFile
                    ? "bg-zinc-800/50 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-500 hover:to-indigo-600 hover:shadow-blue-500/30"
                }`}
              >
                <FaCloudUploadAlt className="text-lg" />
                Upload & Transcribe
              </button>

              {status && (
                <div className="mt-4 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-zinc-300 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  {status}
                </div>
              )}
            </div>
            {/* Latest Transcript */}
            {transcript && (
              <div className="mb-8 bg-gradient-to-br from-zinc-900/30 to-zinc-800/20 border border-zinc-700 rounded-xl p-5 animate-fadeIn">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <FaFileAudio className="text-purple-400" />
                  Latest Transcript
                </h3>
                <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-700">
                  <p className="whitespace-pre-wrap text-zinc-200">
                    {transcript}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Past Voice Notes */}
        <div className="lg:w-3/5 bg-[#0f11178b] backdrop-blur-lg border border-zinc-700 rounded-2xl p-6 shadow-xl shadow-blue-900/10 lg:overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FaHistory className="text-amber-400" />
              Voice Note History
            </h3>
            <span className="bg-zinc-800/50 text-xs text-zinc-400 rounded-full px-3 py-1 border border-zinc-700">
              {history.length} {history.length === 1 ? "note" : "notes"}
            </span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-zinc-700 rounded-xl bg-gradient-to-br from-zinc-900/20 to-zinc-800/10">
              <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 mx-auto">
                <FaMicrophone className="text-2xl text-zinc-600" />
              </div>
              <h4 className="text-lg font-medium text-zinc-400">
                No voice notes yet
              </h4>
              <p className="text-zinc-600 mt-1 max-w-md mx-auto">
                Your transcribed voice memos will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4 h-full overflow-y-auto custom-scrollbar lg:pr-1 lg:pb-10">
              {history.map((memory) => (
                <div
                  key={memory._id}
                  className="bg-gradient-to-br from-zinc-900/30 to-zinc-800/20 border border-zinc-700 rounded-xl p-5 group hover:border-zinc-600 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <FaBrain className="text-purple-400" />
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                        {memory.content}
                      </p>
                    </div>
                  </div>

                  {memory.audioUrl && (
                    <div className="mt-3">
                      <audio controls className="w-full">
                        <source src={memory.audioUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {memory.emotion && (
                      <span className="text-xs bg-amber-900/20 text-amber-400 px-2 py-1 rounded flex items-center gap-1">
                        <FaSmile className="text-xs" />
                        <span>{memory.emotion}</span>
                      </span>
                    )}

                    {memory.tags.length > 0 && (
                      <span className="text-xs bg-blue-900/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                        <FaTags className="text-xs" />
                        <span>{memory.tags.join(", ")}</span>
                      </span>
                    )}

                    <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-1 rounded flex items-center gap-1 ml-auto">
                      <FaRegClock className="text-xs" />
                      <span>
                        {new Date(memory.createdAt).toLocaleDateString()}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add to global CSS */}
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
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default VoiceMemoUpload;
