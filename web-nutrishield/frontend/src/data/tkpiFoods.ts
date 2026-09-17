export interface FoodItem {
  id: string;
  name: string;
  category: 'Ikan & Laut' | 'Daging & Unggas' | 'Sayuran' | 'Nabati & Telur' | 'Pokok';
  origin: 'Lokal Nusantara' | 'Impor';
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  calciumMg: number;
  ironMg: number;
  zincMg: number;
  vitAMcg: number;
  omega3G: number;
  pricePerKg: number;
  servingPortion: string;
  allergens: string[];
  clinicalNotes: string;
  highlightBenefit: string;
}

export const TKPI_FOODS: FoodItem[] = [
  {
    id: 'ikan-kembung',
    name: 'Ikan Kembung Segar',
    category: 'Ikan & Laut',
    origin: 'Lokal Nusantara',
    energyKcal: 112,
    proteinG: 21.4,
    fatG: 2.3,
    carbsG: 0.0,
    calciumMg: 136,
    ironMg: 2.0,
    zincMg: 1.1,
    vitAMcg: 30,
    omega3G: 2.2,
    pricePerKg: 35000,
    servingPortion: '50g (1/2 ekor sedang, suwir bebas duri)',
    allergens: ['ikan laut', 'seafood'],
    clinicalNotes: 'Kandungan Omega-3 (DHA+EPA) 57% melampaui salmon impor. Posisi rantai makanan rendah meminimalkan bioakumulasi merkuri.',
    highlightBenefit: 'Juara Omega-3 DHA Otak (2.2g) dengan Biaya 8.2x Lebih Hemat'
  },
  {
    id: 'ikan-salmon',
    name: 'Ikan Salmon Atlantik Fillet',
    category: 'Ikan & Laut',
    origin: 'Impor',
    energyKcal: 142,
    proteinG: 19.8,
    fatG: 6.3,
    carbsG: 0.0,
    calciumMg: 12,
    ironMg: 0.8,
    zincMg: 0.6,
    vitAMcg: 26,
    omega3G: 1.4,
    pricePerKg: 320000,
    servingPortion: '50g fillet',
    allergens: ['ikan laut', 'seafood'],
    clinicalNotes: 'Harga sangat mahal untuk keluarga prasejahtera. Berisiko penurunan mutu histamin jika proses rantai dingin impor terputus.',
    highlightBenefit: 'Standar Impor Populer, namun kalah densitas DHA dibanding Kembung'
  },
  {
    id: 'daun-kelor',
    name: 'Daun Kelor Segar',
    category: 'Sayuran',
    origin: 'Lokal Nusantara',
    energyKcal: 92,
    proteinG: 6.7,
    fatG: 1.7,
    carbsG: 12.5,
    calciumMg: 440,
    ironMg: 7.0,
    zincMg: 0.9,
    vitAMcg: 1130,
    omega3G: 0.1,
    pricePerKg: 20000,
    servingPortion: '1 sendok makan sayur cincang lumat (15g)',
    allergens: [],
    clinicalNotes: 'Densitas kalsium 3.6x lebih pekat dari susu sapi cair. Kaya antioksidan alami, melancarkan produksi hormon ASI ibu.',
    highlightBenefit: 'Superfood Tulang: 440mg Kalsium & 7mg Zat Besi per 100g'
  },
  {
    id: 'bayam-hijau',
    name: 'Bayam Hijau Segar',
    category: 'Sayuran',
    origin: 'Lokal Nusantara',
    energyKcal: 36,
    proteinG: 3.5,
    fatG: 0.5,
    carbsG: 6.5,
    calciumMg: 166,
    ironMg: 3.5,
    zincMg: 0.6,
    vitAMcg: 469,
    omega3G: 0.05,
    pricePerKg: 15000,
    servingPortion: '1 sendok makan sayur rebus cincang',
    allergens: [],
    clinicalNotes: 'Bagus untuk variasi serat balita, namun zat besi nabatinya membutuhkan vitamin C pendamping untuk penyerapan optimal.',
    highlightBenefit: 'Sayuran Harian Ringan untuk Variasi Serat Balita'
  },
  {
    id: 'daging-sapi-cincang',
    name: 'Daging Sapi Segar (Cincang Halus)',
    category: 'Daging & Unggas',
    origin: 'Lokal Nusantara',
    energyKcal: 201,
    proteinG: 22.0,
    fatG: 14.0,
    carbsG: 0.0,
    calciumMg: 11,
    ironMg: 2.8,
    zincMg: 4.8,
    vitAMcg: 0,
    omega3G: 0.2,
    pricePerKg: 130000,
    servingPortion: '2 sendok makan peres daging matang (30g)',
    allergens: ['daging sapi'],
    clinicalNotes: 'Sumber zat besi hewani heme terbaik dengan bioavailabilitas tertinggi (diserap 25% oleh usus balita). Sangat aman bagi lambung balita 1 tahun 200 ml.',
    highlightBenefit: 'Pencegah Anemia Utama: Zat Besi Heme & Seng Pertumbuhan'
  },
  {
    id: 'hati-ayam',
    name: 'Hati Ayam Segar',
    category: 'Daging & Unggas',
    origin: 'Lokal Nusantara',
    energyKcal: 167,
    proteinG: 24.4,
    fatG: 5.5,
    carbsG: 0.9,
    calciumMg: 18,
    ironMg: 15.8,
    zincMg: 3.2,
    vitAMcg: 3290,
    omega3G: 0.2,
    pricePerKg: 25000,
    servingPortion: '1 potong hati sedang rebus lumat (25g)',
    allergens: ['unggas'],
    clinicalNotes: 'Booster hemoglobin paling efektif dan murah. Memberikan cadangan zat besi dan vitamin A esensial untuk imunitas dari batuk pilek.',
    highlightBenefit: 'Konsentrasi Zat Besi 15.8mg: Booster Cepat Berat Badan'
  },
  {
    id: 'telur-puyuh',
    name: 'Telur Puyuh Rebus',
    category: 'Nabati & Telur',
    origin: 'Lokal Nusantara',
    energyKcal: 158,
    proteinG: 13.0,
    fatG: 11.1,
    carbsG: 0.4,
    calciumMg: 64,
    ironMg: 3.65,
    zincMg: 1.5,
    vitAMcg: 300,
    omega3G: 0.15,
    pricePerKg: 35000,
    servingPortion: '2 - 3 butir rebus lumat',
    allergens: ['telur'],
    clinicalNotes: 'Ukuran mungil pas untuk kapasitas lambung balita. Kaya kolin pembentuk memori otak dan tidak membuat anak eneg.',
    highlightBenefit: 'Kaya Kolin Memori Otak & Tekstur Lembut Ramah Balita'
  },
  {
    id: 'tempe-kedelai',
    name: 'Tempe Kedelai Murni',
    category: 'Nabati & Telur',
    origin: 'Lokal Nusantara',
    energyKcal: 201,
    proteinG: 20.8,
    fatG: 8.8,
    carbsG: 13.5,
    calciumMg: 517,
    ironMg: 2.7,
    zincMg: 1.8,
    vitAMcg: 0,
    omega3G: 0.2,
    pricePerKg: 14000,
    servingPortion: '1 potong dadu kukus lumat (25g)',
    allergens: ['kedelai'],
    clinicalNotes: 'Fermentasi kapang Rhizopus mengurai fitat sehingga kalsium (517 mg) dan protein sangat mudah dicerna usus halus anak.',
    highlightBenefit: 'Probiotik Alami & Kalsium Padat (517mg per 100g)'
  },
  {
    id: 'belut-sawah',
    name: 'Belut Sawah / Sidat Segar',
    category: 'Ikan & Laut',
    origin: 'Lokal Nusantara',
    energyKcal: 250,
    proteinG: 18.4,
    fatG: 19.5,
    carbsG: 0.0,
    calciumMg: 247,
    ironMg: 2.0,
    zincMg: 2.5,
    vitAMcg: 1350,
    omega3G: 0.8,
    pricePerKg: 85000,
    servingPortion: '1 potong sedang bumbu kuning (khusus bumil)',
    allergens: ['ikan air tawar'],
    clinicalNotes: 'Superfood Ibu Hamil Trimester 2 & 3: Kalori tinggi (250 kkal), lemak sehat, dan vitamin A memacu kenaikan berat badan janin untuk mencegah BBLR.',
    highlightBenefit: 'Superfood Ibu Hamil Anti-BBLR (250 kkal & Vit A Tinggi)'
  },
  {
    id: 'teri-basah',
    name: 'Ikan Teri Basah Tawar',
    category: 'Ikan & Laut',
    origin: 'Lokal Nusantara',
    energyKcal: 77,
    proteinG: 16.0,
    fatG: 1.0,
    carbsG: 0.0,
    calciumMg: 500,
    ironMg: 3.9,
    zincMg: 1.8,
    vitAMcg: 12,
    omega3G: 1.1,
    pricePerKg: 35000,
    servingPortion: '1 sendok makan teri cincang (20g)',
    allergens: ['ikan laut', 'seafood'],
    clinicalNotes: 'Dimakan bersama tulang lunaknya, menghasilkan pasokan kalsium dan fosfor alami yang langsung diserap tulang balita.',
    highlightBenefit: 'Kalsium Tulang Alami Utuh & Omega-3 Terjangkau'
  }
];
