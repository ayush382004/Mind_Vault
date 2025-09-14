import { useState, useEffect } from "react";
import axios from "axios";
import CryptoJS from "crypto-js";
import {
  FaFileAlt,
  FaCloudUploadAlt,
  FaHistory,
  FaRegClock,
  FaLayerGroup,
  FaDownload,
  FaEye,
  FaFolderOpen,
  FaTimes,
} from "react-icons/fa";

const ENCRYPTION_SECRET = import.meta.env.VITE_ENCRYPTION_SECRET;

const decryptText = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "[Failed to decrypt text]";
  }
};

const decryptBase64File = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error("File decryption error:", err);
    return null;
  }
};

const DocumentUpload = ({ userId }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [expanded, setExpanded] = useState({});
  

  const handleUpload = async () => {
    if (!file || !userId) {
      setStatus("❌ Select a document and ensure you're logged in.");
      return;
    }
    const formData = new FormData();
    formData.append("document", file);
    formData.append("userId", userId);
    formData.append("emotion", "neutral");
    formData.append("tags", "document");

    try {
      setStatus("⏳ Uploading...");
      await axios.post("http://localhost:5000/api/document/upload", formData);
      setStatus("✅ Uploaded!");
      setFile(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
      setStatus("❌ Upload failed.");
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/memories/${userId}`
      );
      const docs = res.data.documents || [];
      const decrypted = await Promise.all(
        docs.map(async (doc) => {
          let content = "";
          let fileContent = null;
          if (doc.encrypted && doc.ipfsUrl) {
            try {
              const ipfsRes = await axios.get(doc.ipfsUrl);
              content = decryptText(ipfsRes.data);
            } catch {
              content = "[Failed to decrypt text]";
            }
          }
          if (doc.encrypted && doc.voiceUrl) {
            try {
              const voiceRes = await axios.get(doc.voiceUrl);
              fileContent = decryptBase64File(voiceRes.data);
            } catch {
              fileContent = null;
            }
          }
          return { ...doc, content, fileContent };
        })
      );
      setDocuments(decrypted);
    } catch (err) {
      console.error("❌ Failed to fetch documents:", err);
    }
  };

  useEffect(() => {
    if (userId) fetchDocuments();
  }, [userId]);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 h-full pr-1 lg:pr-0 overflow-auto custom-scrollbar lg:overflow-hidden pb-5">
        <div className="lg:w-2/5 bg-[#0f1117] rounded-2xl p-4 border border-zinc-800 shadow-2xl lg:overflow-hidden h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-900/30 p-3 rounded-xl">
              <FaFileAlt className="text-blue-400 text-xl" />
            </div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
              Document Manager
            </h2>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
            <label className="text-sm text-zinc-400">Select Document</label>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg blur-sm opacity-30"></div>
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg h-12 flex items-center px-4 cursor-pointer hover:border-blue-500/50 transition-colors">
                <div className="flex-1 truncate text-zinc-300">
                  {file ? file.name : "No file selected"}
                </div>
                <FaFolderOpen className="text-zinc-500" />
              </div>
              <input
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => setFile(e.target.files[0])}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={!file}
              className={`px-5 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
                file
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              <FaCloudUploadAlt /> Upload
            </button>
            {status && (
              <div
                className={`mt-4 text-sm px-4 py-2 rounded-lg ${
                  status.startsWith("✅")
                    ? "bg-emerald-900/30 text-emerald-400"
                    : status.startsWith("❌")
                    ? "bg-rose-900/30 text-rose-400"
                    : "bg-blue-900/30 text-blue-400"
                }`}
              >
                {status}
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-3/5 bg-[#0f1117] rounded-2xl p-4 border border-zinc-800 shadow-2xl lg:overflow-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FaLayerGroup className="text-purple-400 p-3 bg-purple-900/30 rounded-xl" />
              <h2 className="text-xl font-bold text-zinc-200">
                Uploaded Documents
              </h2>
            </div>
            <div className="bg-amber-500/10 text-amber-400 text-xs px-2.5 py-1 rounded-full">
              {documents.length} docs
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-2xl p-12 text-center">
              <FaFileAlt className="mx-auto text-4xl text-zinc-700 mb-3" />
              <p className="text-lg font-medium text-zinc-500">
                No documents uploaded
              </p>
              <p className="text-zinc-600 text-sm mt-1">
                Start by uploading one above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => {
                const isExpanded = expanded[doc._id];
                const preview = doc.content || "";
                const display =
                  !isExpanded && preview.length > 300
                    ? preview.slice(0, 300) + "…"
                    : preview;

                return (
                  <div
                    key={doc._id}
                    className="bg-zinc-950/50 p-5 border border-zinc-800 rounded-xl hover:border-zinc-700 transition"
                  >
                    <div className="flex flex-col gap-2 lg:flex-row justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FaFileAlt
                            className={`text-xs ${
                              doc.fileName?.endsWith(".pdf")
                                ? "text-red-500"
                                : doc.fileName?.endsWith(".txt")
                                ? "text-blue-500"
                                : "text-amber-500"
                            }`}
                          />
                          <span className="font-medium text-zinc-300 truncate max-w-[200px]">
                            {doc.fileName}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                          <FaRegClock className="text-zinc-600" />
                          {new Date(doc.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-transparent hover:border-gray-500 text-zinc-400"
                        >
                          Preview
                        </button>
                      </div>
                    </div>

                    {doc.content && (
                      <div className="mt-4 bg-zinc-900/30 p-4 rounded-lg border border-zinc-800 text-xs font-mono whitespace-pre-wrap">
                        {display}
                        {preview.length > 300 && (
                          <button
                            onClick={() =>
                              setExpanded((s) => ({
                                ...s,
                                [doc._id]: !isExpanded,
                              }))
                            }
                            className="ml-2 text-blue-400 text-xs hover:underline"
                          >
                            {isExpanded ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {previewDoc && (
        <div className="absolute top-0 left-0 w-full z-40 bg-black/60 flex items-center justify-center p-1">
          <div className="bg-[#0f1117] rounded-xl w-full h-full overflow-auto p-6 relative">
            <button
              onClick={() => setPreviewDoc(null)}
              className="absolute top-4 right-4 text-2xl text-zinc-400 hover:text-white"
            >
              <FaTimes />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <FaEye className="text-cyan-400" />
              <h3 className="text-lg font-bold text-white">Document Preview</h3>
            </div>
            {previewDoc.fileName?.endsWith(".pdf") ? (
              <iframe
                src={`data:application/pdf;base64,${previewDoc.fileContent}`}
                title="PDF Preview"
                className="w-full h-[80vh] rounded-lg bg-black/20"
              />
            ) : (
              <pre className="bg-zinc-900 p-4 rounded-lg text-xs text-zinc-300 max-h-[80vh] overflow-auto">
                {atob(previewDoc.fileContent)}
              </pre>
            )}
          </div>
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
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #60a5fa, #22d3ee);
        }
      `}</style>
    </>
  );
};

export default DocumentUpload;
