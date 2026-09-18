import Image from "next/image";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logQueryError } from "@/lib/query-log";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Agency Services",
  description:
    "Bespoke strategy and digital architecture for hospitality pioneers — the HighTunis agency division.",
};

export default async function ServicesPage() {
  const { data: rawServices, error } = await supabase
    .from("services")
    .select("id, title, description, icon, image_url")
    .eq("published", true)
    .order("order", { ascending: true });

  logQueryError("services", error);

  const services = rawServices || [];

  const defaultImages = [
    "https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613490908653-b8e72769cdac?q=80&w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop"
  ];

  return (
    <div className="bg-white min-h-screen pt-32 pb-24 text-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="mb-24 border-b-2 border-black pb-8">
           <h1 className="text-7xl md:text-[10vw] font-black uppercase tracking-tighter leading-none mb-4">
             Agency Div.
           </h1>
           <p className="text-xl md:text-3xl font-medium max-w-3xl tracking-tight">
             Bespoke strategy and digital architecture for hospitality pioneers.
           </p>
        </div>

        <div className="flex flex-col gap-32">
           {services.length === 0 ? (
             <div className="text-2xl font-bold uppercase tracking-widest text-black/30">No services available</div>
           ) : (
             services.map((service: any, idx: number) => (
             <div key={service.id} className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-24`}>
                <div className="w-full md:w-1/2 relative h-[50vh] md:h-[70vh] bg-stone">
                  <Image
                    src={service.image_url || defaultImages[idx % defaultImages.length]}
                    alt={service.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute top-0 left-0 bg-black text-white px-6 py-4 text-3xl font-black">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                </div>

                <div className="w-full md:w-1/2">
                  <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-8">{service.title}</h2>
                  <p className="text-2xl md:text-3xl font-medium tracking-tight leading-[1.4] mb-12">
                    {service.description}
                  </p>
                  <button className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[3px] border-b-2 border-black pb-2 hover:opacity-50 transition-opacity">
                    Inquire Now <ArrowUpRight size={16} />
                  </button>
                </div>
             </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
}
