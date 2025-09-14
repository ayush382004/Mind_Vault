import React, { useState, useEffect, useRef } from "react";
import {
  FaRobot,
  FaMicrophone,
  FaMicrophoneSlash,
  FaSpinner,
} from "react-icons/fa";
import { toast } from "react-toastify";

/* onFill({...}) pushes {goals, passion, about, belief} back to parent */
export default function AIFormAssistant({ onFill }) {
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [supported, setSupported] = useState(false);

  const recogRef = useRef(null);
  const userStop = useRef(false); // tracks if user clicked Stop

  /* ---------- init SpeechRecognition ---------- */
  useEffect(() => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window))
      return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = true; // keep open as long as possible
    recogRef.current = r;
    setSupported(true);

    r.onresult = (e) => {
      let fin = "",
        inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += `${txt} `;
        else inter += `${txt} `;
      }
      setInterim(inter.trim());
      if (fin.trim()) setTranscript((p) => p + fin.trim() + " ");
    };

    /* Chrome still fires onend after long silence.
       If the user did NOT click Stop, restart automatically. */
    r.onend = () => {
      setInterim("");
      if (userStop.current) {
        setListening(false); // final stop
      } else {
        try {
          r.start();
        } catch {
          /* will auto-retry soon */
        }
      }
    };
  }, []);

  /* ---------- mic controls ---------- */
  const startRec = () => {
    if (!supported || listening || processing) return;
    setTranscript("");
    setInterim("");
    userStop.current = false;
    setListening(true);
    try {
      recogRef.current.start();
    } catch {}
  };

  const stopRec = () => {
    if (!listening) return;
    userStop.current = true;
    recogRef.current.stop();
  };

  /* ---------- Groq call ---------- */
  const callGroq = async () => {
    if (!transcript.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "compound-beta",
            messages: [
              {
                role: "system",
                content:
                  "You are a JSON formatter. After reading the user's speech transcript, " +
                  "respond with **one valid JSON object only** (no markdown, no code fences, " +
                  "no extra keys). The object must contain exactly these keys: " +
                  '"goals", "passion", "about", "belief". ' +
                  "For each key, fill in the most relevant information from the transcript and improve by yourself" +
                  "using clear natural language. Output nothing except the JSON.",
              },
              { role: "user", content: transcript },
            ],
            temperature: 0.2,
          }),
        }
      );
      const data = await res.json();
      const raw = (data?.choices?.[0]?.message?.content || "").trim();
      console.log("RAW DATA:", raw);

      // ----- robust parse -----
      let json;
      const tryString = (str) => {
        try {
          return JSON.parse(str);
        } catch {
          return null;
        }
      };
      json = tryString(raw);
      if (!json) {
        // strip common wrappers: ```json … ```, ``` … ```, “Here is…”, etc.
        const cleaned = raw
          .replace(/```json|```/gi, "")
          .replace(/^[^{]*\{/s, "{") // cut anything before first {
          .replace(/\}[^}]*$/s, "}"); // cut anything after last }
        json = tryString(cleaned);
      }
      if (!json) throw new Error("Failed to parse AI JSON");

      console.log("JSON:", json);

      onFill && onFill(json);
    } catch (err) {
      console.error("Groq error:", err);
      toast.error("AI request failed. Check console / API key.");
    } finally {
      setProcessing(false);
      setTranscript("");
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-3 mt-2">
      <button
        onClick={listening ? stopRec : startRec}
        disabled={!supported || processing}
        className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition
          ${
            listening
              ? "bg-red-500/20 text-red-400"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }
          ${processing && "opacity-50 cursor-not-allowed"}`}
      >
        {processing ? (
          <FaSpinner className="animate-spin" />
        ) : listening ? (
          <FaMicrophoneSlash />
        ) : (
          <FaRobot />
        )}
        {processing
          ? "Processing…"
          : listening
          ? "Stop recording"
          : "AI Fill Assistant"}
      </button>

      {interim && <p className="italic text-blue-400 text-sm">{interim}</p>}

      {!listening && !processing && transcript && (
        <button
          onClick={callGroq}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
        >
          Send to AI
        </button>
      )}
    </div>
  );
}
