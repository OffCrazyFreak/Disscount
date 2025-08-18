"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleBarcodeScan = () => {
    // TODO: Implement barcode scanning functionality
    console.log("Barcode scanning clicked");
    // For now, we'll just show an alert
    alert("Skeniranje barkoda će biti implementirano uskoro!");
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            {/* Hero Section */}
            <div className="mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                <span className="text-blue-600">Disscount</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8">
                Pronađi najbolje cijene, usporedi trgovine i ušteđi novac
              </p>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 size-6" />
                  <input
                    type="text"
                    placeholder="Pretražite proizvode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 focus:outline-none transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg py-4 bg-blue-600 hover:bg-blue-700"
                  disabled={!searchQuery.trim()}
                >
                  <Search className="size-5 mr-2" />
                  Pretraži proizvode
                </Button>
              </form>
            </div>

            {/* Barcode Scanner */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Ili skeniraj barkod
              </h2>
              <p className="text-gray-600 mb-6">
                Brzo pronađi proizvod skeniranjem barkoda
              </p>

              <Button
                onClick={handleBarcodeScan}
                variant="outline"
                size="lg"
                className="w-full text-lg py-4 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
              >
                <ScanLine className="size-6 mr-2" />
                Skeniraj barkod
              </Button>
            </div>

            {/* Features Preview */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-blue-600 text-3xl mb-4">💰</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Najbolje cijene
                </h3>
                <p className="text-gray-600 text-sm">
                  Usporedba cijena iz svih trgovina u Hrvatskoj
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-blue-600 text-3xl mb-4">📋</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Pametne liste
                </h3>
                <p className="text-gray-600 text-sm">
                  Kreiraj i dijeli liste za kupnju s obitelji
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="text-blue-600 text-3xl mb-4">📈</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Praćenje cijena
                </h3>
                <p className="text-gray-600 text-sm">
                  Prati povijesne cijene i dobivaj obavještenja
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
