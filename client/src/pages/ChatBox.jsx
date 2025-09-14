import { useState, useRef, useEffect } from "react";
import axios from "axios";
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
import { toast } from "react-toastify";

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const isSpeechSupported =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  const chatContainerRef = useRef(null);
  const endOfMessagesRef = useRef(null);
  const userId = localStorage.getItem("userId");

  const appendMessage = (msg) => setMessages((prev) => [...prev, msg]);

  const groqSummarize = async (textToSummarize) => {
    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "compound-beta",
          messages: [
            {
              role: "system",
              content:
                "You are a concise and intelligent summarizer. Always be concise and clear.",
            },
            {
              role: "user",
              content: `Summarize the following content:\n\n${textToSummarize}`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.data.choices[0].message.content.trim();
    } catch (error) {
      console.error(
        "Groq summarization failed:",
        error.response?.data || error.message
      );
      return "⚠️ Failed to summarize.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !userId) {
      if (!userId) toast.error("Please log in to use your AI twin.");
      return;
    }
    appendMessage({ type: "user", text: input.trim() });
    setInput("");
    setLoading(true);

    try {
      const lastAiMsg = [...messages]
        .reverse()
        .find((m) => m.type === "ai" && m.text.startsWith("📝 Extracted"));
      const context = lastAiMsg
        ? `${lastAiMsg.text}\n\nUser's follow-up: ${input.trim()}`
        : input.trim();

      const { data } = await axios.post("http://localhost:5000/api/query", {
        message: context,
        userId,
      });

      appendMessage({ type: "ai", text: data.reply });
    } catch (err) {
      console.error("❌ Error:", err.message);
      appendMessage({ type: "ai", text: "⚠️ AI Twin failed to respond." });
    }
    setLoading(false);
  };

  const handleFileUpload = async (file) => {
    if (!file || !userId) return;
    const type = file.type.includes("pdf") ? "pdf" : "image";

    appendMessage({
      type: "user",
      text: `📎 Uploaded **${file.name}** — processing...`,
    });
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("buffer", file);

      const { data } = await axios.post(
        `http://localhost:5000/api/analyse/${type}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const extracted = data.text || "[No text extracted]";
      appendMessage({ type: "ai", text: `📝 Extracted:\n${extracted}` });

      const summarization = await groqSummarize(extracted);
      appendMessage({ type: "ai", text: `🤖 Summary:\n${summarization}` });
    } catch (err) {
      console.error("❌ Upload error:", err.message);
      appendMessage({ type: "ai", text: "⚠️ Failed to process the file." });
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
    e.target.value = null;
  };

  useEffect(() => {
    if (!isSpeechSupported) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.continuous = true;
    recog.maxAlternatives = 1;
    recognitionRef.current = recog;

    recog.onstart = () => {
      setInterimTranscript("");
      console.log("🎙️ Voice recognition started");
    };

    recog.onresult = (e) => {
      let finalTranscript = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += `${t} `;
        else interim += `${t} `;
      }
      setInterimTranscript(interim);
      if (finalTranscript.trim()) {
        setInput((prev) => `${(prev + " " + finalTranscript).trim()}`);
      }
    };

    recog.onerror = (e) => {
      console.error("🎤 Recognition error:", e.error);
      recog.stop();
      setListening(false);
    };

    recog.onend = () => {
      setInterimTranscript("");
      setListening(false);
      console.log("🛑 Voice recognition ended");
    };

    return () => {
      recog.abort();
    };
  }, [isSpeechSupported]);

  const toggleListening = () => {
    if (!isSpeechSupported || !recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        console.error("🔁 Could not start recognition:", err.message);
      }
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!userId) return;
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/history/${userId}`
        );
        setMessages(data.messages || []);
      } catch (err) {
        console.error("❌ Failed to load history:", err.message);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="flex flex-col h-full text-white font-sans">
      <div className="border-b border-zinc-800 px-4 py-3 bg-zinc-900/60 backdrop-blur-sm flex flex-col md:flex-row justify-between shadow-sm">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 flex items-center justify-center hover:scale-105 transition-transform">
            <svg
              className="h-5 w-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">AI Twin</h2>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Online & ready to chat
            </p>
          </div>
        </div>
        <p className="text-xs text-zinc-500 mt-2 md:mt-0 text-end italic">
          AI Twin may produce inaccurate information — verify important details
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-zinc-900/70 custom-scrollbar space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${
              m.type === "user" ? "justify-end" : "justify-start"
            } animate-fade-in`}
          >
            <div
              className={`${
                m.type === "user"
                  ? "bg-gradient-to-br from-blue-700 to-indigo-700 text-white rounded-br-none"
                  : "bg-zinc-800/80 border border-zinc-700 text-white/90 rounded-bl-none"
              } max-w-[85%] rounded-2xl p-4 shadow-md`}
            >
              <p className="font-semibold text-sm mb-1">
                {m.type === "user" ? "You" : "AI Twin"}
              </p>
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {m.text}
              </pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-zinc-800/70 border border-zinc-700 rounded-2xl p-4 max-w-[85%]">
              <p className="font-medium text-sm mb-1">AI Twin</p>
              <p className="text-sm text-white/80">
                Thinking<span className="animate-pulse">...</span>
              </p>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/60 border-t border-zinc-700">

        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer group relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-800 border border-zinc-600 text-blue-400 hover:text-white hover:bg-blue-600 transition-all duration-200"
          title="Upload file"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75V7.5a4.5 4.5 0 00-9 0v9a3 3 0 006 0V9"
            />
          </svg>
        </label>

        <input
          value={`${input}${interimTranscript ? ` ${interimTranscript}` : ""}`}
          onChange={(e) => {
            const val = e.target.value
              .replace(interimTranscript, "")
              .trimStart();
            setInput(val);
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask your AI twin anything..."
          className="flex-1 px-4 py-2 bg-zinc-900 text-white placeholder-zinc-500 text-sm rounded-lg border border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        {isSpeechSupported && (
          <button
            onClick={toggleListening}
            title={listening ? "Stop recording" : "Start voice input"}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              listening
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-zinc-800 border border-zinc-600 text-blue-400 hover:bg-blue-600 hover:text-white"
            }`}
          >
            {listening ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a2 2 0 00-2 2v6a2 2 0 104 0V4a2 2 0 00-2-2z" />
                <path
                  fillRule="evenodd"
                  d="M5 10a5 5 0 0010 0h-2a3 3 0 11-6 0H5z"
                  clipRule="evenodd"
                />
                <path d="M4 13h12v2H4v-2z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75V21m0 0h3m-3 0H9m3-3a6.75 6.75 0 006.75-6.75m-13.5 0A6.75 6.75 0 0012 18.75m0-15a3 3 0 00-3 3v6a3 3 0 006 0v-6a3 3 0 00-3-3z"
                />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="py-2 px-5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 transition"
        >
          ➤
        </button>
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

export default ChatBox;
