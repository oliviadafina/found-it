<template>
  <header
    class="fixed top-0 left-0 right-0 z-50 bg-found-blue h-16 flex justify-center text-white shadow header-safe"
  >
    <div class="w-full max-w-6xl flex items-center justify-between px-6">
      <img src="/foundit-logo.png" alt="Logo" class="w-24 object-contain" />

      <button
        @click="$emit('reset-activities')"
        class="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold"
      >
        <i class="fa-solid fa-right-from-bracket"></i>
        <span>Keluar</span>
      </button>
    </div>
  </header>
</template>

<script setup>
defineEmits(["reset-activities"]);
</script>
