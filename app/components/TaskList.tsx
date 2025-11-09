'use client';

import { useState } from 'react';
import AudioPlayer from './AudioPlayer';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addTask = () => {
    if (inputValue.trim() === '') return;
    
    const newTask: Task = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
    };
    
    setTasks([...tasks, newTask]);
    setInputValue('');
  };

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Audio Player Section */}
      <div className="pt-4 border-t border-slate-800">
        <AudioPlayer />
      </div>
      {/* To-Do List Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-slate-200 mb-4">To-Do List</h2>
        
        {/* Input Section */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a task..."
            className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-500 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            onClick={addTask}
            className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition-colors"
          >
            Add
          </button>
        </div>

        {/* Task List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No tasks yet. Add one to get started!</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="w-5 h-5 rounded text-teal-500 focus:ring-teal-500 focus:ring-2"
                />
                <span
                  className={`flex-1 text-slate-200 ${
                    task.completed
                      ? 'line-through text-slate-500'
                      : ''
                  }`}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      
    </div>
  );
}

