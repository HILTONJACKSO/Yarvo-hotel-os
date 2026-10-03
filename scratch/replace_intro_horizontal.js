const fs = require('fs');

let content = fs.readFileSync('apps/web/src/app/page.tsx', 'utf8');

const newWelcome = `const IntroSection = () => {
  return (
    <section id="experience" className="px-6 py-24 md:py-40 max-w-7xl mx-auto flex flex-col items-center">
      {/* Top Centered Heading to match design */}
      <div className="text-center mb-16 md:mb-24">
        <h2 className="text-4xl md:text-6xl lg:text-[72px] font-sans font-bold text-[#1A1A1A] leading-tight max-w-4xl mx-auto tracking-tight">
          Kwalee's Rooms & Suites<br/>More Than Just A Stay.
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 lg:gap-20 items-center w-full">
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
        
        <div className="order-1 lg:order-2 relative h-[400px] md:h-[500px] lg:h-[600px] w-full mt-10 lg:mt-0">
          {/* Main Large Horizontal Image */}
          <div className="absolute top-0 right-0 w-[85%] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl z-10 group cursor-pointer">
            <img 
              src={placeholder(IMAGES.rooms.r1)} 
              alt="Room" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg">
              <h4 className="font-bold text-lg text-gray-900">Ocean Room</h4>
              <p className="text-sm text-gray-600 font-medium mt-0.5">Wake up to the sound of waves</p>
            </div>
          </div>
          
          {/* Second Overlapping Horizontal Image */}
          <div className="absolute bottom-0 left-0 w-[60%] aspect-video rounded-2xl overflow-hidden shadow-xl z-20 group cursor-pointer border-4 border-white bg-gray-100">
            <img 
              src={placeholder(IMAGES.pool)} 
              alt="Pool" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </div>
    </section>
  );
};`;

// Use simple index matching for IntroSection
const startIdx = content.indexOf('const IntroSection = () => {');
const endIdx = content.indexOf('};', startIdx) + 2;

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newWelcome + content.substring(endIdx);
  fs.writeFileSync('apps/web/src/app/page.tsx', content, 'utf8');
  console.log('Replaced horizontally!');
} else {
  console.log('Could not find IntroSection');
}
