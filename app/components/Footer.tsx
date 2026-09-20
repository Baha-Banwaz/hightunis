import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";

const SOCIAL_LINKS = [
  { label: "Instagram", href: SITE_CONFIG.social.instagram },
  { label: "TikTok", href: SITE_CONFIG.social.tiktok },
  { label: "LinkedIn", href: SITE_CONFIG.social.linkedin },
].filter((s) => s.href);

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-24 pb-8 overflow-hidden">
      <div className="px-6 lg:px-12 max-w-[1600px] mx-auto border-t border-white/20 pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-24">
          <div className="col-span-1 md:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-6 block">Headquarters</span>
            <p className="text-xl font-bold tracking-tight mb-8">
              {SITE_CONFIG.headquarters.line1}<br/>
              {SITE_CONFIG.headquarters.line2}
            </p>
            <a href={`mailto:${SITE_CONFIG.emails.hello}`} className="text-sm font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-white/50 transition-colors">
              {SITE_CONFIG.emails.hello}
            </a>
          </div>

          <div>
             <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-6 block">Directory</span>
             <ul className="space-y-4 text-xs font-bold uppercase tracking-[2px]">
               <li><Link href="/listings" className="hover:text-white/50 transition-colors">Estates</Link></li>
               <li><Link href="/services" className="hover:text-white/50 transition-colors">Agency</Link></li>
               <li><Link href="/blog" className="hover:text-white/50 transition-colors">Journal</Link></li>
               <li><Link href="/about" className="hover:text-white/50 transition-colors">About</Link></li>
               <li><Link href="/contact" className="hover:text-white/50 transition-colors">Contact</Link></li>
             </ul>
          </div>

          <div>
             <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-6 block">Legal</span>
             <ul className="space-y-4 text-xs font-bold uppercase tracking-[2px]">
               <li><Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link></li>
               <li><Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link></li>
               <li><Link href="/cookies" className="hover:text-white/50 transition-colors">Cookies</Link></li>
             </ul>
          </div>

          {SOCIAL_LINKS.length > 0 && (
            <div>
               <span className="text-[10px] font-bold uppercase tracking-[3px] text-white/50 mb-6 block">Social</span>
               <ul className="space-y-4 text-xs font-bold uppercase tracking-[2px]">
                 {SOCIAL_LINKS.map(({ label, href }) => (
                   <li key={label}>
                     <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">
                       {label}
                     </a>
                   </li>
                 ))}
               </ul>
            </div>
          )}
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
          <p>&copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
