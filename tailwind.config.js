/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-utama': '#F8F9FA',      // 60% - Latar belakang
        'biru-azure': '#007FFF',    // 30% - Identitas utama
        'kuning-emas': '#F59B0B',   // 10% - Aksen & Tombol
        'teks-arang': '#2C3E50',    // Warna Teks
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}