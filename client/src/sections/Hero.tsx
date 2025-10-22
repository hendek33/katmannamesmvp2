import HeroPhysicsCards from "@/components/HeroPhysicsCards";

export default function Hero() {
  // Kart görselleri public/acilmiskartgorsel klasöründe
  const cardImages = [
    "1.png",
    "2.png",
    "3.png",
    "4.png",
    "5.png",
    "6.png",
    "7.png",
    "8.png",
    "9.png",
    "10.png",
    "11.png",
    "12.png",
    "13.png",
    "14.png",
    "15.png",
    "16.png",
    "17.png",
    "18.png",
    "19.png",
    "20.png",
    "21.png",
    "22.png",
    "23.png",
    "24.png"
  ];

  return (
    <section className="relative w-full overflow-hidden bg-slate-900">
      <div className="relative w-full">
        <HeroPhysicsCards
          imageNames={cardImages}
          height={560}
          countMobile={16}
        />
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center px-4 space-y-4">
            <img 
              src="/logo.png" 
              alt="Katmannames Logo" 
              className="w-80 md:w-96 lg:w-[32rem] h-auto object-contain mx-auto"
            />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent drop-shadow-lg">
              Türkçe Kelime Tahmin Oyunu
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto drop-shadow">
              İki takım, gizli kelimeler, stratejik ipuçları. Kartlar mouse'unla hareket ediyor!
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-xs text-white/60 mt-8">
              <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-700/50">
                <div className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center">🖱️</div>
                <span>Mouse ile kartları it</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-700/50">
                <kbd className="px-2 py-0.5 bg-slate-800 rounded text-[10px]">Space</kbd>
                <span>Kartları savur</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-700/50">
                <kbd className="px-2 py-0.5 bg-slate-800 rounded text-[10px]">Shift</kbd>
                <span>Güçlü itme</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}