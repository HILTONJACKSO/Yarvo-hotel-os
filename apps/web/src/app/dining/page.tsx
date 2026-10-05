"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { X, CheckCircle, ShoppingBag, Utensils, Coffee } from 'lucide-react';

export default function DiningPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal state
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
    fetch('/api/v1/public/menu')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setCategories(data.data);
        } else {
          // Fallback just in case they haven't re-deployed proxy changes
          fetch('/api/menu-orders')
            .then(res => res.json())
            .then(d2 => {
              if (d2.success && d2.data) setCategories(d2.data);
            });
        }
      })
      .catch(err => console.error('Failed to fetch menu', err));
  }, []);

  const allItems = categories.flatMap(c => c.items);
  const displayedItems = selectedCategory === 'All' 
    ? allItems 
    : categories.find(c => c.name === selectedCategory)?.items || [];

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
        items: [{ menuItemId: selectedItem.id, quantity: parseInt(quantity, 10), notes }]
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

  return (
    <main className="font-sans text-[#1F1F1F] bg-[#FAF9F4] min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden bg-black pt-20">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1920&q=80" 
            alt="Dining at Kwalee" 
            fill 
            className="object-cover opacity-60"
            priority
          />
        </div>
        <div className="relative z-10 text-center px-6">
          <span className="text-white/80 uppercase tracking-[0.3em] text-sm mb-4 block font-semibold">Exquisite Flavors</span>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 drop-shadow-lg">Dining at Kwalee</h1>
          <p className="text-white/90 max-w-2xl mx-auto text-lg md:text-xl drop-shadow-md">
            Experience our curated digital menu and have culinary excellence delivered straight to your room.
          </p>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-20 px-6 flex-grow max-w-7xl mx-auto w-full">
        {categories.length > 0 ? (
          <>
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={`px-6 py-2 rounded-full border transition-all ${selectedCategory === 'All' ? 'bg-[#1B2418] text-white border-[#1F1F1F]' : 'bg-transparent text-gray-600 border-gray-300 hover:border-[#1F1F1F]'}`}
              >
                All Menu
              </button>
              {categories.map((c, idx) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-6 py-2 rounded-full border transition-all ${selectedCategory === c.name ? 'bg-[#1B2418] text-white border-[#1F1F1F]' : 'bg-transparent text-gray-600 border-gray-300 hover:border-[#1F1F1F]'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedItems.map((item: any, idx: number) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-[#E8E1D7] flex flex-col group">
                  {item.image ? (
                    <div className="w-full h-56 relative overflow-hidden bg-gray-100">
                      <Image 
                        src={item.image.startsWith('http') ? item.image : `${process.env.NEXT_PUBLIC_API_URL || ''}${item.image}`} 
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-[#F0EBE1] flex items-center justify-center text-[#F5A623]">
                      {item.type === 'FOOD' ? <Utensils size={48} opacity={0.5} /> : <Coffee size={48} opacity={0.5} />}
                    </div>
                  )}
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-serif text-2xl text-[#1F1F1F]">{item.name}</h4>
                      <span className="font-bold text-[#F5A623] text-lg">${(Number(item.price)).toFixed(2)}</span>
                    </div>
                    <p className="text-[#6B6F72] mb-6 flex-grow">{item.description}</p>
                    <button 
                      onClick={() => handleOrderClick(item)}
                      className="w-full py-3 flex items-center justify-center border border-[#E8E1D7] rounded text-[#F5A623] font-semibold tracking-widest uppercase text-sm group-hover:bg-[#F5A623] group-hover:text-white group-hover:border-[#F5A623] transition-all"
                    >
                      <ShoppingBag size={16} className="mr-2" />
                      Order to Room
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-32">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#F5A623] rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-[#6B6F72] text-lg">Curating our fine dining menu...</p>
          </div>
        )}
      </section>

      {/* Order Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-[#FAF9F4]">
              <h3 className="text-xl font-serif font-bold text-gray-900">Order {selectedItem.name}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#6B6F72]/80 hover:text-gray-600 transition">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                  </div>
                  <h4 className="text-2xl font-serif font-bold text-gray-900 mb-2">Order Placed!</h4>
                  <p className="text-gray-600 mb-6">
                    Your culinary request has been sent to our kitchen. It will be delivered to Room {roomNumber} shortly.
                  </p>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-[#1B2418] text-white px-8 py-3 rounded hover:bg-gray-800 transition uppercase tracking-widest text-sm font-semibold w-full"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-5">
                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-start">
                      <span className="block">{error}</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Room Number</label>
                      <input required type="text" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-sm outline-none focus:border-[#F5A623] bg-gray-50 focus:bg-white transition-colors" placeholder="e.g. 101" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Quantity</label>
                      <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-sm outline-none focus:border-[#F5A623] bg-gray-50 focus:bg-white transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Primary Guest Name</label>
                    <input required type="text" value={guestName} onChange={e => setGuestName(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-sm outline-none focus:border-[#F5A623] bg-gray-50 focus:bg-white transition-colors" placeholder="Registered name on room" />
                    <p className="text-[10px] text-[#6B6F72]/80 mt-1 uppercase tracking-wide">Required for room charge verification.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">Special Instructions</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 text-sm outline-none focus:border-[#F5A623] bg-gray-50 focus:bg-white transition-colors h-24 resize-none" placeholder="e.g. No onions, extra spicy..." />
                  </div>

                  <div className="bg-[#FAF9F4] p-4 rounded-md text-sm text-gray-600 mt-6 border border-[#E8E1D7] flex justify-between items-center">
                    <span className="uppercase tracking-widest font-semibold text-xs">Total Estimate:</span>
                    <span className="text-xl font-bold text-[#F5A623]">${(Number(selectedItem.price) * parseInt(quantity || '1', 10)).toFixed(2)}</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#1B2418] text-white font-semibold uppercase tracking-widest text-sm py-4 rounded-md mt-4 hover:bg-black transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Order...' : 'Confirm Order'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
