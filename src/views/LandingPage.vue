<template>
  <div class="relative flex items-center justify-center min-h-screen bg-cover bg-center" style="background-image: url('/foundit-bg4.jpg');">
    <div class="absolute inset-0 bg-black bg-opacity-40"></div>
    <div class="relative z-10 text-center text-white p-8 rounded-3xl bg-found-dark bg-opacity-30 backdrop-blur-sm">
      <h1 class="text-6xl font-extrabold mb-6">Found It!</h1>
      <p class="text-lg text-gray-200 mb-10 max-w-2xl mx-auto">
        Membantu kamu menemukan barang yang hilang dengan menelusuri kembali
        lokasi yang kamu kunjungi.
      </p>
      <form @submit.prevent="goToMap" class="flex justify-center items-center bg-white rounded-full overflow-hidden shadow-lg max-w-md mx-auto">
        <input type="text" v-model="lostItem" placeholder="Barang apa yang hilang?" class="flex-grow px-4 py-3 text-gray-800 focus:outline-none"/>
        <button type="submit" class="border border-found-blue text-found-blue hover:bg-found-blue hover:text-white px-5 py-3 flex items-center justify-center transition">
          <i class="fa-solid fa-magnifying-glass mr-2"></i> Cari
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const lostItem = ref("");
const router = useRouter();

const goToMap = () => {
  if (lostItem.value.trim()) {
    router.push("/map");
  } else {
    alert("Masukkan nama barang yang hilang!");
  }
};
</script>
