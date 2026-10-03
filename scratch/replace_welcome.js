const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

const oldWelcome = `const WelcomeSection = () => {
  return (
    <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="order-2 lg:order-1">
          <span className="text-xs uppercase tracking-[0.2em] text-[#4A5D4E] block mb-6">Welcome to Kwalee</span>
          <h2 className="text-4xl md:text-6xl font-serif text-[#1A1A1A] leading-[1.15] mb-8">
            A PLACE TO SLOW DOWN.
          </h2>
          <p className="text-lg md:text-xl text-gray-600 font-light leading-relaxed mb-10">
            Escape to a coastal destination where days are shaped by the rhythm of the ocean, warm hospitality, good food, refreshing swims and unforgettable moments by the beach.
          </p>
          <Link href="#gallery" className="inline-flex items-center gap-2 uppercase tracking-widest text-sm font-semibold border-b border-[#1A1A1A] pb-1 hover:text-[#4A5D4E] hover:border-[#4A5D4E] transition-all">
            View the Gallery <ChevronRight size={16} />
          </Link>
        </div>
        <div className="order-1 lg:order-2 aspect-[4/5] relative">
          <img 
            src={placeholder(IMAGES.intro)} 
            alt="Relaxation at Kwalee" 
            className="w-full h-full object-cover rounded-sm"
          />
        </div>
      </div>
    </section>
  );
};`;

const newWelcome = `const WelcomeSection = () => {
  return (
    <section className="px-6 py-24 md:py-32 max-w-7xl mx-auto flex flex-col items-center">
      {/* Top Centered Heading to match design */}
      <div className="text-center mb-16 md:mb-24">
        <h2 className="text-4xl md:text-6xl font-sans font-bold text-[#1A1A1A] leading-tight max-w-4xl mx-auto tracking-tight">
          Kwalee's Rooms & Suites<br/>More Than Just A Stay.
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20 items-start w-full">
        <div className="order-2 lg:order-1 flex flex-col items-start pt-4">
          <span className="px-4 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold tracking-wide text-gray-800 mb-8 uppercase shadow-sm">
            About Us
          </span>
          <h3 className="text-4xl md:text-5xl font-sans font-medium text-[#1A1A1A] leading-[1.15] mb-6 tracking-tight">
            A Place to Slow Down.<br/>Stay Better, Travel Happier.
          </h3>
          <p className="text-gray-600 text-base md:text-lg mb-10 leading-relaxed max-w-md">
            Escape to a coastal destination where days are shaped by the rhythm of the ocean, warm hospitality, good food, refreshing swims and unforgettable moments by the beach.
          </p>
          <Link href="#gallery" className="bg-[#a67b27] text-white px-8 py-3.5 rounded-md font-medium hover:bg-[#8f6920] transition-colors shadow-md">
            Read More
          </Link>
        </div>
        
        <div className="order-1 lg:order-2 grid grid-cols-3 gap-3 md:gap-5 h-[400px] md:h-[500px] lg:h-[600px] w-full">
          <div className="flex flex-col h-full w-full">
            <div className="relative rounded-2xl overflow-hidden h-[85%] mt-0 shadow-lg group cursor-pointer">
              <img 
                src={placeholder(IMAGES.rooms.r1)} 
                alt="Room" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="mt-4 px-1">
              <h4 className="font-semibold text-lg text-gray-900">Ocean Room</h4>
              <p className="text-xs text-gray-500 mt-1">Wake up to the sound of waves</p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-[85%] mt-[15%] shadow-lg group cursor-pointer w-full">
            <img 
              src={placeholder(IMAGES.rooms.r2)} 
              alt="Room" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="relative rounded-2xl overflow-hidden h-[85%] mt-[30%] shadow-lg group cursor-pointer w-full bg-gray-900">
            <img 
              src={placeholder(IMAGES.hero)} 
              alt="Room" 
              className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
};`;

if (content.includes(oldWelcome)) {
  content = content.replace(oldWelcome, newWelcome);
  fs.writeFileSync('apps/web/src/app/page.tsx', content, 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Could not find oldWelcome in page.tsx');
}
