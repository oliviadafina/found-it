<template>
  <div
    class="mt-4 bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded text-gray-800"
  >
    <h3 class="font-semibold text-found-dark text-center mb-2">
      Hasil Analisis AI
    </h3>

    <div v-html="aiResultHtml"></div>

    <button
      @click="$emit('back')"
      class="mt-3 border border-[#DC0E0E] text-[#DC0E0E] hover:bg-[#DC0E0E] hover:text-white py-2 rounded flex items-center justify-center w-full transition"
    >
      Kembali
    </button>
  </div>
</template>

<script setup>
defineProps({
  aiResultHtml: String,
});
defineEmits(["back"]);
</script>
