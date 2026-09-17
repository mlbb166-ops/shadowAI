import AppShell from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Database,
  FileSearch,
  Fingerprint,
  Info,
  Layers3,
} from "lucide-react";

export default function Sources() {
  const query = trpc.knowledge.sources.useQuery();
  const data = query.data;

  return (
    <AppShell
      title="Sumber data & transparansi"
      subtitle="Lihat asal data, tingkat kepercayaan, dan batasan yang belum diselesaikan"
    >
      <section className="rounded-[30px] bg-[#133f33] p-6 text-white sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_.8fr]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-[#9cdbb2]">
              <Fingerprint size={15} /> Data lineage
            </div>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">
              Kepercayaan tidak datang dari label “AI”.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#bed4c7]">
              NutriShield menunjukkan dari mana data berasal, apa yang belum lengkap, dan aturan
              mana yang membuat keputusan. Dataset tidak otomatis dianggap benar hanya karena
              ukurannya besar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DarkStat
              value={(data?.stats.records ?? 1646).toLocaleString("id-ID")}
              label="record bersumber"
            />
            <DarkStat
              value={(data?.stats.officialIndex ?? 1146).toLocaleString("id-ID")}
              label="indeks sumber resmi"
            />
            <DarkStat
              value={(data?.stats.packaged ?? 500).toLocaleString("id-ID")}
              label="produk kemasan"
            />
            <DarkStat value="3" label="lapisan provenance" />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="border-[#dce7dd] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Database size={21} className="text-[#29835a]" /> Register sumber
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.sources.map((source) => (
              <div key={source.id} className="rounded-2xl border border-[#e0e9e1] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf5ee] text-[#29835a]">
                    <BookOpenCheck size={19} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{source.name}</p>
                      <span className="text-[10px] font-medium uppercase tracking-[.12em] text-[#7c8e84]">
                        {source.type}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#72867a]">{source.note}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[#72867a]">
                      <span>{source.records.toLocaleString("id-ID")} record</span>
                      <span>
                        Kepercayaan: <strong className="text-[#365d4b]">{source.confidence}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-[#268158]">
                        <CheckCircle2 size={12} />
                        {source.status}
                      </span>
                    </div>
                  </div>
                  {source.url !== "#" && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#258158]"
                    >
                      <ArrowUpRight size={18} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border-[#efd7a7] bg-[#fff9ea] shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle size={20} className="text-[#ae761d]" /> Batasan penting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-5 text-[#756545]">
              <p>
                <strong>Indeks bukan komposisi lengkap.</strong> Snapshot Panganku berisi indeks
                1.146 pangan; detail nutrisi perlu diambil dan diverifikasi dari halaman rincian.
              </p>
              <p>
                <strong>Harga belum real-time.</strong> Angka biaya pada demo adalah estimasi, bukan
                feed Bapanas langsung.
              </p>
              <p>
                <strong>Belum tervalidasi klinis.</strong> Aturan keselamatan perlu review ahli
                gizi/dokter sebelum penggunaan publik.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#dce7dd] shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers3 size={19} /> Urutan kepercayaan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Rank no="1" title="Aturan keselamatan" note="Memblokir tindakan berisiko" />
              <Rank no="2" title="Data dengan provenance" note="Memilih fakta yang boleh dipakai" />
              <Rank no="3" title="AI bahasa" note="Menjelaskan tanpa mengubah fakta" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-5 rounded-[28px] border border-[#dce7dd] bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Contoh katalog yang digunakan agent</h2>
            <p className="mt-1 text-sm text-[#74877c]">
              Setiap item menyimpan kode, kelompok, peran, dan sumber.
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#277f58]">
            <FileSearch size={14} /> Audit siap
          </span>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#dfe8df] text-xs text-[#788b80]">
                <th className="pb-3 font-medium">Kode</th>
                <th className="pb-3 font-medium">Bahan</th>
                <th className="pb-3 font-medium">Kelompok</th>
                <th className="pb-3 font-medium">Peran dalam sistem</th>
                <th className="pb-3 font-medium">Sumber</th>
              </tr>
            </thead>
            <tbody>
              {data?.catalog.slice(0, 7).map((food) => (
                <tr key={food.id} className="border-b border-[#edf1ed] last:border-0">
                  <td className="py-4 font-mono text-xs text-[#75887d]">{food.id}</td>
                  <td className="py-4 font-medium">{food.name}</td>
                  <td className="py-4 text-[#6d8276]">{food.group}</td>
                  <td className="py-4 text-[#6d8276]">{food.role}</td>
                  <td className="py-4 text-[#278059]">{food.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#f5f8f4] p-4 text-xs leading-5 text-[#708479]">
          <Info size={15} className="mt-0.5 shrink-0" /> Kode pada prototipe adalah seed katalog
          internal untuk demonstrasi alur. Sebelum produksi, setiap kode harus dicocokkan kembali
          dengan record sumber.
        </div>
      </section>
    </AppShell>
  );
}

function DarkStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-[11px] text-[#a9c7b7]">{label}</p>
    </div>
  );
}

function Rank({ no, title, note }: { no: string; title: string; note: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#e8f3ea] text-xs font-semibold text-[#2b825b]">
        {no}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[11px] text-[#7b8e83]">{note}</p>
      </div>
    </div>
  );
}
