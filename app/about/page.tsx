import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="bg-black text-white min-h-screen pt-32 pb-24 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        
        {/* Giant Intro */}
        <div className="flex flex-col mb-32 border-b-2 border-white pb-16">
          <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-12 block">The Brand</span>
          <h1 className="text-[10vw] font-black uppercase tracking-tighter leading-[0.85] w-full">
            ELEVATING
          </h1>
          <h1 className="text-[10vw] font-black uppercase tracking-tighter leading-[0.85] w-full ml-auto text-right">
             TUNISIAN
          </h1>
          <h1 className="text-[10vw] font-black uppercase tracking-tighter leading-[0.85] w-full text-center">
             LUXURY
          </h1>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-32">
          
          <div className="lg:col-span-5 relative h-[60vh] md:h-[90vh] bg-stone">
             <Image 
              src="https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?fit=crop&w=1200&q=100" 
              alt="Mediterranean architecture" 
              fill
              className="object-cover"
            />
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center">
             <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-12">
               The Mediterranean's Best Kept Secret.
             </h2>
             <div className="text-xl md:text-3xl font-medium tracking-tight space-y-8 leading-[1.3] text-white/80">
               <p>
                 For decades, Tunisia was cast aside as a mass-market destination. All-inclusive resorts dominated the narrative.
               </p>
               <p>
                 But hidden behind the whitewashed walls of Sidi Bou Said, deep within the palm groves of Tozeur, and anchored in the marinas of Bizerte, lies an entirely different world. A world of uncompromising exclusivity.
               </p>
               <p>
                 High Tunis is the digital bridge to this world. We curate only the absolute finest residential estates, five-star boutique hotels, and bespoke luxury services available across the nation.
               </p>
             </div>
             
             <div className="mt-24 border-t border-white/20 pt-16 flex justify-between items-end">
               <div>
                 <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-4 block">Founded</span>
                 <p className="text-3xl font-black tracking-tighter uppercase">2024</p>
               </div>
               <div>
                 <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-4 block">Headquarters</span>
                 <p className="text-3xl font-black tracking-tighter uppercase text-right">TUNIS</p>
               </div>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
