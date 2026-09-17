import { Link, useLocation } from "wouter";
import { Activity, Bell, BookOpenCheck, Bot, CalendarDays, ChevronDown, CircleHelp, HeartPulse, Home, Menu, MessagesSquare, ShieldCheck, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/app", label: "Beranda", icon: Home },
  { href: "/rencana", label: "Rencana makan", icon: CalendarDays },
  { href: "/pertumbuhan", label: "Pertumbuhan", icon: HeartPulse },
  { href: "/agent-center", label: "Pusat agent", icon: Bot },
  { href: "/kanal", label: "Kanal keluarga", icon: MessagesSquare },
  { href: "/panduan-bot", label: "Panduan bot", icon: CircleHelp },
  { href: "/sumber-data", label: "Sumber data", icon: BookOpenCheck },
];

export default function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-[#f6f8f4] text-[#173d31]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#dfe8df] bg-[#103c31] px-4 py-5 text-white lg:flex">
      <Link href="/" className="flex items-center gap-3 px-2"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#b9efcb] text-[#103c31]"><ShieldCheck size={24}/></div><div><p className="font-semibold tracking-tight">NutriShield</p><p className="text-[11px] text-[#a9c9b7]">Family Intelligence</p></div></Link>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.07] p-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f2c98a] font-semibold text-[#674515]">A</div><div className="min-w-0"><p className="truncate text-sm font-medium">Alya</p><p className="text-xs text-[#adccba]">18 bulan · aktif</p></div><ChevronDown size={15} className="ml-auto text-[#8fb6a1]"/></div></div>
      <nav className="mt-6 space-y-1">{nav.map(item=>{const active=location===item.href; const Icon=item.icon; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active?"bg-[#b9efcb] font-medium text-[#103c31]":"text-[#c8ded0] hover:bg-white/[.07] hover:text-white"}`}><Icon size={18}/>{item.label}{item.href==="/agent-center"&&<span className={`ml-auto h-2 w-2 rounded-full ${active?"bg-[#168a58]":"bg-[#70dc96]"}`}/>}</Link>})}</nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-[#174c3e] p-4"><div className="flex items-center gap-2 text-xs font-medium text-[#b9efcb]"><Activity size={14}/> Agent terpantau</div><p className="mt-2 text-xs leading-5 text-[#a9c9b7]">Pemeriksaan terakhir hari ini, 08.15 WIB.</p><Link href="/agent-center" className="mt-3 block text-xs font-medium text-white underline decoration-[#6aa986] underline-offset-4">Lihat jejak aktivitas</Link></div>
    </aside>
    {open&&<div className="fixed inset-0 z-40 bg-[#09281f]/50 backdrop-blur-sm lg:hidden" onClick={()=>setOpen(false)}><aside className="h-full w-[82%] max-w-[310px] bg-[#103c31] p-5 text-white" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between"><span className="font-semibold">Menu NutriShield</span><Button size="icon" variant="ghost" className="text-white" onClick={()=>setOpen(false)}><X/></Button></div><nav className="mt-6 space-y-2">{nav.map(item=>{const Icon=item.icon;return <Link onClick={()=>setOpen(false)} key={item.href} href={item.href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#d6e7dd]"><Icon size={19}/>{item.label}</Link>})}</nav></aside></div>}
    <div className="lg:pl-[252px]">
      <header className="sticky top-0 z-20 border-b border-[#e0e8df] bg-[#f6f8f4]/90 backdrop-blur-xl"><div className="flex h-[74px] items-center gap-3 px-4 sm:px-7 lg:px-9"><Button size="icon" variant="outline" className="lg:hidden" onClick={()=>setOpen(true)}><Menu/></Button><div className="min-w-0"><h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1><p className="hidden truncate text-xs text-[#71877b] sm:block">{subtitle}</p></div><div className="ml-auto flex items-center gap-2"><div className="hidden items-center gap-2 text-xs font-medium text-[#18754d] sm:flex"><span className="h-2 w-2 rounded-full bg-[#24a565]"/> Sistem aman</div><Button size="icon" variant="outline" className="rounded-xl border-[#dce6dd] bg-white"><Bell size={18}/></Button><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1d19d] text-sm font-semibold text-[#6a4819]"><UserRound size={19}/></div></div></div></header>
      <main className="px-4 py-6 pb-24 sm:px-7 lg:px-9 lg:py-8">{children}</main>
    </div>
    <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-[#dbe6dc] bg-white/95 px-1 py-2 shadow-[0_12px_38px_rgba(27,60,42,.18)] backdrop-blur lg:hidden">{nav.filter(item=>["/app","/rencana","/pertumbuhan","/kanal"].includes(item.href)).map(item=>{const Icon=item.icon;const active=location===item.href;return <Link key={item.href} href={item.href} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-xl px-1.5 py-1.5 text-[10px] ${active?"bg-[#e5f5e9] font-semibold text-[#17754c]":"text-[#72877b]"}`}><Icon size={18}/>{item.label.replace("Rencana makan","Rencana").replace("Kanal keluarga","Kanal")}</Link>})}</nav>
  </div>;
}
