import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import ChatBox from "./ChatBox";
import Notes from "./Notes";
import CapsulePage from "./CapsulePage";
import TodoPage from "./TodoPage";
import Sidebar from "../components/Sidebar";

import { FaCog, FaBell } from "react-icons/fa";
import MeetingDashboard from "./Meeting";

const Dashboard = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [activeTab, setActiveTab] = useState("agent");

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const storedName = localStorage.getItem("displayName");
    setDisplayName(storedName || "Your AI Twin");
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "agent":
        return <ChatBox />;
      case "notes":
        return <Notes />;
      case "capsule":
        return <CapsulePage />;
      case "todo":
        return <TodoPage userId={userId} />;
      case "meetings":
        return <MeetingDashboard/>;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-[#0e1323] to-zinc-950 text-zinc-100">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        displayName={displayName}
      />

      <main className="flex-1 px-6 pt-4 pb-1 flex flex-col">
        
        <section className="bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 border border-zinc-800 rounded-2xl flex-1 backdrop-blur-lg overflow-hidden">
          {renderContent()}
        </section>

        <footer className="mt-2 text-center text-xs text-zinc-600">
          MindVault v1.0 · Your thoughts are securely encrypted
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
