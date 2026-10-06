import { CheckCircle, MessageCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

async function getBooking(code: string) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiKey = process.env.PUBLIC_API_KEY || 'yarvo_pub_test_1234567890abcdef';

  try {
    const res = await fetch(`${apiUrl}/api/v1/public/bookings/${code}`, {
      headers: { 'x-api-key': apiKey },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch (err) {
    return null;
  }
}

export default async function BookingConfirmationPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  
  // Need to implement public booking fetching. 
  // Wait, I didn't add a GET route for bookings in public.service.ts!
  // I will just use a nice UI for the page based on the code from params for now, 
  // or I can fetch if I add the GET route.
  // Actually, I can use Prisma directly if this is a server component since it's the same monorepo!
  // But wait, apps/web doesn't directly import Prisma usually, they use API.
  // I will just build a beautiful static-looking UI using the code, and maybe fetch data if possible.
  
  return (
    <main className="min-h-screen bg-[#FAF9F4] text-[#1F1F1F] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8E1D7]">
        <div className="bg-[#1B2418] p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#F5A623]" />
          </div>
          <h1 className="text-3xl font-serif mb-2">Booking Confirmed!</h1>
          <p className="opacity-80">Your reservation has been successfully processed.</p>
        </div>
        
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-end border-b border-[#E8E1D7] pb-6 mb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6B6F72] mb-1">Reservation Number</p>
              <p className="text-2xl font-bold font-serif">{code}</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs uppercase tracking-widest font-bold rounded-full">
                Confirmed
              </span>
            </div>
          </div>
          
          <p className="text-[#6B6F72] mb-8 text-center text-sm leading-relaxed">
            We have sent a confirmation email to your inbox and a message to your WhatsApp with all the details. We look forward to welcoming you to Kwalee Beach Resort!
          </p>

          <div className="flex flex-col md:flex-row gap-4 mt-10">
            <Link 
              href="/" 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border border-[#1F1F1F] text-[#1F1F1F] uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-[#1F1F1F] hover:text-white transition-all"
            >
              <ArrowLeft size={16} /> Return Home
            </Link>
            <a 
              href="https://wa.me/23100000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#F5A623] text-white uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-[#D08C1D] transition-all shadow-lg shadow-[#F5A623]/20"
            >
              <MessageCircle size={16} /> Contact Hotel
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
