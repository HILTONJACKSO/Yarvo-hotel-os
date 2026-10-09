'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Compass, Calendar, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';

type Activity = {
  id: string;
  type: string;
  name: string;
  description: string;
  price: string | number;
  image: string;
  isActive: boolean;
};

export default function ToursEventsPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Activity | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'TOUR',
    name: '',
    description: '',
    price: '',
    image: '',
    isActive: true
  });

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/v1/activities');
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedItem 
        ? `/api/v1/activities/${selectedItem.id}` 
        : '/api/v1/activities';
        
      const res = await fetch(url, {
        method: selectedItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price)
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchActivities();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      const res = await fetch(`/api/v1/activities/${id}`, { method: 'DELETE' });
      if (res.ok) fetchActivities();
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (item?: Activity) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        type: item.type,
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        image: item.image || '',
        isActive: item.isActive
      });
    } else {
      setSelectedItem(null);
      setFormData({ type: 'TOUR', name: '', description: '', price: '', image: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Compass className="text-amber-500" />
            Tours & Events Management
          </h1>
          <p className="text-slate-400">Manage activities offered to guests</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Create Activity
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map(act => (
          <div key={act.id} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
            <div className="h-48 bg-slate-700 relative">
              {act.image ? (
                <img src={act.image} alt={act.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">No Image</div>
              )}
              <div className="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded text-xs font-medium text-white backdrop-blur-sm">
                {act.type}
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-slate-100">{act.name}</h3>
                <span className="text-amber-500 font-bold">${Number(act.price).toFixed(2)}</span>
              </div>
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">{act.description}</p>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${act.isActive ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  <span className="text-xs text-slate-300">{act.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(act)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(act.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-400">
            No tours or events found. Create one to get started!
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl w-full max-w-md border border-slate-700 shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-slate-100">
                {selectedItem ? 'Edit Activity' : 'Create Activity'}
              </h2>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
                <select 
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="TOUR">Tour</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Price (USD)</label>
                <input 
                  type="number" required min="0" step="0.01"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Image URL</label>
                <input 
                  type="text"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 bg-slate-800 border-slate-700 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">Active and bookable</label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2 rounded-lg font-medium transition-colors">
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
