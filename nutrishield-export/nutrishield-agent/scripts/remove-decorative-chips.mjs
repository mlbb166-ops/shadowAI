import fs from "node:fs";

const edits = {
  "client/src/pages/Home.tsx": [
    ['import { Badge } from "@/components/ui/badge";\n', ""],
    ['<Badge className="border-white/10 bg-white/10 text-[#c9f2d5] hover:bg-[#e4f4e9]"><Sparkles size={13} className="mr-1"/> Ringkasan cerdas hari ini</Badge>', '<p className="text-sm font-medium text-[#9ddcb3]">Ringkasan hari ini</p>'],
    ['<Badge className="border-white/10 bg-white/10 text-[#c9f2d5] hover:bg-white/10"><Sparkles size={13} className="mr-1"/> Ringkasan cerdas hari ini</Badge>', '<p className="text-sm font-medium text-[#9ddcb3]">Ringkasan hari ini</p>'],
    ['<Badge variant="outline" className="border-[#d5e6d8] text-[#27835a]">Hari ini</Badge>', '<span className="text-xs font-medium text-[#27835a]">Hari ini</span>'],
    [', Sparkles,', ','],
    ['ShieldCheck, Sparkles, Utensils', 'ShieldCheck, Utensils'],
  ],
  "client/src/pages/Landing.tsx": [
    ['ShieldCheck, Sparkles, UsersRound', 'ShieldCheck, UsersRound'],
    ['<div className="inline-flex items-center gap-2 rounded-full border border-[#bfd8c6] bg-white/70 px-4 py-2 text-xs font-medium text-[#1d7952] backdrop-blur"><Sparkles size={14}/> Pendamping keluarga dengan agent AI yang dapat diaudit</div>', '<p className="text-sm font-medium text-[#1d7952]">Pendamping keluarga dengan agent AI yang dapat diaudit</p>'],
  ],
  "client/src/pages/AgentCenter.tsx": [
    ['import { Badge } from "@/components/ui/badge";\n', ""],
    ['<Badge className="bg-[#b9efcb] text-[#123f33] hover:bg-[#b9efcb]"><CircleDot size={13} className="mr-1"/> Orchestrator siap</Badge>', '<span className="flex items-center gap-1.5 font-medium text-[#b9efcb]"><CircleDot size={13}/> Orchestrator siap</span>'],
    ['<div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-4 text-xs text-[#c5ddcf]"><CheckCircle2 size={15} className="text-[#85dda3]"/> Selesai dalam {(cycle.data.finishedAt-cycle.data.startedAt)/1000} detik</div>', '<div className="flex items-center gap-2 px-2 text-xs text-[#c5ddcf]"><CheckCircle2 size={15} className="text-[#85dda3]"/> Selesai dalam {(cycle.data.finishedAt-cycle.data.startedAt)/1000} detik</div>'],
    ['<Badge variant="outline" className="border-[#e4c47d] bg-[#fff9e9] text-[#8a691f]">Belum aktif</Badge>', '<span className="text-xs font-medium text-[#8a691f]">Belum aktif</span>'],
  ],
  "client/src/pages/Planner.tsx": [
    ['import { Badge } from "@/components/ui/badge";\n', ""],
    ['<Badge className="bg-[#e5f4e8] text-[#258057] hover:bg-[#e5f4e8]"><ShieldCheck size={13} className="mr-1"/> {data?.coverage??0}% cakupan variasi</Badge>', '<span className="flex items-center gap-1.5 text-xs font-medium text-[#258057]"><ShieldCheck size={14}/> {data?.coverage??0}% cakupan variasi</span>'],
  ],
  "client/src/pages/Sources.tsx": [
    ['import { Badge } from "@/components/ui/badge";\n', ""],
    ['<Badge variant="outline" className="text-[10px]">{source.type}</Badge>', '<span className="text-[10px] font-medium uppercase tracking-[.12em] text-[#7c8e84]">{source.type}</span>'],
    ['<Badge className="bg-[#e8f4ea] text-[#277f58] hover:bg-[#e8f4ea]"><FileSearch size={13} className="mr-1"/> Audit siap</Badge>', '<span className="flex items-center gap-1.5 text-xs font-medium text-[#277f58]"><FileSearch size={14}/> Audit siap</span>'],
  ],
  "client/src/components/AppShell.tsx": [
    ['<div className="hidden items-center gap-2 rounded-full bg-[#e7f4e9] px-3 py-1.5 text-xs font-medium text-[#18754d] sm:flex"><span className="h-2 w-2 rounded-full bg-[#24a565]"/> Sistem aman</div>', '<div className="hidden items-center gap-2 text-xs font-medium text-[#18754d] sm:flex"><span className="h-2 w-2 rounded-full bg-[#24a565]"/> Sistem aman</div>'],
  ],
  "client/src/pages/BotGuide.tsx": [
    ['</p><div className="mt-6 grid gap-3"><div className="flex gap-3 rounded-2xl border border-[#dce7dd] bg-white p-4"><ShieldCheck', '</p><a href="https://t.me/NutriShieldAIBot" target="_blank" rel="noreferrer"><Button className="mt-5 rounded-xl bg-[#173f34]">Buka @NutriShieldAIBot <ExternalLink size={15} className="ml-2"/></Button></a><div className="mt-6 grid gap-3"><div className="flex gap-3 rounded-2xl border border-[#dce7dd] bg-white p-4"><ShieldCheck'],
  ],
};

for (const [path, replacements] of Object.entries(edits)) {
  let text = fs.readFileSync(path, "utf8");
  for (const [from, to] of replacements) text = text.split(from).join(to);
  fs.writeFileSync(path, text);
}
console.log("Decorative chip cleanup applied.");
