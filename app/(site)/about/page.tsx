import Image from "next/image";
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { logQueryError } from "@/lib/query-log";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  description:
    "HighTunis curates Tunisia's finest residential estates, boutique hotels, and bespoke luxury services.",
};

export default async function AboutPage() {
  const { data: teamData, error: teamError } = await supabase
    .from("team")
    // Explicit columns: the anon role holds column-level SELECT grants, so
    // select("*") would break as soon as a non-public column is added.
    .select("id, name, role, photo_url, bio")
    .order("order", { ascending: true });
  // no created_at ordering — the live DB's testimonials table lacks that column
  const { data: testimonialsData, error: testimonialsError } = await supabase
    .from("testimonials")
    .select("id, author, role, quote, photo_url")
    .eq("published", true);

  logQueryError("team", teamError);
  logQueryError("testimonials", testimonialsError);

  const team = teamData || [];
  const testimonials = testimonialsData || [];
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
              src="https://oqzfowaqxgwquzofwxfg.supabase.co/storage/v1/object/public/media/agency/agency-terrace.webp"
              alt="HighTunis — palms and modern architecture at dusk"
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
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
                 HighTunis is the digital bridge to this world. We curate only the absolute finest residential estates, five-star boutique hotels, and bespoke luxury services available across the nation.
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

        {/* Team Section */}
        {team.length > 0 && (
          <div className="mt-32 pt-16 border-t-2 border-white">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-16">The Architecture<br />of HighTunis.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {team.map((member: any) => (
                <div key={member.id} className="flex flex-col">
                   <div className="relative w-full aspect-square mb-6 bg-white/5 grayscale outline outline-1 outline-white/10 outline-offset-8 hover:grayscale-0 hover:outline-white/40 transition-all duration-700">
                     {member.photo_url ? (
                       <Image src={member.photo_url} alt={member.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                     ) : (
                       <div className="absolute inset-0 flex items-center justify-center text-white/20 font-black text-4xl uppercase">{member.name[0]}</div>
                     )}
                   </div>
                   <h3 className="text-2xl font-black uppercase tracking-tighter">{member.name}</h3>
                   <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-4 block mt-1">{member.role}</span>
                   {member.bio && <p className="text-sm text-white/70 font-medium leading-[1.6]">{member.bio}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div className="mt-32 pt-16 border-t-2 border-white pb-32">
             <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-16">Words from our<br />Partners.</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
               {testimonials.map((t: any) => (
                 <div key={t.id} className="bg-white/5 p-12 border border-white/10 hover:bg-white/10 transition-colors duration-500">
                   <p className="text-xl md:text-2xl font-medium tracking-tight leading-[1.5] text-white/90 italic mb-10">"{t.quote}"</p>
                   <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                     {t.photo_url && (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden grayscale">
                          <Image src={t.photo_url} alt={t.author} fill sizes="48px" className="object-cover" />
                        </div>
                     )}
                     <div>
                       <h4 className="text-lg font-black uppercase tracking-tighter">{t.author}</h4>
                       {t.role && <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 block mt-1">{t.role}</span>}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
