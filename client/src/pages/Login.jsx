import React, { useEffect } from 'react';
import { auth, provider, signInWithPopup, onAuthStateChanged } from '../firebase';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { FcGoogle } from "react-icons/fc";
import { FaBrain, FaLock, FaShieldAlt } from "react-icons/fa";


const Login = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      localStorage.setItem('userId', user.uid);
      localStorage.setItem('displayName', user.displayName);

      const res = await axios.post('http://localhost:5000/api/users', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      const { isNewUser } = res.data;

      if (isNewUser) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }

    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('displayName', user.displayName);

        try {
          const res = await axios.post('http://localhost:5000/api/users', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });

          const { isNewUser } = res.data;

          navigate(isNewUser ? '/onboarding' : '/dashboard');
        } catch (err) {
          console.error("Auto-login error:", err.message);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);
  
return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-zinc-950 p-4 relative overflow-hidden">
    <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl -z-10"></div>
    <div className="absolute bottom-1/3 -left-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl -z-10"></div>
    <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-indigo-600/10 blur-3xl -z-10"></div>
    
    <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800 rounded-3xl p-10 w-full max-w-md shadow-2xl shadow-blue-600/10 text-center relative overflow-hidden">
      <div className="absolute -top-[150%] -left-[50%] w-[200%] h-[200%] bg-conic-gradient from-transparent via-blue-500/30 to-transparent opacity-20 animate-rotate"></div>
      
      <div className="absolute top-5 right-5 flex gap-2">
        <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-800">
          <FaLock className="text-green-400 text-sm" />
        </div>
        <div className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-800">
          <FaShieldAlt className="text-blue-400 text-sm" />
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <FaBrain className="text-4xl text-white" />
        </div>
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
          MindVault
        </h1>
        <p className="text-zinc-400 mb-8 max-w-xs mx-auto">
          Secure your thoughts with end-to-end encryption
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all duration-300 font-medium group mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <FcGoogle className="text-xl z-10" />
          <span className="z-10">Continue with Google</span>
        </button>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <FaLock className="text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-300">Your privacy is protected</p>
              <p className="text-xs text-zinc-500 mt-1">
                We use Google authentication only. No passwords are stored. 
                All data is encrypted with AES-256 encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="absolute bottom-6 text-center text-xs text-zinc-600 w-full">
      <p>By continuing, you agree to our <a href="#" className="text-blue-400 hover:underline">Terms</a> and <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a></p>
      <p className="mt-1">MindVault v2.0 · © {new Date().getFullYear()}</p>
    </div>
    
    <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
    <div className="absolute bottom-20 right-16 w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
    <div className="absolute top-1/3 right-24 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
  </div>
);
};

export default Login;
