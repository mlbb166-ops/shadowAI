import { useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { endpoints, asList, asRecord, text } from "@/api";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Download,
  ListPlus,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ShoppingBasket,
  SlidersHorizontal,
} from "lucide-react";

export default function Planner() {
  const [profile, setProfile] = useState({
    name: "Profil aktif",
    ageMonths: 18,
    allergy: "",
    budget: 20000,
    region: "Jawa Barat",
  });
  const plan = trpc.planner.weekly.useQuery(profile);
  const [selected, setSelected] = useState(0);
  const data = plan.data;
  const shopping = useMemo(
    () => Array.from(new Set(data?.days.flatMap((day) => day.ingredients) ?? [])),
    [data]
  );

  useEffect(() => {
    void endpoints.dashboard().then((value) => {
      const child = asList(asRecord(value).children)[0];
      if (!child) return;
      const born = child.birth_date ? new Date(String(child.birth_date)) : null;
      const now = new Date();
      const ageMonths = born && !Number.isNaN(born.getTime())
        ? Math.max(0, (now.getFullYear() - born.getFullYear()) * 12 + now.getMonth() - born.getMonth())
        : 18;
      setProfile((current) => ({ ...current, name: text(child.name, "Profil aktif"), ageMonths, allergy: text(child.allergies, "") }));
    }).catch(() => undefined);
  }, []);

  const saveShoppingList = () => {
    const content = [`Daftar belanja NutriShield — ${profile.name}`, "", ...shopping.map((item) => `- ${item}`), "", "Template; periksa alergi, kebutuhan, harga, dan ketersediaan bahan."].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "daftar-belanja-nutrishield.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell
      title="Rencana makan 7 hari"
      subtitle="Template menu lokal untuk diedit keluarga; belum menjadi rekomendasi gizi tervalidasi"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div>
          <section className="rounded-[28px] border border-[#dce7dd] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#27835a]">
                  <SlidersHorizontal size={14} /> Batas perencanaan
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="text-xs text-[#6f8377]">
                    Wilayah
                    <Input
                      className="mt-2 h-11"
                      value={profile.region}
                      onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                    />
                  </label>
                  <label className="text-xs text-[#6f8377]">
                    Anggaran per hari
                    <Input
                      className="mt-2 h-11"
                      type="number"
                      value={profile.budget}
                      onChange={(e) => setProfile({ ...profile, budget: Number(e.target.value) })}
                    />
                  </label>
                  <label className="text-xs text-[#6f8377]">
                    Alergi
                    <Input
                      className="mt-2 h-11"
                      placeholder="Belum ada catatan"
                      value={profile.allergy}
                      onChange={(e) => setProfile({ ...profile, allergy: e.target.value })}
                    />
                  </label>
                </div>
              </div>
              <Button onClick={() => plan.refetch()} className="h-11 rounded-xl bg-[#173f34]">
                <RefreshCw size={16} className="mr-2" /> Susun ulang
              </Button>
            </div>
          </section>

          <section className="mt-5 overflow-hidden rounded-[28px] border border-[#dce7dd] bg-white">
            <div className="flex flex-col gap-4 border-b border-[#e2eae2] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="text-xl font-semibold">Template minggu ini</h2>
                <p className="mt-1 text-sm text-[#74877c]">
                  Klik satu hari untuk melihat rincian. Harga dan komposisi masih berupa estimasi demo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-[#258057]">
                  <ShieldCheck size={14} /> {data?.coverage ?? 0}% variasi template
                </span>
              </div>
            </div>
            <div className="grid gap-px bg-[#e2eae2] sm:grid-cols-2 lg:grid-cols-3">
              {data?.days.map((day, index) => (
                <button
                  key={day.day}
                  onClick={() => setSelected(index)}
                  className={`min-h-[178px] bg-white p-5 text-left transition hover:bg-[#fbfdfb] ${
                    selected === index ? "ring-2 ring-inset ring-[#40a971]" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[.12em] text-[#789086]">
                      {day.day}
                    </span>
                    {day.verified && <CheckCircle2 size={16} className="text-[#2aa265]" />}
                  </div>
                  <p className="mt-5 text-lg font-semibold leading-6">{day.title}</p>
                  <p className="mt-2 text-xs text-[#74887d]">
                    {day.texture} · {day.focus}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-medium text-[#2a7b57]">
                      Rp{day.estimate.toLocaleString("id-ID")}
                    </span>
                    <ChevronRight size={16} className="text-[#94a49a]" />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {data?.days[selected] && (
            <section className="mt-5 grid overflow-hidden rounded-[28px] border border-[#dce7dd] bg-[#143f33] text-white lg:grid-cols-[.75fr_1.25fr]">
              <img
                src="/manus-storage/nutrishield-local-meal_bb9a48a3.jpg"
                alt="Komponen menu lokal"
                className="h-full min-h-[320px] w-full object-cover"
              />
              <div className="p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#9cdbb2]">
                  Rincian {data.days[selected].day}
                </p>
                <h3 className="mt-4 text-3xl font-semibold tracking-tight">
                  {data.days[selected].title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#bdd3c6]">
                  Template menyaring alergi yang ditulis dan batas biaya secara lokal. Validasi
                  komposisi, ketersediaan bahan, dan kebutuhan anak tetap diperlukan.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {data.days[selected].ingredients.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl bg-white/[.07] p-3 text-sm"
                    >
                      <CheckCircle2 size={16} className="text-[#89daa5]" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.05] p-4">
                  <p className="text-xs text-[#9fc1ae]">Panduan tekstur</p>
                  <p className="mt-1 text-sm">
                    {data.days[selected].texture}. Periksa tulang atau duri bila bahan mengandungnya,
                    lalu sesuaikan ukuran potongan dengan kemampuan makan anak.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5">
          <Card className="border-[#dce7dd] shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff0d9] text-[#aa731f]">
                  <CircleDollarSign />
                </div>
                <CardTitle className="text-lg">Ringkasan biaya</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">Rp{(data?.total ?? 0).toLocaleString("id-ID")}</p>
              <p className="mt-1 text-xs text-[#7a8d82]">perkiraan 7 menu utama</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e9eee8]">
                <div className="h-full rounded-full bg-[#eba944]" style={{ width: `${Math.min(100, ((data?.total ?? 0) / Math.max(profile.budget * 7, 1)) * 100)}%` }} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-[#7a8d82]">Batas mingguan</span>
                <strong>Rp{(profile.budget * 7).toLocaleString("id-ID")}</strong>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#dce7dd] shadow-none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBasket size={20} /> Daftar belanja
                </CardTitle>
                <ListPlus size={18} className="text-[#2b855c]" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {shopping.map((item) => (
                <label key={item} className="flex items-center gap-3 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-[#25875a]" />
                  {item}
                </label>
              ))}
              <Button onClick={saveShoppingList} variant="outline" className="mt-3 w-full">
                <Download size={15} className="mr-2" /> Simpan daftar
              </Button>
            </CardContent>
          </Card>

          <Card className="border-[#dce7dd] bg-[#edf7ef] shadow-none">
            <CardContent className="p-5">
              <MapPin size={20} className="text-[#2a855c]" />
              <p className="mt-4 text-sm font-semibold">Disesuaikan untuk {profile.region}</p>
              <p className="mt-2 text-xs leading-5 text-[#668071]">
                Harga masih berupa estimasi demo. Integrasi harga pasar daerah harus memakai
                API/sumber yang tervalidasi.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
