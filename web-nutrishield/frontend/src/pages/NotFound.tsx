import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#f6f8f4] to-[#edf5ee]">
      <Card className="w-full max-w-lg mx-4 shadow-lg border border-[#dce7dd] bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-[#153a2f] mb-2 font-mono">404</h1>

          <h2 className="text-xl font-semibold text-[#153a2f] mb-4">
            Halaman Tidak Ditemukan
          </h2>

          <p className="text-[#667d71] mb-8 leading-relaxed text-sm">
            Halaman yang Anda cari tidak tersedia atau tautan sudah berpindah.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-[#173f34] hover:bg-[#225647] text-white px-6 py-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
