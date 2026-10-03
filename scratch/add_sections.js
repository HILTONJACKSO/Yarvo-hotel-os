const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

// 1. Update imports
const oldImports = `Menu, X, MapPin, Phone, Mail, Instagram, Facebook, 
  ChevronRight, Calendar, Users, Home as HomeIcon, Check
} from "lucide-react";`;

const newImports = `Menu, X, MapPin, Phone, Mail, Instagram, Facebook, 
  ChevronRight, ChevronLeft, Heart, Star, Calendar, Users, Home as HomeIcon, Check
} from "lucide-react";`;

if (content.includes(oldImports)) {
  content = content.replace(oldImports, newImports);
} else {
  // Try another way to inject it
  content = content.replace('ChevronRight,', 'ChevronRight, ChevronLeft, Heart, Star,');
}

// 2. Define the new Sections

const newServicesSection = `const ServicesSection = () => {
  const rooms = [
    {
      name: "Oceanfront Double Tent",
      location: "Kpakpa Kon, Marshall, Liberia",
      features: "2 Bed • 2 Bath",
      price: "$35/night",
      rating: "4.8",
      img: placeholder(IMAGES.rooms.r1)
    },
    {
      name: "Family Triple Tent",
      location: "Kpakpa Kon, Marshall, Liberia",
      features: "3 Bed • 2 Bath",
      price: "$45/night",
      rating: "4.8",
      img: placeholder(IMAGES.rooms.r2)
    },
    {
      name: "Deluxe Family Suite",
      location: "Kpakpa Kon, Marshall, Liberia",
      features: "4 Bed • 3 Bath",
      price: "$120/night",
      rating: "4.9",
      img: placeholder(IMAGES.hero)
    }
  ];

  return (
    <section id="stay" className="py-24 md:py-32 bg-[#FAFAF7] px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <span className="px-4 py-1.5 rounded-full border border-gray-300 text-xs font-bold tracking-widest text-gray-800 mb-6 inline-block uppercase bg-white">
              POPULAR SERVICES
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-[64px] font-sans font-bold text-[#1A1A1A] leading-tight tracking-tight">
              Services Built For<br/>Travelers.
            </h2>
          </div>
          <div className="max-w-sm lg:text-right text-left pb-2">
            <p className="text-gray-500 text-sm md:text-sm leading-relaxed">
              Kwalee provides smart tools, secure payments, verified reviews, ensuring smooth, confident, and effortless hotel booking.
            </p>
          </div>
        </div>

        <div className="relative group">
          {/* Arrow Left */}
          <button className="absolute -left-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-black transition opacity-0 group-hover:opacity-100 hidden md:flex border border-gray-100 cursor-pointer">
            <ChevronLeft size={24} />
          </button>
          
          {/* Arrow Right */}
          <button className="absolute -right-6 top-[40%] -translate-y-1/2 z-10 w-12 h-12 bg-[#a67b27] rounded-full shadow-lg flex items-center justify-center text-white hover:bg-[#8f6920] transition opacity-0 group-hover:opacity-100 hidden md:flex cursor-pointer">
            <ChevronRight size={24} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {rooms.map((room, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group cursor-pointer transition-shadow hover:shadow-xl">
                <div className="relative aspect-[4/3] w-full overflow-hidden p-2 pb-0">
                  <img src={room.img} alt={room.name} className="w-full h-full object-cover rounded-t-xl transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-6 left-6 bg-white/40 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-sm">
                    {room.rating} <Star size={12} className="fill-[#F5B041] text-[#F5B041]" />
                  </div>
                  <div className="absolute top-6 right-6 text-white hover:text-red-500 transition-colors bg-black/20 p-2 rounded-full backdrop-blur-sm">
                    <Heart size={16} strokeWidth={2} />
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1">{room.name}</h3>
                  <p className="text-gray-400 text-xs mb-6 truncate">{room.location}</p>
                  
                  <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                    <div className="flex gap-4 text-gray-500 text-xs font-medium">
                      {room.features.split(' • ').map((feat, i) => (
                         <span key={i} className="flex items-center gap-1">{feat}</span>
                      ))}
                    </div>
                    <div className="text-right flex items-baseline gap-1">
                      <span className="font-bold text-lg text-gray-900 block leading-none">{room.price.split('/')[0]}</span>
                      <span className="text-xs text-gray-400">/{room.price.split('/')[1]}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};`;

const newTestimonialsSection = `const CoverflowTestimonialsSection = () => {
  return (
    <section className="py-24 bg-[#FAFAF7] px-6 border-t border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Coverflow Gallery */}
        <div className="w-full relative flex justify-center items-center h-[300px] md:h-[450px] mb-24 max-w-5xl mx-auto">
          {/* Far Left */}
          <div className="absolute left-[-5%] md:left-[5%] w-[25%] md:w-[20%] aspect-[3/4] rounded-lg overflow-hidden opacity-40 scale-75 blur-[2px] transition-all hidden sm:block">
            <img src={placeholder(IMAGES.beach)} className="w-full h-full object-cover" />
          </div>
          {/* Mid Left */}
          <div className="absolute left-[5%] md:left-[15%] lg:left-[20%] w-[35%] md:w-[25%] lg:w-[22%] aspect-[3/4] rounded-xl overflow-hidden opacity-80 scale-90 blur-[1px] shadow-lg transition-all z-10 hidden sm:block">
            <img src={placeholder(IMAGES.bar)} className="w-full h-full object-cover" />
          </div>
          
          {/* Center */}
          <div className="absolute z-20 w-[65%] md:w-[45%] lg:w-[35%] aspect-[3/4] rounded-sm overflow-hidden shadow-2xl scale-100 transition-all group cursor-pointer border-[8px] border-white/10">
            <img src={placeholder(IMAGES.dining)} className="w-full h-full object-cover brightness-75 group-hover:brightness-90 transition-all" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
               <h3 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold font-sans drop-shadow-lg leading-tight tracking-tight">Festive Grand<br/>Interior</h3>
               <p className="text-white/80 text-xs md:text-sm mt-3 drop-shadow-md">Adventure is never far away.</p>
            </div>
          </div>
          
          {/* Mid Right */}
          <div className="absolute right-[5%] md:right-[15%] lg:right-[20%] w-[35%] md:w-[25%] lg:w-[22%] aspect-[3/4] rounded-xl overflow-hidden opacity-80 scale-90 blur-[1px] shadow-lg transition-all z-10 hidden sm:block">
            <img src={placeholder(IMAGES.events)} className="w-full h-full object-cover" />
          </div>
          {/* Far Right */}
          <div className="absolute right-[-5%] md:right-[5%] w-[25%] md:w-[20%] aspect-[3/4] rounded-lg overflow-hidden opacity-40 scale-75 blur-[2px] transition-all hidden sm:block">
            <img src={placeholder(IMAGES.hero)} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-5xl w-full flex flex-col lg:flex-row justify-between gap-16 lg:gap-24">
          {/* Left Side */}
          <div className="lg:w-[40%] flex flex-col">
            <span className="text-xs font-bold tracking-wide text-gray-500 mb-6 block capitalize">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold font-sans text-gray-900 leading-[1.15] mb-6 tracking-tight">
              Client about<br/>our work
            </h2>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed max-w-xs mb-16">
              Proactively morph optimal intermediaries rather than accurate expertise. Intrinsicly progressive resources.
            </p>
            
            <div className="flex items-center gap-4 mt-auto">
              <button className="w-10 h-10 rounded-full bg-[#a67b27] text-white flex items-center justify-center hover:bg-[#8f6920] transition shadow-md">
                <ChevronLeft size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-50 transition shadow-sm">
                <ChevronRight size={20} />
              </button>
              
              <div className="flex items-center ml-8">
                <div className="flex -space-x-3">
                  <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
                  <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
                  <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt=""/>
                </div>
                <span className="ml-3 text-xs font-bold text-gray-500">+900</span>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="lg:w-[55%] flex flex-col justify-center">
            <div className="flex items-center gap-4 mb-8">
              <h3 className="text-5xl md:text-[64px] font-bold text-gray-900 font-sans tracking-tighter leading-none">4.80</h3>
              <div className="bg-[#d49931] px-3 py-1.5 rounded flex flex-col items-center shadow-sm">
                 <div className="flex text-white text-xs gap-0.5 mb-0.5">
                   <Star size={10} className="fill-white" />
                   <Star size={10} className="fill-white" />
                   <Star size={10} className="fill-white" />
                   <Star size={10} className="fill-white" />
                   <Star size={10} className="fill-white" />
                 </div>
                 <p className="text-[10px] text-white font-semibold">2,898 review</p>
              </div>
              <p className="text-[10px] text-gray-400 max-w-[120px] ml-auto text-right hidden md:block leading-tight">
                Proactively morph optimal intermediaries rather than accurate expertise.
              </p>
            </div>
            
            <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-snug mb-8 font-sans max-w-lg">
              Brilliant staff and exceptional customer service. The place is fantastic. Great facilities and atmosphere. Buffet breakfast daily is very generous.
            </h4>
            
            <div className="flex items-center gap-4">
               <img className="w-12 h-12 rounded-full object-cover" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Karar Mahmud" />
               <div>
                 <h5 className="font-bold text-sm text-gray-900">Karar Mahmud</h5>
                 <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                   TripAdvisor
                 </p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
};`;

const startIdxAcc = content.indexOf('const AccommodationSection = () => {');
const endIdxAcc = content.indexOf('};', content.indexOf('</section>', startIdxAcc)) + 2;

if (startIdxAcc !== -1 && endIdxAcc !== -1) {
  content = content.substring(0, startIdxAcc) + newServicesSection + '\n\n' + newTestimonialsSection + content.substring(endIdxAcc);
} else {
  console.log("Could not find AccommodationSection");
}

// Add them to the main Page render
const mainRenderTarget = '<AccommodationSection />';
if (content.includes(mainRenderTarget)) {
  content = content.replace(mainRenderTarget, '<ServicesSection />\n        <CoverflowTestimonialsSection />');
}

fs.writeFileSync('apps/web/src/app/page.tsx', content, 'utf8');
console.log('Sections added successfully');
