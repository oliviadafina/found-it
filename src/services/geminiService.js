import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const analyzeActivities = async (activities, lostItem) => {
  if (!API_KEY) {
    throw new Error(
      "API Key Gemini tidak ditemukan. Harap tambahkan VITE_GEMINI_API_KEY di file .env"
    );
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let prompt = `
Nama barang hilang: "${lostItem || "barang tidak diketahui"}".

Berikut daftar lokasi dan aktivitas saya:
${activities
  .map((item, i) => {
    const shortLocation = item.location.split(",")[0];
    return `${i + 1}. ${shortLocation} — aktivitas: ${item.activity}, waktu: ${
      item.startTime
    }–${item.endTime}`;
  })
  .join("\n")}

Tolong analisis SEMUA lokasi di atas dan lakukan hal berikut:

1. Hitung tingkat kemungkinan barang hilang di SETIAP lokasi (risk estimation) berdasarkan:
   - jenis barang (jika diketahui)
   - jenis aktivitas
   - tingkat risiko aktivitas tersebut
   - durasi saya berada di lokasi
   - peluang barang berpindah atau terjatuh

2. URUTKAN semua lokasi dari kemungkinan tertinggi → terendah.

3. Tampilkan hasil dalam format berikut (WAJIB):

Berikut adalah lokasi-lokasi yang paling berpotensi menjadi tempat hilangnya ${
    lostItem || "barang tersebut"
  }, disusun berdasarkan tingkat kemungkinan dari yang paling tinggi hingga paling rendah.

• **Nama Lokasi Peringkat 1**, alasan singkat (ringkas, jelas, konteks risiko).
• **Nama Lokasi Peringkat 2**, alasan singkat.
• **Nama Lokasi Peringkat 3**, alasan singkat.
• **Nama Lokasi Peringkat 4**, alasan singkat.
• ... lanjutkan sampai lokasi terakhir.

PERATURAN FORMAT:
- SELURUH lokasi harus muncul (tanpa ada yang dilewati).
- Gunakan bullet "•" saja.
- Setiap bullet HARUS dimulai di baris baru.
- Dilarang menuliskan dua bullet dalam satu paragraf.
- Setelah setiap bullet, berikan 1 newline kosong.
- Jangan menghapus newline antar bullet.
- Jangan menggabungkan alasan bullet ke bullet lainnya.
- Tebalkan hanya nama lokasi, bukan alasannya.
- Jangan gunakan paragraf panjang; maksimal 3–5 baris per lokasi.
- Jangan sertakan alamat panjang, cukup nama lokasi singkat.
`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error analyzing activities:", error);
    throw error;
  }
};
