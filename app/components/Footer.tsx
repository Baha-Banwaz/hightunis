import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-24 pb-8 overflow-hidden">
      <div className="px-6 lg:px-12 max-w-[1600px] mx-auto border-t border-white/20 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-24">
          <div className="col-span-1 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-6 block">Headquarters</span>
            <p className="text-xl font-bold tracking-tight mb-8">
              Sidi Bou Said<br/>
              Tunis, Tunisia
            </p>
            <a href="mailto:hello@hightunis.com" className="text-sm font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-white/50 transition-colors">
              hello@hightunis.com
            </a>
          </div>

          <div>
             <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-6 block">Directory</span>
             <ul className="space-y-4 text-xs font-bold uppercase tracking-[2px]">
               <li><Link href="/listings" className="hover:text-white/50 transition-colors">Estates</Link></li>
               <li><Link href="/services" className="hover:text-white/50 transition-colors">Agency</Link></li>
               <li><Link href="/about" className="hover:text-white/50 transition-colors">About</Link></li>
             </ul>
          </div>

          <div>
             <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-6 block">Social</span>
             <ul className="space-y-4 text-xs font-bold uppercase tracking-[2px]">
               <li><a href="#" className="hover:text-white/50 transition-colors">Instagram</a></li>
               <li><a href="#" className="hover:text-white/50 transition-colors">TikTok</a></li>
               <li><a href="#" className="hover:text-white/50 transition-colors">LinkedIn</a></li>
             </ul>
          </div>
        </div>

        {/* GIANT FOOTER BRANDING */}
        <div className="w-full text-center flex items-center justify-center pt-12 pb-8">
          <h1 
            style={{ fontFamily: "'Arial Black', Impact, sans-serif", letterSpacing: "-0.05em" }}
            className="text-[11vw] md:text-[12vw] font-black leading-none uppercase whitespace-nowrap text-white"
          >
            HIGHTUNIS
          </h1>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mt-12 text-[10px] font-bold uppercase tracking-[2px] text-white/50">
          <p>&copy; {new Date().getFullYear()} High Tunis. All Rights Reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
