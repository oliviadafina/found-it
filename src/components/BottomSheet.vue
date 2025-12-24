<template>
  <div
    class="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-lg
           transition-transform duration-300"
    :class="open ? 'translate-y-0' : 'translate-y-[85%]'"
  >
    <!-- HANDLE -->
    <div
      class="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3"
      @click="$emit('toggle')"
    />

    <!-- CONTENT -->
    <div class="max-h-[75vh] overflow-y-auto px-4 pb-6">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  open: Boolean,
});
defineEmits(["toggle"]);
</script>