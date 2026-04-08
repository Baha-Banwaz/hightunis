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
      <Navbar />
      <main className="flex-grow flex flex-col pt-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <Footer />
    </SmoothScroll>
  );
}
