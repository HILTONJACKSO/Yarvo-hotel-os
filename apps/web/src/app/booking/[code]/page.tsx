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
  const booking = await getBooking(code);

  const guestFullName = booking?.guest ? `${booking.guest.firstName || ''} ${booking.guest.lastName || ''}`.trim() : '';
  const roomName = booking?.roomType?.name || 'Resort Accommodation';
  const checkInStr = booking?.checkInDate ? new Date(booking.checkInDate).toISOString().split('T')[0] : '';
  const checkOutStr = booking?.checkOutDate ? new Date(booking.checkOutDate).toISOString().split('T')[0] : '';
  const totalStr = booking?.totalAmount !== undefined ? `$${Number(booking.totalAmount).toFixed(2)}` : '';

  const whatsappSummary = [
    `*KWALEE BEACH RESORT — BOOKING CONFIRMATION*`,
    `Reservation Ref: *${code}*`,
    guestFullName ? `Guest: ${guestFullName}` : '',
    booking?.guest?.phone ? `Phone / WhatsApp: ${booking.guest.phone}` : '',
    roomName ? `Accommodation: ${roomName}` : '',
    checkInStr ? `Check-In: ${checkInStr}` : '',
    checkOutStr ? `Check-Out: ${checkOutStr}` : '',
    totalStr ? `Total Amount: ${totalStr}` : '',
    `Status: CONFIRMED`,
    ``,
    `Hello Kwalee Beach Resort, please find my booking confirmation details above.`
  ].filter(Boolean).join('\n');

  return (
    <main className="min-h-screen bg-[#FAF9F4] text-[#1F1F1F] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8E1D7]">
        <div className="bg-[#1B2418] p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#F5A623]" />
          </div>
          <h1 className="text-3xl font-serif mb-2">Booking Confirmed!</h1>
          <p className="opacity-80">Your reservation at Kwalee Beach Resort has been successfully processed.</p>
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

          {booking && (
            <div className="bg-[#FAF9F4] rounded-xl p-6 mb-8 border border-[#E8E1D7] space-y-3 text-sm">
              {guestFullName && (
                <div className="flex justify-between">
                  <span className="text-[#6B6F72]">Guest Name</span>
                  <span className="font-semibold text-[#1F1F1F]">{guestFullName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#6B6F72]">Accommodation</span>
                <span className="font-semibold text-[#1F1F1F]">{roomName}</span>
              </div>
              {checkInStr && (
                <div className="flex justify-between">
                  <span className="text-[#6B6F72]">Check-In Date</span>
                  <span className="font-semibold text-[#1F1F1F]">{checkInStr}</span>
                </div>
              )}
              {checkOutStr && (
                <div className="flex justify-between">
                  <span className="text-[#6B6F72]">Check-Out Date</span>
                  <span className="font-semibold text-[#1F1F1F]">{checkOutStr}</span>
                </div>
              )}
              {totalStr && (
                <div className="flex justify-between pt-3 border-t border-[#E8E1D7]">
                  <span className="font-bold text-[#1F1F1F]">Total Stay Amount</span>
                  <span className="font-bold text-lg text-[#1B2418]">{totalStr}</span>
                </div>
              )}
            </div>
          )}
          
          <p className="text-[#6B6F72] mb-8 text-center text-sm leading-relaxed">
            Click <strong>Receive Confirmation on WhatsApp</strong> below to immediately receive and share your official booking confirmation slip on WhatsApp with Kwalee Beach Resort (+231 77 434 0843).
          </p>

          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <Link 
              href="/" 
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border border-[#1F1F1F] text-[#1F1F1F] uppercase tracking-widest text-xs font-bold rounded-xl hover:bg-[#1F1F1F] hover:text-white transition-all"
            >
              <ArrowLeft size={16} /> Return Home
            </Link>
            <a 
              href={`https://wa.me/231774340843?text=${encodeURIComponent(whatsappSummary)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#25D366] hover:bg-[#1EBE5D] text-white uppercase tracking-widest text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#25D366]/20 cursor-pointer"
            >
              <MessageCircle size={16} /> Receive Confirmation on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
