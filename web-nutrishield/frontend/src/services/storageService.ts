/**
 * NutriShield Persistent Storage & Clinical Data Engine
 * Standar: Permenkes RI No. 2 Tahun 2020 & WHO Child Growth Standards 2006
 *
 * Mengelola data kohort balita riil (CRUD) yang tersimpan persisten di browser,
 * menghitung Z-score WHO secara deterministik, mendeteksi sinyal 2T (timbangan datar/turun),
 * serta mengekspor data kohort riil ke format CSV & laporan resmi.
 */

import { calculateChildGrowth, Gender, AnthroResult } from '../utils/whoAnthroCalculator';

export interface MeasurementRecord {
  id: string;
  childId: string;
  date: string; // YYYY-MM-DD
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  waz: number; // BB/U
  haz: number; // TB/U
  whz: number; // BB/TB
  hazStatus: string;
  wazStatus: string;
  whzStatus: string;
  overallStatus: 'Normal' | 'Waspada' | 'Stunting' | 'Gizi Buruk';
  isStunted: boolean;
  is2TAlert: boolean; // Timbangan Tidak Naik 2x berturut-turut atau turun
  stomachCapacityMl: number;
  proteinNeededG: number;
  ironNeededMg: number;
  notes?: string;
}

export interface ChildRecord {
  id: string;
  nik: string;
  name: string;
  gender: 'male' | 'female';
  birthDate: string; // YYYY-MM-DD
  parentName: string;
  posyanduName: string;
  address: string;
  allergens: string[]; // e.g. ['seafood', 'telur']
  measurements: MeasurementRecord[];
}

const STORAGE_KEY = 'nutrishield_posyandu_cohort_v1';

// Seed Kohort Awal Berbasis Standar Posyandu Kemenkes RI
const SEED_CHILDREN: ChildRecord[] = [
  {
    id: 'child-01',
    nik: '3276015409240001',
    name: 'Muhammad Bintang Al-Fatih',
    gender: 'male',
    birthDate: '2025-09-14',
    parentName: 'Ibu Sarah Anindita',
    posyanduName: 'Posyandu Mawar III, Depok',
    address: 'Jl. Margonda Raya No. 42, RT 02/RW 04',
    allergens: ['seafood'],
    measurements: [
      {
        id: 'm-01-prev',
        childId: 'child-01',
        date: '2026-08-14',
        ageMonths: 11,
        weightKg: 8.6,
        heightCm: 73.5,
        waz: -0.92,
        haz: -0.72,
        whz: -0.85,
        hazStatus: 'Normal',
        wazStatus: 'Berat Badan Normal',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Normal',
        isStunted: false,
        is2TAlert: false,
        stomachCapacityMl: 215,
        proteinNeededG: 11.2,
        ironNeededMg: 7,
        notes: 'Penimbangan rutin bulan lalu.'
      },
      {
        id: 'm-01-latest',
        childId: 'child-01',
        date: '2026-09-14',
        ageMonths: 12,
        weightKg: 8.7,
        heightCm: 74.8,
        waz: -0.89,
        haz: -0.68,
        whz: -0.79,
        hazStatus: 'Normal',
        wazStatus: 'Berat Badan Normal',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Normal',
        isStunted: false,
        is2TAlert: false,
        stomachCapacityMl: 218,
        proteinNeededG: 11.3,
        ironNeededMg: 7,
        notes: 'Pertumbuhan baik, alergi ikan laut (diberikan telur ayam & tempe).'
      }
    ]
  },
  {
    id: 'child-02',
    nik: '3276015812240002',
    name: 'Siti Aisyah Azzahra',
    gender: 'female',
    birthDate: '2025-06-10',
    parentName: 'Ibu Nurul Hidayah',
    posyanduName: 'Posyandu Mawar III, Depok',
    address: 'Gang Kober No. 15, RT 01/RW 03',
    allergens: [],
    measurements: [
      {
        id: 'm-02-prev',
        childId: 'child-02',
        date: '2026-08-10',
        ageMonths: 14,
        weightKg: 7.6,
        heightCm: 69.5,
        waz: -2.35,
        haz: -2.48,
        whz: -1.25,
        hazStatus: 'Pendek (Stunted)',
        wazStatus: 'Berat Badan Kurang (Underweight)',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Stunting',
        isStunted: true,
        is2TAlert: false,
        stomachCapacityMl: 190,
        proteinNeededG: 9.9,
        ironNeededMg: 7,
        notes: 'Terindikasi stunting kronis dari panjang badan.'
      },
      {
        id: 'm-02-latest',
        childId: 'child-02',
        date: '2026-09-10',
        ageMonths: 15,
        weightKg: 7.6,
        heightCm: 70.0,
        waz: -2.48,
        haz: -2.52,
        whz: -1.35,
        hazStatus: 'Pendek (Stunted)',
        wazStatus: 'Berat Badan Kurang (Underweight)',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Stunting',
        isStunted: true,
        is2TAlert: true, // Timbangan tidak naik (7.6 -> 7.6 kg)
        stomachCapacityMl: 190,
        proteinNeededG: 9.9,
        ironNeededMg: 7,
        notes: 'PERINGATAN 2T: Berat badan mendatar 2 bulan berturut-turut. Rujukan Puskesmas Beji & intervensi MPASI Kelor + Kembung 2x sehari.'
      }
    ]
  },
  {
    id: 'child-03',
    nik: '3276016104250003',
    name: 'Raffi Ahmad Prasetyo',
    gender: 'male',
    birthDate: '2025-11-20',
    parentName: 'Ibu Dewi Sartika',
    posyanduName: 'Posyandu Mawar III, Depok',
    address: 'Jl. Sawo No. 8, RT 05/RW 04',
    allergens: ['telur'],
    measurements: [
      {
        id: 'm-03-latest',
        childId: 'child-03',
        date: '2026-09-12',
        ageMonths: 10,
        weightKg: 8.9,
        heightCm: 73.0,
        waz: -0.15,
        haz: -0.22,
        whz: -0.05,
        hazStatus: 'Normal',
        wazStatus: 'Berat Badan Normal',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Normal',
        isStunted: false,
        is2TAlert: false,
        stomachCapacityMl: 222,
        proteinNeededG: 11.6,
        ironNeededMg: 11,
        notes: 'Tumbuh kembang optimal, alergi putih telur.'
      }
    ]
  },
  {
    id: 'child-04',
    nik: '3276014502250004',
    name: 'Kinara Putri Ramadhani',
    gender: 'female',
    birthDate: '2025-04-05',
    parentName: 'Ibu Fatimah Az-Zahra',
    posyanduName: 'Posyandu Mawar III, Depok',
    address: 'Jl. KH M. Usman No. 12',
    allergens: [],
    measurements: [
      {
        id: 'm-04-prev',
        childId: 'child-04',
        date: '2026-08-05',
        ageMonths: 16,
        weightKg: 7.9,
        heightCm: 72.8,
        waz: -2.20,
        haz: -2.31,
        whz: -1.20,
        hazStatus: 'Pendek (Stunted)',
        wazStatus: 'Berat Badan Kurang (Underweight)',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Stunting',
        isStunted: true,
        is2TAlert: false,
        stomachCapacityMl: 198,
        proteinNeededG: 10.3,
        ironNeededMg: 7,
        notes: 'Mendapat PMT Beras Fortifikasi & Abon Ikan Lele.'
      },
      {
        id: 'm-04-latest',
        childId: 'child-04',
        date: '2026-09-05',
        ageMonths: 17,
        weightKg: 8.3,
        heightCm: 74.5,
        waz: -1.95,
        haz: -2.15,
        whz: -1.05,
        hazStatus: 'Pendek (Stunted)',
        wazStatus: 'Berat Badan Normal',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Waspada',
        isStunted: true,
        is2TAlert: false,
        stomachCapacityMl: 208,
        proteinNeededG: 10.8,
        ironNeededMg: 7,
        notes: 'Kenaikan BB +400g pasca intervensi protein hewani kembung 50g/hari.'
      }
    ]
  },
  {
    id: 'child-05',
    nik: '3276016807250005',
    name: 'Alvaro Arsenio Putra',
    gender: 'male',
    birthDate: '2026-01-15',
    parentName: 'Ibu Rina Marlina',
    posyanduName: 'Posyandu Mawar III, Depok',
    address: 'Jl. Belimbing No. 3',
    allergens: [],
    measurements: [
      {
        id: 'm-05-latest',
        childId: 'child-05',
        date: '2026-09-14',
        ageMonths: 8,
        weightKg: 8.2,
        heightCm: 70.2,
        waz: -0.32,
        haz: -0.28,
        whz: -0.25,
        hazStatus: 'Normal',
        wazStatus: 'Berat Badan Normal',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Normal',
        isStunted: false,
        is2TAlert: false,
        stomachCapacityMl: 205,
        proteinNeededG: 10.7,
        ironNeededMg: 11,
        notes: 'Baru mulai MPASI tekstur lumat (puree ikan kembung + labu kuning).'
      }
    ]
  },
  {
    id: 'child-06',
    nik: '3276015505240006',
    name: 'Bilqis Humaira Khansa',
    gender: 'female',
    birthDate: '2024-12-01',
    parentName: 'Ibu Kurniawati',
    posyanduName: 'Posyandu Mawar III, Depok',
    address: 'Jl. Kedondong No. 9',
    allergens: ['kacang kedelai'],
    measurements: [
      {
        id: 'm-06-prev',
        childId: 'child-06',
        date: '2026-08-01',
        ageMonths: 20,
        weightKg: 8.8,
        heightCm: 76.5,
        waz: -2.12,
        haz: -2.25,
        whz: -1.30,
        hazStatus: 'Pendek (Stunted)',
        wazStatus: 'Berat Badan Kurang (Underweight)',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Stunting',
        isStunted: true,
        is2TAlert: false,
        stomachCapacityMl: 220,
        proteinNeededG: 11.4,
        ironNeededMg: 7,
        notes: 'Alergi kedelai (tidak boleh tempe/tahu).'
      },
      {
        id: 'm-06-latest',
        childId: 'child-06',
        date: '2026-09-01',
        ageMonths: 21,
        weightKg: 8.7,
        heightCm: 76.8,
        waz: -2.28,
        haz: -2.30,
        whz: -1.45,
        hazStatus: 'Pendek (Stunted)',
        wazStatus: 'Berat Badan Kurang (Underweight)',
        whzStatus: 'Gizi Baik (Normal)',
        overallStatus: 'Stunting',
        isStunted: true,
        is2TAlert: true, // Turun 100g (8.8 -> 8.7 kg)
        stomachCapacityMl: 218,
        proteinNeededG: 11.3,
        ironNeededMg: 7,
        notes: 'PERINGATAN 2T: Berat badan turun pasca diare. Segera beri oralit & rujuk dokter Puskesmas.'
      }
    ]
  }
];

export const storageService = {
  /**
   * Mengambil semua daftar balita binaan posyandu
   */
  getChildren(): ChildRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Gagal membaca storage kohort:', e);
    }
    // Seed awal jika kosong
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CHILDREN));
    return SEED_CHILDREN;
  },

  /**
   * Mengambil data balita berdasarkan ID
   */
  getChildById(id: string): ChildRecord | undefined {
    const children = this.getChildren();
    return children.find(c => c.id === id);
  },

  /**
   * Menyimpan penimbangan antropometri baru (Bisa untuk balita baru atau balita yang sudah ada).
   * Menghitung Box-Cox LMS WHO Z-Score secara deterministik dan mengevaluasi indikator 2T.
   */
  recordMeasurement(input: {
    childId?: string;
    nik: string;
    name: string;
    gender: 'male' | 'female';
    birthDate: string;
    ageMonths: number;
    weightKg: number;
    heightCm: number;
    parentName: string;
    posyanduName?: string;
    address?: string;
    allergens?: string[];
    notes?: string;
    date?: string;
  }): { child: ChildRecord; measurement: MeasurementRecord; anthroResult: AnthroResult } {
    const children = this.getChildren();
    const currentDate = input.date || new Date().toISOString().split('T')[0];

    // 1. Eksekusi Engine Antropometri WHO 2006
    const anthro = calculateChildGrowth({
      childName: input.name,
      gender: input.gender,
      ageMonths: input.ageMonths,
      weightKg: input.weightKg,
      heightCm: input.heightCm
    });

    let existingChild = input.childId ? children.find(c => c.id === input.childId) : null;
    if (!existingChild) {
      existingChild = children.find(c => c.nik === input.nik);
    }

    // 2. Evaluasi 2T (Timbangan Tidak Naik 2x berturut-turut atau Turun)
    let is2TAlert = false;
    if (existingChild && existingChild.measurements.length > 0) {
      const prev = existingChild.measurements[existingChild.measurements.length - 1];
      if (input.weightKg <= prev.weightKg) {
        is2TAlert = true;
      }
    }

    // 3. Bangun objek MeasurementRecord
    const newMeasurement: MeasurementRecord = {
      id: `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      childId: existingChild ? existingChild.id : `child-${Date.now()}`,
      date: currentDate,
      ageMonths: input.ageMonths,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      waz: anthro.waz,
      haz: anthro.haz,
      whz: anthro.whz,
      wazStatus: anthro.wazStatus,
      hazStatus: anthro.hazStatus,
      whzStatus: anthro.whzStatus,
      overallStatus: anthro.overallStatus,
      isStunted: anthro.haz < -2.0,
      is2TAlert,
      stomachCapacityMl: anthro.stomachCapacityMl,
      proteinNeededG: anthro.proteinNeededG,
      ironNeededMg: anthro.ironNeededMg,
      notes: input.notes || (is2TAlert ? 'PERINGATAN 2T: Berat badan tidak naik/turun dibanding kunjungan sebelumnya.' : 'Penimbangan posyandu tercatat.')
    };

    let updatedChild: ChildRecord;

    if (existingChild) {
      // Tambahkan pengukuran ke balita yang sudah ada
      updatedChild = {
        ...existingChild,
        name: input.name,
        parentName: input.parentName || existingChild.parentName,
        allergens: input.allergens || existingChild.allergens,
        measurements: [...existingChild.measurements, newMeasurement]
      };
      const index = children.findIndex(c => c.id === existingChild!.id);
      children[index] = updatedChild;
    } else {
      // Registrasi balita baru
      updatedChild = {
        id: newMeasurement.childId,
        nik: input.nik,
        name: input.name,
        gender: input.gender,
        birthDate: input.birthDate,
        parentName: input.parentName,
        posyanduName: input.posyanduName || 'Posyandu Mawar III, Depok',
        address: input.address || 'Kecamatan Beji, Depok',
        allergens: input.allergens || [],
        measurements: [newMeasurement]
      };
      children.unshift(updatedChild);
    }

    // 4. Simpan ke LocalStorage secara persisten
    localStorage.setItem(STORAGE_KEY, JSON.stringify(children));

    return {
      child: updatedChild,
      measurement: newMeasurement,
      anthroResult: anthro
    };
  },

  /**
   * Menghapus balita dari kohort
   */
  deleteChild(childId: string): void {
    const children = this.getChildren();
    const filtered = children.filter(c => c.id !== childId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  /**
   * Menghapus pengukuran spesifik balita
   */
  deleteMeasurement(childId: string, measurementId: string): void {
    const children = this.getChildren();
    const child = children.find(c => c.id === childId);
    if (child) {
      child.measurements = child.measurements.filter(m => m.id !== measurementId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(children));
    }
  },

  /**
   * Mereset data kembali ke seed resmi Posyandu
   */
  resetToDefaultSeed(): ChildRecord[] {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CHILDREN));
    return SEED_CHILDREN;
  },

  /**
   * Mengekspor data kohort riil ke format CSV yang kompatibel dengan Excel (UTF-8 BOM)
   */
  exportCohortToCsv(): void {
    const children = this.getChildren();
    
    // Header CSV Resmi Permenkes / Posyandu
    const headers = [
      'ID Balita',
      'NIK Balita',
      'Nama Balita',
      'Jenis Kelamin',
      'Tanggal Lahir',
      'Nama Orang Tua / Ibu',
      'Alamat & RT/RW',
      'Tanggal Periksa',
      'Usia (Bulan)',
      'Berat Badan (kg)',
      'Tinggi Badan (cm)',
      'Z-Score BB/U (WAZ)',
      'Status BB/U',
      'Z-Score TB/U (HAZ)',
      'Status Stunting (TB/U)',
      'Z-Score BB/TB (WHZ)',
      'Status Gizi (WHZ)',
      'Diagnosis Keseluruhan',
      'Indikator 2T (Peringatan Dini)',
      'Kapasitas Lambung (ml)',
      'Kebutuhan Protein Harian (g)',
      'Alergen Makanan',
      'Catatan Kader Posyandu'
    ];

    const rows: string[][] = [];

    children.forEach(child => {
      // Ambil pengukuran terakhir atau setiap pengukuran
      child.measurements.forEach(m => {
        rows.push([
          `"${child.id}"`,
          `"'${child.nik}"`, // Petik satu agar NIK tidak diubah scientific notation oleh Excel
          `"${child.name.replace(/"/g, '""')}"`,
          `"${child.gender === 'male' ? 'Laki-laki' : 'Perempuan'}"`,
          `"${child.birthDate}"`,
          `"${child.parentName.replace(/"/g, '""')}"`,
          `"${child.address.replace(/"/g, '""')}"`,
          `"${m.date}"`,
          `${m.ageMonths}`,
          `${m.weightKg}`,
          `${m.heightCm}`,
          `${m.waz}`,
          `"${m.wazStatus}"`,
          `${m.haz}`,
          `"${m.hazStatus}"`,
          `${m.whz}`,
          `"${m.whzStatus}"`,
          `"${m.overallStatus}"`,
          `"${m.is2TAlert ? 'YA - PERINGATAN 2T (TIDAK NAIK/TURUN)' : 'TIDAK (NORMAL)'}"`,
          `${m.stomachCapacityMl}`,
          `${m.proteinNeededG}`,
          `"${child.allergens.join(', ') || 'Tidak ada'}"`,
          `"${(m.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    });

    // Gabungkan dengan CRLF dan tambahkan UTF-8 BOM (\uFEFF)
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    // Trigger unduhan otomatis di browser
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Kohort_NutriShield_Posyandu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Menghitung statistik kohort riil untuk KPI Dashboard
   */
  getCohortKPIs() {
    const children = this.getChildren();
    let totalChildren = children.length;
    let stuntedCount = 0;
    let alert2TCount = 0;
    let normalCount = 0;
    let wastingCount = 0;

    children.forEach(c => {
      if (c.measurements.length > 0) {
        const latest = c.measurements[c.measurements.length - 1];
        if (latest.isStunted) stuntedCount++;
        if (latest.is2TAlert) alert2TCount++;
        if (latest.overallStatus === 'Normal') normalCount++;
        if (latest.whz < -2.0) wastingCount++;
      }
    });

    const stuntingRate = totalChildren > 0 ? ((stuntedCount / totalChildren) * 100).toFixed(1) : '0';

    return {
      totalChildren,
      stuntedCount,
      alert2TCount,
      normalCount,
      wastingCount,
      stuntingRate: `${stuntingRate}%`
    };
  }
};
