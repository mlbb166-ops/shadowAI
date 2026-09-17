import React, { useState, useEffect } from "react";
import { X, Check, Baby, Leaf, Send, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeTourModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

const TOUR_STEPS = [
  {
    step: 1,
    badge: "Langkah 1 dari 3: Pantau Tumbuh Kembang",
    title: "Catat Timbangan & Kurva WHO Standar Kemenkes",
    description: "Pantau riwayat penimbangan bulanan balita Anda. NutriShield secara otomatis menghitung z-score Box-Cox LMS WHO Anthro 2006 (BB/U, TB/U, BB/TB) untuk mendeteksi risiko stunting dan perlambatan tumbuh sejak dini.",
    icon: <Baby size={32} className="text-[#1b714c]" />,
    iconBg: "bg-[#e5f4e8]",
    highlight: "Kartu Profil Anak & Timbangan Terakhir"
  },
  {
    step: 2,
    badge: "Langkah 2 dari 3: Kedaulatan Pangan",
    title: "1.646 Data Pangan Lokal Bergizi Tinggi",
    description: "Temukan bahan pangan lokal terjangkau di pasar tradisional (seperti ikan kembung, tempe, hati ayam, dan daun kelor) yang kaya protein hewani dan zat besi pencegah anemia balita, bersumber dari TKPI Kemenkes RI 2020.",
    icon: <Leaf size={32} className="text-[#207c54]" />,
    iconBg: "bg-[#e5f5ea]",
    highlight: "Danau Data Pangan TKPI & Rekomendasi Menu"
  },
  {
    step: 3,
    badge: "Langkah 3 dari 3: Pantau Lewat Ponsel",
    title: "Integrasi Bot Telegram 1 Sentuhan",
    description: "Hubungkan akun keluarga Anda dengan @NutriShieldAIBot di Telegram hanya dengan 1 sentuhan. Tidak perlu mengetik ulang data anak Anda—Bunda bisa mencatat timbangan dan meminta ide menu langsung dari chat!",
    icon: <Send size={32} className="text-[#1e88e5]" />,
    iconBg: "bg-[#e3f2fd]",
    highlight: "Kanal Bot Interaktif @NutriShieldAIBot"
  }
];

export const WelcomeTourModal: React.FC<WelcomeTourModalProps> = ({ forceOpen = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }
    const hasSeenTour = localStorage.getItem("nutrishield_welcome_tour_seen");
    if (!hasSeenTour) {
      // Delay slightly for smooth page load
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleClose = () => {
    localStorage.setItem("nutrishield_welcome_tour_seen", "true");
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  const activeStepData = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[32px] bg-white p-8 shadow-2xl border border-[#d8e3d8]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-xl text-[#627a6e] hover:bg-[#eff5ec] hover:text-[#173f34] transition"
          aria-label="Tutup tur"
        >
          <X size={20} />
        </button>

        {/* Modal Header & Graphic Banner */}
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#173f34] text-[#bceecb]">
            <ShieldCheck size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#237d55]">Panduan Kilat 1 Menit</p>
            <h3 className="text-xl font-extrabold text-[#123e31]">Selamat Datang di NutriShield!</h3>
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="mt-6 flex items-center gap-2">
          {TOUR_STEPS.map((s, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                idx === currentStep ? "bg-[#173f34]" : idx < currentStep ? "bg-[#86d9a4]" : "bg-[#e5ede6]"
              }`}
            />
          ))}
        </div>

        {/* Step Card Content */}
        <div className="mt-6 rounded-2xl border border-[#e2ece2] bg-[#fafcfa] p-6">
          <div className="flex items-start gap-4">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${activeStepData.iconBg}`}>
              {activeStepData.icon}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1e784f]">
                {activeStepData.badge}
              </span>
              <h4 className="mt-1 text-lg font-bold text-[#143e32] leading-snug">
                {activeStepData.title}
              </h4>
            </div>
          </div>

          <p className="mt-4 text-xs sm:text-sm text-[#4e6a5c] leading-relaxed">
            {activeStepData.description}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-white p-3 border border-[#e5eee5] text-xs font-semibold text-[#1a5a3d]">
            <Check size={16} className="text-[#27855b] shrink-0" />
            <span>Fokus Fitur: {activeStepData.highlight}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="text-xs font-bold text-[#6a8275] hover:text-[#173f34] px-3 py-2"
          >
            Lewati Panduan
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="h-12 px-5 rounded-xl border-2 border-[#cfe0d1] text-sm font-semibold text-[#173f34]"
              >
                Kembali
              </Button>
            )}
            <Button
              onClick={handleNext}
              className="h-12 px-7 rounded-xl bg-[#173f34] text-sm font-bold text-white shadow-lg hover:bg-[#225647]"
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Selesai & Mulai Eksplorasi" : "Lanjut →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
