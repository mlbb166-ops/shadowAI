/**
 * WHO Child Growth Standards (2006) & Permenkes RI No. 2 Tahun 2020
 * Deterministik Box-Cox LMS Calculation Engine
 */

export type Gender = 'male' | 'female';

export interface AnthroInput {
  childName: string;
  gender: Gender;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
}

export interface AnthroResult {
  childName: string;
  ageMonths: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  waz: number; // BB/U
  haz: number; // TB/U
  whz: number; // BB/TB
  wazStatus: string;
  hazStatus: string;
  whzStatus: string;
  overallStatus: 'Normal' | 'Waspada' | 'Stunting' | 'Gizi Buruk';
  statusBadgeColor: 'green' | 'yellow' | 'red' | 'blue';
  recommendations: string[];
  stomachCapacityMl: number;
  proteinNeededG: number;
  ironNeededMg: number;
}

// Representative LMS tables for WHO standards (Interpolated for 0 - 60 months)
// L = Box-Cox power, M = Median, S = Coefficient of variation
const WHO_LMS_DATA: Record<Gender, Record<number, { waz: [number, number, number]; haz: [number, number, number] }>> = {
  male: {
    0: { waz: [0.3487, 3.346, 0.14602], haz: [1, 49.88, 0.03795] },
    3: { waz: [0.1580, 6.402, 0.12260], haz: [1, 61.42, 0.03487] },
    6: { waz: [0.0315, 7.934, 0.11325], haz: [1, 67.62, 0.03402] },
    9: { waz: [-0.0465, 8.878, 0.11026], haz: [1, 71.96, 0.03421] },
    12: { waz: [-0.0988, 9.617, 0.10982], haz: [1, 75.74, 0.03478] },
    18: { waz: [-0.1568, 10.908, 0.11030], haz: [1, 82.32, 0.03582] },
    24: { waz: [-0.1983, 12.151, 0.11180], haz: [1, 87.82, 0.03712] },
    36: { waz: [-0.2312, 14.338, 0.11720], haz: [1, 96.11, 0.03920] },
    48: { waz: [-0.2520, 16.325, 0.12350], haz: [1, 103.32, 0.04100] },
    60: { waz: [-0.2700, 18.310, 0.13010], haz: [1, 110.02, 0.04250] },
  },
  female: {
    0: { waz: [0.3809, 3.232, 0.14171], haz: [1, 49.14, 0.03790] },
    3: { waz: [0.1950, 5.845, 0.12450], haz: [1, 59.81, 0.03490] },
    6: { waz: [0.0712, 7.297, 0.11620], haz: [1, 65.73, 0.03420] },
    9: { waz: [-0.0035, 8.243, 0.11410], haz: [1, 70.14, 0.03450] },
    12: { waz: [-0.0520, 8.948, 0.11430], haz: [1, 74.02, 0.03520] },
    18: { waz: [-0.1120, 10.236, 0.11620], haz: [1, 80.71, 0.03650] },
    24: { waz: [-0.1550, 11.482, 0.11890], haz: [1, 86.42, 0.03800] },
    36: { waz: [-0.1990, 13.850, 0.12600], haz: [1, 95.10, 0.04010] },
    48: { waz: [-0.2240, 16.020, 0.13320], haz: [1, 102.70, 0.04210] },
    60: { waz: [-0.2450, 18.210, 0.14100], haz: [1, 109.40, 0.04380] },
  }
};

function calculateBoxCoxZ(y: number, l: number, m: number, s: number): number {
  if (y <= 0 || m <= 0 || s <= 0) return 0;
  if (Math.abs(l) < 0.0001) {
    return Math.log(y / m) / s;
  }
  return (Math.pow(y / m, l) - 1) / (l * s);
}

function interpolateLMS(gender: Gender, ageMonths: number, indicator: 'waz' | 'haz'): [number, number, number] {
  const table = WHO_LMS_DATA[gender];
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  
  if (ageMonths <= keys[0]) return table[keys[0]][indicator];
  if (ageMonths >= keys[keys.length - 1]) return table[keys[keys.length - 1]][indicator];

  // Linear interpolation between closest keys
  let lower = keys[0];
  let upper = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (ageMonths >= keys[i] && ageMonths <= keys[i + 1]) {
      lower = keys[i];
      upper = keys[i + 1];
      break;
    }
  }

  const factor = (ageMonths - lower) / (upper - lower);
  const l1 = table[lower][indicator];
  const l2 = table[upper][indicator];

  return [
    l1[0] + factor * (l2[0] - l1[0]),
    l1[1] + factor * (l2[1] - l1[1]),
    l1[2] + factor * (l2[2] - l1[2]),
  ];
}

export function calculateChildGrowth(input: AnthroInput): AnthroResult {
  const { childName, gender, ageMonths, weightKg, heightCm } = input;

  // 1. Z-Score BB/U (WAZ)
  const [wL, wM, wS] = interpolateLMS(gender, ageMonths, 'waz');
  const waz = Number(calculateBoxCoxZ(weightKg, wL, wM, wS).toFixed(2));

  // 2. Z-Score TB/U (HAZ)
  const [hL, hM, hS] = interpolateLMS(gender, ageMonths, 'haz');
  const haz = Number(calculateBoxCoxZ(heightCm, hL, hM, hS).toFixed(2));

  // 3. Approximate Z-Score BB/TB (WHZ) based on median expected height
  const expectedWeightForHeight = wM * Math.pow(heightCm / hM, 2.5);
  const whz = Number(((weightKg - expectedWeightForHeight) / (expectedWeightForHeight * wS)).toFixed(2));

  // Classification (Permenkes RI No. 2/2020)
  let hazStatus = 'Normal';
  if (haz < -3.0) {
    hazStatus = 'Sangat Pendek (Severely Stunted)';
  } else if (haz < -2.0) {
    hazStatus = 'Pendek (Stunted)';
  } else if (haz > 3.0) {
    hazStatus = 'Tinggi';
  }

  let wazStatus = 'Berat Badan Normal';
  if (waz < -3.0) {
    wazStatus = 'Berat Badan Sangat Kurang';
  } else if (waz < -2.0) {
    wazStatus = 'Berat Badan Kurang (Underweight)';
  } else if (waz > 1.0) {
    wazStatus = 'Risiko Berat Badan Lebih';
  }

  let whzStatus = 'Gizi Baik (Normal)';
  if (whz < -3.0) {
    whzStatus = 'Gizi Buruk (Severely Wasted)';
  } else if (whz < -2.0) {
    whzStatus = 'Gizi Kurang (Wasted)';
  } else if (whz > 2.0) {
    whzStatus = 'Gizi Lebih (Overweight)';
  }

  // Determine Overall Status & Badge Color
  let overallStatus: 'Normal' | 'Waspada' | 'Stunting' | 'Gizi Buruk' = 'Normal';
  let statusBadgeColor: 'green' | 'yellow' | 'red' | 'blue' = 'green';

  if (haz < -2.0 || waz < -3.0 || whz < -3.0) {
    overallStatus = haz < -2.0 ? 'Stunting' : 'Gizi Buruk';
    statusBadgeColor = 'red';
  } else if (waz < -2.0 || whz < -2.0) {
    overallStatus = 'Waspada';
    statusBadgeColor = 'yellow';
  }

  // Stomach capacity calculation (30 ml per kg of body weight, capped for age)
  const stomachCapacityMl = Math.min(250, Math.max(120, Math.round(weightKg * 25)));
  const proteinNeededG = Number((weightKg * 1.3).toFixed(1)); // 1.3g/kg for toddlers
  const ironNeededMg = ageMonths >= 12 ? 7 : 11;

  // Tailored Clinical Action Recommendations
  const recommendations: string[] = [];

  if (ageMonths >= 12 && ageMonths <= 24) {
    recommendations.push(
      `Fisiologi Lambung Balita 1 Tahun: Kapasitas lambung ${childName} hanya ~${stomachCapacityMl} ml. Hindari memberi semangkuk kuah sayur bening karena memicu kenyang palsu tanpa kalori.`
    );
    recommendations.push(
      'Fokus pada 4 Formula Hewani Padat Energi: 2 sdm peres Daging Sapi Cincang, 1 potong Hati Ayam segar lumat, 2 butir Telur Puyuh, atau suwir Fillet Ikan Kembung.'
    );
  } else if (ageMonths < 12) {
    recommendations.push(
      'Lanjutkan ASI eksklusif/on-demand dipadu MPASI bertekstur lumat kental. Pastikan asupan zat besi hewani seperti hati ayam dan kuning telur tercukupi harian.'
    );
  } else {
    recommendations.push(
      'Terapkan piring makan gizi seimbang dengan Double Protein Hewani lokal (misal: Telur dadar + Ikan kembung goreng bumbu kuning) setiap kali makan.'
    );
  }

  if (haz < -2.0) {
    recommendations.push(
      'INTERVENSI KHUSUS STUNTING: Aktifkan saklar pertumbuhan tulang (mTORC1) dengan menambah densitas kalsium daun kelor lumat dan asam amino esensial hewani setiap hari.'
    );
  }

  if (waz < -2.0) {
    recommendations.push(
      'BOOSTER BERAT BADAN: Berikan santan segar atau minyak kelapa murni (1/2 sdt) pada olahan tim nasi untuk mendongkrak kepadatan kalori tanpa menambah volume lambung.'
    );
  }

  return {
    childName,
    ageMonths,
    gender,
    weightKg,
    heightCm,
    waz,
    haz,
    whz,
    wazStatus,
    hazStatus,
    whzStatus,
    overallStatus,
    statusBadgeColor,
    recommendations,
    stomachCapacityMl,
    proteinNeededG,
    ironNeededMg,
  };
}
