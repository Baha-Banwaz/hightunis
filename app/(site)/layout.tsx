import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import PageTransition from "@/app/components/PageTransition";
import SmoothScroll from "@/app/components/SmoothScroll";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SmoothScroll>
      {/* First thing in the tab order: lets a keyboard or screen reader user
          jump the whole navigation. Visible only while focused. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-black focus:text-white focus:px-6 focus:py-3 focus:text-xs focus:font-bold focus:uppercase focus:tracking-[2px]"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-grow flex flex-col pt-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
    </SmoothScroll>
  );
}
