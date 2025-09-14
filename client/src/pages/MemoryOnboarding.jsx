import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { FaBullseye, FaFire, FaUserAlt, FaBrain, FaArrowRight } from "react-icons/fa";

const MemoryOnboarding = () => {
  const [form, setForm] = useState({
    goals: '',
    passion: '',
    about: '',
    belief: '',
  });

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      alert("Session expired. Please log in again.");
      navigate('/login');
    }
  }, [userId, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const combinedMemory = `
    Goals: ${form.goals.trim()}
    Passion: ${form.passion.trim()}
    About Me: ${form.about.trim()}
    Strong Belief: ${form.belief.trim()}
    `;

    try {
      await axios.post('http://localhost:5000/api/memories', {
        userId,
        content: combinedMemory,
        tags: ['onboarding', 'profile'],
        emotion: 'neutral',
      });

      alert("✅ Onboarding memory saved successfully!");
      navigate('/dashboard');
    } catch (err) {
      console.error("❌ Failed to save onboarding memory:", err.message);
      alert("Error saving your memory. Please try again.");
    }
  };

return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
    <div className="w-full max-w-2xl bg-zinc-900/80 backdrop-blur-lg border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-900/10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
          <div className="text-2xl">👤</div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Let's Get to Know You
        </h2>
        <p className="text-zinc-400">
          Help your AI twin understand your personality and aspirations
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Goals */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 group-hover:border-zinc-600 transition-all">
            <label className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <FaBullseye className="text-blue-400" />
              What are your current goals?
            </label>
            <textarea
              name="goals"
              value={form.goals}
              onChange={handleChange}
              required
              placeholder="💭 Share your personal and professional aspirations..."
              className="w-full p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 resize-none
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              rows={3}
            />
          </div>
        </div>

        {/* Passion */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 group-hover:border-zinc-600 transition-all">
            <label className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <FaFire className="text-orange-400" />
              What excites you about tech?
            </label>
            <textarea
              name="passion"
              value={form.passion}
              onChange={handleChange}
              required
              placeholder="🚀 Describe your interests in technology and innovation..."
              className="w-full p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 resize-none
                        focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all duration-200"
              rows={3}
            />
          </div>
        </div>

        {/* About */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 group-hover:border-zinc-600 transition-all">
            <label className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <FaUserAlt className="text-purple-400" />
              Describe yourself in a few lines
            </label>
            <textarea
              name="about"
              value={form.about}
              onChange={handleChange}
              required
              placeholder="🌟 What makes you unique? Your passions, skills, personality..."
              className="w-full p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 resize-none
                        focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200"
              rows={3}
            />
          </div>
        </div>

        {/* Belief */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 group-hover:border-zinc-600 transition-all">
            <label className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
              <FaBrain className="text-indigo-400" />
              One belief you strongly hold?
            </label>
            <textarea
              name="belief"
              value={form.belief}
              onChange={handleChange}
              required
              placeholder="💡 What core principle guides your decisions and actions?"
              className="w-full p-4 bg-zinc-900/50 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 resize-none
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200"
              rows={3}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl font-medium text-white
                    hover:from-blue-500 hover:to-indigo-600 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
                    flex items-center justify-center gap-3 group"
        >
          <span>Save and Continue</span>
          <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </form>

      {/* Privacy Note */}
      <div className="mt-6 text-center text-xs text-zinc-500">
        <p>Your information is encrypted and stored securely. We never share your personal data.</p>
      </div>
    </div>
  </div>
);
};

export default MemoryOnboarding;