"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { X, CheckCircle, ShoppingBag, Utensils, Coffee } from 'lucide-react';

import { DEFAULT_CMS_CONTENT, mergeWithDefaultContent } from '@/lib/default-cms-content';
import { WebsiteContent } from '@/types/cms';

const getDishFallbackImage = (itemName: string = '', categoryName: string = '', type: string = 'FOOD'): string => {
  const name = itemName.toLowerCase();
  const cat = categoryName.toLowerCase();

  // Keyword matches on dish name
  if (name.includes('lobster') || name.includes('seafood') || name.includes('prawn') || name.includes('shrimp')) {
    return 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('pizza')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('burger') || name.includes('sandwich')) {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('rice')) {
    return 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('soup')) {
    return 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('avocado')) {
    return 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('salad') || name.includes('cucumber')) {
    return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('fruit')) {
    return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('caramel') || name.includes('ice-cream') || name.includes('ice cream') || name.includes('dessert') || name.includes('cake')) {
    return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('finger') || name.includes('ball')) {
    return 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('fries') || name.includes('cassava')) {
    return 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('cashew') || name.includes('nut')) {
    return 'https://images.unsplash.com/photo-1509912760195-260339d39109?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('watermelon')) {
    return 'https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('pineapple')) {
    return 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('mango')) {
    return 'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('tea')) {
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('coffee') || name.includes('nescaf')) {
    return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('tequila') || name.includes('spirit') || name.includes('whiskey') || name.includes('vodka') || name.includes('daddy')) {
    return 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('wine')) {
    return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('beer') || name.includes('cider') || name.includes('savanna')) {
    return 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&auto=format&fit=crop&q=80';
  }
  if (name.includes('juice') || name.includes('water') || name.includes('aloevera') || name.includes('buffalo')) {
    return 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80';
  }

  // Category fallback
  if (cat.includes('pizza')) return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('main')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('salad')) return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('starter')) return 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('dessert')) return 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('kid')) return 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('hot drink')) return 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('wine')) return 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80';
  if (cat.includes('alcoholic') || cat.includes('bottle') || cat.includes('drink')) return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80';

  if (type === 'FOOD') return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80';
  return 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80';
};

function resolveMenuItemImageUrl(item: any, fallbackSrc: string): string {
  let candidate: any = item.image || item.imageUrl;
  
  if (!candidate && item.images) {
    if (Array.isArray(item.images) && item.images.length > 0) {
      candidate = item.images[0];
    } else if (typeof item.images === 'string') {
      try {
        const parsed = JSON.parse(item.images);
        if (Array.isArray(parsed) && parsed.length > 0) candidate = parsed[0];
        else candidate = item.images;
      } catch {
        candidate = item.images;
      }
    }
  }

  if (typeof candidate === 'string') {
    let clean = candidate.trim().replace(/^[\["'\s]+|[\]"'\s]+$/g, '').trim();
    if (!clean) return fallbackSrc;
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    if (clean.startsWith('/uploads/')) return clean;
    if (clean.startsWith('uploads/')) return `/${clean}`;
    if (clean.startsWith('/')) return clean;
    return `/uploads/${clean}`;
  }

  return fallbackSrc;
}

export default function DiningPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cmsContent, setCmsContent] = useState<WebsiteContent>(DEFAULT_CMS_CONTENT);
  
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
    fetch('/api/cms', { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setCmsContent(mergeWithDefaultContent(json.data));
        }
      })
      .catch(() => {});

    const loadMenu = async () => {
      try {
        const res = await fetch('/api/v1/public/menu', { cache: 'no-store' });
        const json = await res.json();
        const menuData = json.data || (Array.isArray(json) ? json : null);
        if (menuData && Array.isArray(menuData) && menuData.length > 0) {
          setCategories(menuData);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch from /api/v1/public/menu', err);
      }

      // Fallback
      try {
        const res2 = await fetch('/api/menu-orders', { cache: 'no-store' });
        const json2 = await res2.json();
        const fallbackData = json2.data || (Array.isArray(json2) ? json2 : null);
        if (fallbackData && Array.isArray(fallbackData)) {
          setCategories(fallbackData);
        }
      } catch (err2) {
        console.error('Failed to fetch from fallback menu', err2);
      }
    };

    loadMenu();
  }, []);

  const allItems = categories.flatMap(c => (c.items || []).map((it: any) => ({ ...it, categoryName: c.name })));
  const displayedItems = selectedCategory === 'All' 
    ? allItems 
    : (categories.find(c => c.name === selectedCategory)?.items || []).map((it: any) => ({ ...it, categoryName: selectedCategory }));

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

  const diningData = cmsContent.subpages.dining || DEFAULT_CMS_CONTENT.subpages.dining;

  return (
    <main className="font-sans text-[#1F1F1F] bg-[#FAF9F4] min-h-screen flex flex-col">
      <Navbar general={cmsContent.general} />

      {/* Hero Section */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden bg-[#1B2418] pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={diningData.bgImage || DEFAULT_CMS_CONTENT.subpages.dining.bgImage} 
            alt={diningData.title || "Dining at Kwalee"} 
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        <div className="relative z-10 text-center px-6">
          {diningData.badge && (
            <span className="text-white/80 uppercase tracking-[0.3em] text-sm mb-4 block font-semibold">
              {diningData.badge}
            </span>
          )}
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 drop-shadow-lg">
            {diningData.title || "Dining at Kwalee"}
          </h1>
          <p className="text-white/90 max-w-2xl mx-auto text-lg md:text-xl drop-shadow-md">
            {diningData.description || "Experience our curated digital menu and have culinary excellence delivered straight to your room."}
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
              {displayedItems.map((item: any, idx: number) => {
                const fallbackSrc = getDishFallbackImage(item.name, item.categoryName || selectedCategory, item.type);
                const finalSrc = resolveMenuItemImageUrl(item, fallbackSrc);

                return (
                  <div key={item.id || idx} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all overflow-hidden border border-[#E8E1D7] flex flex-col group">
                    <div className="w-full h-56 relative overflow-hidden bg-[#F0EBE1] flex items-center justify-center">
                      <img 
                        src={finalSrc} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        onError={(e) => {
                          if (e.currentTarget.src !== fallbackSrc) {
                            e.currentTarget.src = fallbackSrc;
                          }
                        }}
                      />
                    </div>
                  
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-serif text-2xl text-[#1F1F1F]">{item.name}</h4>
                      <span className="font-bold text-[#F5A623] text-lg">${(Number(item.price)).toFixed(2)}</span>
                    </div>
                    <p className="text-[#6B6F72] mb-6 flex-grow">{item.description || 'Prepared fresh by our resort culinary team using the finest coastal ingredients.'}</p>
                    <button 
                      onClick={() => handleOrderClick(item)}
                      className="w-full py-3 flex items-center justify-center border border-[#E8E1D7] rounded text-[#F5A623] font-semibold tracking-widest uppercase text-sm group-hover:bg-[#F5A623] group-hover:text-white group-hover:border-[#F5A623] transition-all"
                    >
                      <ShoppingBag size={16} className="mr-2" />
                      Order to Room
                    </button>
                  </div>
                </div>
                );
              })}
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
                    className="w-full bg-[#1B2418] text-white font-semibold uppercase tracking-widest text-sm py-4 rounded-md mt-4 hover:bg-[#283824] transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    {isSubmitting ? 'Sending Order...' : 'Confirm Order'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer general={cmsContent.general} />
    </main>
  );
}
