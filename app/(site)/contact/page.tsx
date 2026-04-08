"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Inquiries table expects: name, email, type, message
    const { error } = await supabase.from("inquiries").insert([formData]);
    
    setLoading(false);
    if (!error) {
      setSuccess(true);
      setFormData({ name: "", email: "", type: "", message: "" });
      setTimeout(() => setSuccess(false), 5000);
    } else {
      alert("There was an error submitting your inquiry. Please try again.");
    }
  };

  return (
    <div className="bg-white text-black min-h-screen pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col items-center">
        
        {/* Massive Header */}
        <h1 className="text-[12vw] font-black uppercase tracking-tighter leading-[0.85] text-center border-b-2 border-black pb-12 w-full mb-24">
          INQUIRE
        </h1>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-24">
          
          {/* Contact Methods */}
          <div className="flex flex-col border-r border-black/20 pr-0 lg:pr-24">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-12">
              Concierge Services
            </h2>
            
            <div className="space-y-16">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Private Bookings</p>
                <a href="mailto:concierge@hightunis.com" className="text-3xl md:text-5xl font-black uppercase tracking-tighter hover:opacity-50 transition-opacity">
                  concierge@hightunis.com
                </a>
              </div>
              
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Agency & Partnerships</p>
                <a href="mailto:partners@hightunis.com" className="text-3xl md:text-5xl font-black uppercase tracking-tighter hover:opacity-50 transition-opacity">
                  partners@hightunis.com
                </a>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Press Inquiries</p>
                <a href="mailto:press@hightunis.com" className="text-3xl md:text-5xl font-black uppercase tracking-tighter hover:opacity-50 transition-opacity">
                  press@hightunis.com
                </a>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col w-full">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-12">
              Direct Inquiry
            </h2>

            {success ? (
              <div className="w-full bg-black text-white p-12 text-center">
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Inquiry Received</h3>
                <p className="text-sm font-bold uppercase tracking-widest opacity-70">Our concierge will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-12">
                <div className="flex flex-col">
                  <label className="text-sm font-bold uppercase tracking-widest mb-4">Initial Details</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="FULL NAME" 
                    className="w-full bg-transparent border-b-2 border-black pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="flex flex-col">
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="EMAIL ADDRESS" 
                    className="w-full bg-transparent border-b-2 border-black pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="flex flex-col">
                  <input 
                    type="text" 
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    placeholder="INQUIRY SUBJECT" 
                    className="w-full bg-transparent border-b-2 border-black pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 outline-none focus:border-black transition-colors"
                  />
                </div>

                <div className="flex flex-col">
                  <textarea 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="YOUR MESSAGE" 
                    rows={4}
                    className="w-full bg-transparent border-b-2 border-black pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 outline-none focus:border-black transition-colors resize-none"
                  ></textarea>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="disabled:opacity-50 self-start w-full md:w-auto bg-black text-white px-16 py-8 text-sm font-bold uppercase tracking-[3px] hover:bg-black/80 transition-colors mt-8"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
