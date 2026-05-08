import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Check, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Todo, FilterType, FilterPill } from '../types';

const Dashboard = () => {
  const { token, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTodoTask, setNewTodoTask] = useState('');

  const filterPills: FilterPill[] = [
    { id: 'all', label: 'All', color: 'bg-gray-200' },
    { id: 'todo', label: 'To-Do', color: 'bg-orange-100 text-orange-600' },
    { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-600' }
  ];

  // 1. GET - Fetch Todos (LIFO handled by reversing)
  const fetchTodos = async () => {
    try {
      const res = await fetch('http://localhost:8000/todos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTodos(data.reverse()); // LIFO: Newest at the top
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => { 
    (async () => { await fetchTodos(); })(); 
  }, []);

  // 2. POST - Add Todo
  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTask.trim()) return;
    try {
      const res = await fetch('http://localhost:8000/todos', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title: newTodoTask })
      });
      if (res.ok) {
        setNewTodoTask('');
        setIsModalOpen(false);
        fetchTodos();
      }
    } catch (err) { console.error(err); }
  };

  // 3. PUT - Toggle Complete
  const toggleTodo = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/todos/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTodos();
    } catch (err) { console.error(err); }
  };

  // 4. DELETE - Delete Todo with Confirmation
  const deleteTodo = async (todo: Todo) => {
    const message = !todo.completed 
      ? "Warning: This task is not completed. Delete anyway?" 
      : "Delete this task?";
    if (window.confirm(message)) {
      try {
        await fetch(`http://localhost:8000/todos/${todo.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTodos();
      } catch (err) { console.error(err); }
    }
  };

  // Local Search & Filter (O(1) perceived time)
  const filteredTodos = todos.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'todo') return matchesSearch && !t.completed;
    if (filter === 'completed') return matchesSearch && t.completed;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">
      
      {/* TOPBAR */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-30">
        <h1 className="text-2xl font-black tracking-tighter" style={{ color: 'black' }}>
          <span style={{ color: '#f97316' }}>MY</span>TO<span style={{ color: '#f97316' }}>DO</span>
        </h1>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.input
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                type="text"
                placeholder="Search..."
                className="border-b-2 border-orange-500 outline-none px-2 py-1 text-sm md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
          </AnimatePresence>
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 hover:bg-gray-100 rounded-full">
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <button onClick={logout} className="p-2 hover:bg-red-50 text-red-500 rounded-full">
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* FILTER PILLS */}
      <div className="max-w-3xl mx-auto px-6 mt-6 flex gap-3">
      {filterPills.map((p) => (
        <button
          key={p.id}
          // NO MORE 'as any' - TypeScript knows p.id is a FilterType
          onClick={() => setFilter(p.id)} 
          className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
            filter === p.id ? p.color : 'bg-white border text-gray-500'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>

      {/* TODO LIST */}
      <main className="max-w-3xl mx-auto px-6 mt-8 space-y-3">
        {filteredTodos.map((todo) => (
          <motion.div
            layout
            key={todo.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-between p-5 rounded-2xl border transition-colors ${
              todo.completed ? 'bg-green-50/50 border-green-100' : 'bg-white border-gray-100'
            }`}
          >
            <span className={`flex-1 font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {todo.title}
            </span>
            
            <div className="flex gap-2 ml-4">
              <button 
                onClick={() => toggleTodo(todo.id)}
                className={`p-2 rounded-xl transition-colors ${todo.completed ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:text-green-500'}`}
              >
                <Check size={18} />
              </button>
              <button 
                onClick={() => deleteTodo(todo)}
                className="p-2 rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </main>

      {/* FAB (Thumb Region) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 z-40"
        style={{ backgroundColor: '#f97316' }}
      >
        <Plus size={32} color="white" />
      </button>

      {/* ADD TASK BOTTOM SHEET */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-[60] shadow-2xl md:max-w-xl md:mx-auto"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-4">Add a new task</h2>
              <form onSubmit={handleAddTodo}>
                <input
                  autoFocus
                  type="text"
                  placeholder="What needs to be done?"
                  className="w-full p-4 bg-gray-100 rounded-2xl outline-none border-2 border-transparent focus:border-orange-500 transition-all mb-6"
                  value={newTodoTask}
                  onChange={(e) => setNewTodoTask(e.target.value)}
                />
                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-transform active:scale-95"
                  style={{ backgroundColor: '#f97316' }}
                >
                  Add Task
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;