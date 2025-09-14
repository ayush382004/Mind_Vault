import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaRobot, FaCheck, FaTrash, FaEdit, FaArrowRight } from "react-icons/fa";

const TodoPage = ({ userId }) => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignToAgent, setAssignToAgent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/tasks/${userId}`);
      setTasks(res.data.tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
    setLoading(false);
  };

  // Add new task
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post("http://localhost:5000/api/tasks", {
        userId,
        title,
        description,
        assignedToAgent: assignToAgent,
      });

      setTitle("");
      setDescription("");
      setAssignToAgent(false);
      setIsAdding(false);
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const columns = {
    pending: { title: "🕓 Pending", color: "bg-amber-900/20 border-amber-800/50" },
    assigned: { title: "🤖 Assigned to Agent", color: "bg-blue-900/20 border-blue-800/50" },
    manual: { title: "⚙️ Manual Agent Task", color: "bg-purple-900/20 border-purple-800/50" },
    done: { title: "✅ Completed", color: "bg-green-900/20 border-green-800/50" },
  };

  return (
    <div className="h-full flex flex-col p-4 ">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-700">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <FaCheck className="text-white text-lg" />
            </div>
            Task Manager
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Organize your tasks with AI assistance
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl font-medium text-white
                    hover:from-blue-500 hover:to-indigo-600 transition-all duration-300
                    flex items-center justify-center gap-2"
        >
          <FaPlus className="text-sm" />
          Add Task
        </button>
      </div>

      <div className="h-[100%] overflow-y-auto custom-scrollbar">
        {/* Add Task Form */}
        {isAdding && (
          <div className="mb-6 bg-gradient-to-br from-zinc-800/30 to-zinc-800/10 backdrop-blur-lg rounded-xl border border-zinc-700 p-5 animate-fadeIn">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-300">
              <FaPlus className="text-blue-300" />
              Create New Task
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-2 md:gap-4">
                <div className="md:w-2/4 lg:w-2/5">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Task Title
                  </label>
                  <textarea
                    type="text"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none min-h-[100px] resize-none placeholder:text-zinc-500 custom-scrollbar"
                    required
                  />
                </div>

                <div className="md:w-2/4 lg:w-3/5">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Add details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-transparent outline-none min-h-[100px] resize-none placeholder:text-zinc-500 custom-scrollbar"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={assignToAgent}
                      onChange={(e) => setAssignToAgent(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center ${
                        assignToAgent
                          ? "bg-blue-500"
                          : "bg-zinc-700 border border-zinc-600"
                      }`}
                    >
                      {assignToAgent && (
                        <FaCheck className="text-white text-xs" />
                      )}
                    </div>
                  </div>
                  Assign to AI Agent
                </label>
                <div className="flex items-center gap-1 text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                  <FaRobot className="text-xs" />
                  <span>AI Assistant</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2.5 bg-zinc-700/50 hover:bg-zinc-700 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl font-medium text-white
                          hover:from-blue-500 hover:to-indigo-600 transition-all duration-300
                          flex items-center justify-center gap-2 flex-1"
                >
                  <FaPlus className="text-sm" />
                  Create Task
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task Board */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {Object.entries(columns).map(([key, column]) => (
              <div
                key={key}
                className={`rounded-2xl p-4 border ${column.color} backdrop-blur-sm`}
              >
                <h3 className="font-bold text-zinc-200 mb-4 flex items-center gap-2">
                  {column.title}
                </h3>
                <div className="space-y-3">
                  {tasks
                    .filter((task) => task.status === key)
                    .map((task) => (
                      <div
                        key={task._id}
                        className="bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50 hover:border-zinc-600 transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-zinc-200 group-hover:text-white">
                            {task.title}
                          </p>
                          <button
                            onClick={() => deleteTask(task._id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <FaTrash className="text-sm" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-sm text-zinc-400 mt-2">
                            {task.description}
                          </p>
                        )}

                        <div className="mt-4 flex justify-between items-center">
                          <div className="text-xs flex items-center gap-1">
                            {task.assignedToAgent && (
                              <span className="bg-blue-900/20 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                                <FaRobot className="text-xs" />
                                <span>AI Agent</span>
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {key !== "done" && (
                              <button
                                className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all"
                                onClick={() =>
                                  updateTaskStatus(task._id, "done")
                                }
                              >
                                <FaCheck className="text-xs" />
                                <span>Complete</span>
                              </button>
                            )}

                            {key === "assigned" && (
                              <button
                                className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-all"
                                onClick={() =>
                                  updateTaskStatus(task._id, "manual")
                                }
                              >
                                <FaArrowRight className="text-xs" />
                                <span>Move to Manual</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {tasks.filter((task) => task.status === key).length === 0 && (
                    <div className="text-center py-6 text-zinc-500 text-sm">
                      No tasks in this column
                    </div>
                  )}
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

export default TodoPage;