"use client";
import { useState } from "react";
import { tinaField } from "tinacms/dist/react";
import SectionTitle from "@/components/ui/SectionTitle";
import Button from "@/components/ui/Button";
import { useGlobal } from "@/components/layout/GlobalContext";

export default function ContactSectionBlock({ block }: { block: any }) {
  const global = useGlobal();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you! We'll be in touch shortly.");
    setForm({ name: "", email: "", message: "" });
  };

  const contactItems = [
    { icon: "📍", label: "Address", value: global.address, tinaKey: "address" },
    { icon: "🕐", label: "Hours",   value: global.hours,   tinaKey: "hours"   },
    { icon: "✉️", label: "Email",   value: global.email,   tinaKey: "email"   },
    { icon: "📞", label: "Phone",   value: global.phone,   tinaKey: "phone"   },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle title={block.title} tinaField={tinaField(block, "title")} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 mt-10">

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 border border-slate-100 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
              <input
                type="text" required placeholder="Enter your name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <input
                type="email" required placeholder="Enter your email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Project Idea (optional)</label>
              <textarea
                rows={4} placeholder="Tell us more about your project..."
                value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-amber-500 focus:outline-none text-sm resize-none"
              />
            </div>
            <Button type="submit" className="w-full text-center justify-center">Send Request</Button>
          </form>

          {/* Contact Info — from Global Settings */}
          <div className="flex flex-col gap-6 justify-center">
            {contactItems.map(({ icon, label, value, tinaKey }) => value ? (
              <div key={tinaKey} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                  <p data-tina-field={tinaField(global as any, tinaKey)} className="text-slate-700 font-medium">
                    {value}
                  </p>
                </div>
              </div>
            ) : null)}
          </div>

        </div>
      </div>
    </section>
  );
}
