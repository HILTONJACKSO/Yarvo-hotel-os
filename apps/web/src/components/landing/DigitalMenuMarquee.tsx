"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShoppingBag, Utensils, Coffee } from 'lucide-react';
import Image from 'next/image';

export const DigitalMenuMarquee = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [roomNumber, setRoomNumber] = useState('');
  const [guestName, setGuestName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetch('/api/menu-orders')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCategories(data.data);
          
          // Flatten all items into a single array for the marquee
          const allItems = data.data.flatMap((c: any) => c.items);
          setItems(allItems);
        }
      })
      .catch(err => console.error('Failed to fetch digital menu', err));
  }, []);

  const handleOrderClick = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    setIsSuccess(false);
    setError('');
    setQuantity('1');
    setNotes('');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        roomNumber,
        guestName,
        items: [
          {
            menuItemId: selectedItem.id,
            quantity: parseInt(quantity, 10),
            notes: notes
          }
        ]
      };

      const res = await fetch('/api/menu-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (data.success) {
        setIsSuccess(true);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return null; // Don't show if menu is empty

  return (
    <section className="py-24 bg-[#FAF9F6] overflow-hidden border-t border-[#E8E1D7]">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <h2 className="text-sm tracking-[0.2em] text-[#a67b27] uppercase font-semibold mb-4">In-Room Dining & Bar</h2>
        <h3 className="text-3xl md:text-5xl font-serif text-[#1A1A1A]">Order From Anywhere</h3>
        <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Explore our digital menu and order food or drinks directly to your room or table.</p>
      </div>

      <div className="relative w-full flex overflow-hidden">
        {/* We duplicate the items array so it seamlessly loops */}
        <div className="flex animate-marquee whitespace-nowrap py-4">
          {[...items, ...items, ...items].map((item, idx) => (
            <div 
              key={idx} 
              onClick={() => handleOrderClick(item)}
              className="inline-flex flex-col mx-4 w-72 bg-white border border-[#E8E1D7] shadow-sm hover:shadow-xl transition-shadow cursor-pointer group"
            >
              {item.image ? (
                <div className="w-full h-48 relative overflow-hidden">
                  <Image 
                    src={item.image.startsWith('http') ? item.image : `${process.env.NEXT_PUBLIC_API_URL || ''}${item.image}`} 
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-[#F0EBE1] flex items-center justify-center text-[#a67b27]">
                  {item.type === 'FOOD' ? <Utensils size={48} opacity={0.5} /> : <Coffee size={48} opacity={0.5} />}
                </div>
              )}
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-serif text-lg text-[#1A1A1A] truncate pr-2">{item.name}</h4>
                  <span className="font-semibold text-[#a67b27]">$\{(Number(item.price)).toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{item.description}</p>
                <div className="mt-4 flex items-center text-xs uppercase tracking-widest text-[#a67b27] font-semibold group-hover:text-[#1A1A1A] transition-colors">
                  <ShoppingBag size={14} className="mr-2" />
                  Order Now
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-serif font-bold text-gray-900">Order {selectedItem.name}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h4>
                  <p className="text-gray-600 mb-6">
                    Your order has been sent to the kitchen. It will be delivered to Room {roomNumber} shortly.
                  </p>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-[#1A1A1A] text-white px-8 py-3 rounded hover:bg-gray-800 transition"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Room Number</label>
                      <input required type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#a67b27]" placeholder="e.g. 101" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
                      <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#a67b27]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Guest Name</label>
                    <input required type="text" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#a67b27]" placeholder="Registered name on room" />
                    <p className="text-[10px] text-gray-400 mt-1">Required for room charge verification.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Special Instructions / Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm outline-none focus:border-[#a67b27] h-20" placeholder="e.g. No onions, extra spicy..." />
                  </div>

                  <div className="bg-gray-50 p-4 rounded text-sm text-gray-600 mt-6 border border-gray-100 flex justify-between items-center">
                    <span>Total Estimate:</span>
                    <span className="text-lg font-bold text-[#1A1A1A]">${(Number(selectedItem.price) * parseInt(quantity || '1', 10)).toFixed(2)}</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#a67b27] text-white font-bold py-3 rounded mt-4 hover:bg-[#8f6920] transition disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Order...' : 'Place Order'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
