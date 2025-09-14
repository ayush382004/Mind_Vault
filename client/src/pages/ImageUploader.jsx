import { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import { FaUpload, FaImage, FaSpinner, FaCloudUploadAlt, FaRegClock, FaTrash } from "react-icons/fa";

const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET;

const decryptMemory = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[Failed to decrypt]";
  }
};

export default function ImageUploader({ userId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [imageMemories, setImageMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("emotion", "neutral");

    try {
      setStatus("Uploading...");
      await axios.post("http://localhost:5000/api/upload/image", formData);
      setStatus("✅ Uploaded successfully!");
      setFile(null);
      fetchImageMemories();
    } catch (err) {
      setStatus("❌ Upload failed");
    }
  };

  const fetchImageMemories = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/memories/${userId}`);
      const images1 = res.data.images || [];

      const decrypted = await Promise.all(
        images1.map(async (mem) => {
          if (mem.encrypted && mem.ipfsUrl) {
            try {
              const { data } = await axios.get(mem.ipfsUrl);
              const decryptedContent = decryptMemory(data);
              return { ...mem, decryptedContent };
            } catch {
              return { ...mem, decryptedContent: "[IPFS fetch failed]" };
            }
          } else {
            return { ...mem, decryptedContent: mem.content };
          }
        })
      );

      setImageMemories(decrypted);
    } catch (err) {
      console.error("❌ Error fetching image memories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const deleteMemory = async (memoryId) => {
    try {
      await axios.delete(`http://localhost:5000/api/memories/${memoryId}`);
      fetchImageMemories();
    } catch (err) {
      console.error("Error deleting memory:", err);
    }
  };

  useEffect(() => {
    fetchImageMemories();
  }, [userId]);

  return (
    <div className="w-full h-full pb-0 lg:pb-5 flex flex-col lg:flex-row gap-4 overflow-auto custom-scrollbar lg:overflow-hidden">
      <div className="lg:w-1/4 bg-[#0f1117] rounded-2xl p-4 border border-zinc-800 shadow-2xl lg:overflow-hidden h-full">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-700">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
            <FaImage className="text-white text-lg" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Image Memories</h2>
            <p className="text-zinc-400 text-sm">
              Upload images with AI-generated insights
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FaUpload className="text-blue-400" />
            Upload New Image
          </h3>

          <div
            className={`relative group mb-4 ${
              isDragging ? "border-blue-500 bg-blue-900/10" : "border-zinc-600"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <label className="relative w-full h-48 bg-zinc-800/50 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
              <FaCloudUploadAlt
                className={`text-3xl mb-3 ${
                  file ? "text-blue-400" : "text-zinc-500"
                }`}
              />
              {file ? (
                <p className="text-zinc-300 font-medium text-center px-4 truncate w-full">
                  {file.name}
                </p>
              ) : (
                <>
                  <p className="text-zinc-300 font-medium">Drop image here</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    or click to browse
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleUpload}
              disabled={!file}
              className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 flex-1 ${
                !file
                  ? "bg-zinc-800/50 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-500 hover:to-indigo-600"
              }`}
            >
              <FaCloudUploadAlt className="text-lg" />
              Upload & Analyze
            </button>

            {file && (
              <button
                onClick={() => setFile(null)}
                className="py-3 px-4 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 rounded-xl transition-all"
              >
                Clear
              </button>
            )}
          </div>

          {status && (
            <div className="mt-4 p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-zinc-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              {status}
            </div>
          )}
        </div>
      </div>

      <div className="lg:w-3/4 bg-[#0f1117] rounded-2xl p-4 border border-zinc-800 shadow-2xl lg:overflow-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <FaImage className="text-purple-400" />
            Your Image Memories
          </h3>
          <span className="bg-zinc-800/50 text-xs text-zinc-400 rounded-full px-3 py-1 border border-zinc-700">
            {imageMemories.length}{" "}
            {imageMemories.length === 1 ? "memory" : "memories"}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <FaSpinner className="text-3xl text-blue-500 animate-spin mb-4" />
            <p className="text-zinc-500">Loading your memories...</p>
          </div>
        ) : imageMemories.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-zinc-700 rounded-xl bg-gradient-to-br from-zinc-900/20 to-zinc-800/10">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4 mx-auto">
              <FaImage className="text-2xl text-zinc-600" />
            </div>
            <h4 className="text-lg font-medium text-zinc-400">
              No image memories yet
            </h4>
            <p className="text-zinc-600 mt-1 max-w-md mx-auto">
              Upload images to see AI-generated insights here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
            {imageMemories.map((mem) => (
              <div
                key={mem._id}
                className="bg-gradient-to-br from-zinc-900/30 to-zinc-800/20 border border-zinc-700 rounded-xl p-5 group hover:border-zinc-600 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <FaRegClock className="text-xs" />
                    <span>{new Date(mem.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg w-16 h-16 flex items-center justify-center shrink-0">
                    <FaImage className="text-zinc-600 text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-700">
                      <p className="text-zinc-200 whitespace-pre-wrap text-sm">
                        {mem.decryptedContent}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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