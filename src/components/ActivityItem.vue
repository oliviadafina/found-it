<template>
  <div class="flex gap-5 mb-4 relative">
    <div class="flex flex-col items-center">
      <div
        class="w-8 h-8 bg-found-blue text-white rounded-full flex items-center justify-center font-semibold shadow"
      >
        {{ index + 1 }}
      </div>
      <div class="w-[2px] bg-gray-300 flex-1 mt-1"></div>
    </div>

    <div class="flex-1 pr-4">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-gray-500 text-sm font-medium">
            {{ item.startTime }} - {{ item.endTime }}
          </p>
          <p class="text-found-dark font-semibold leading-tight">
            {{ item.location }}
          </p>
          <p class="text-gray-500 text-sm">
            {{ item.activity }}
          </p>
        </div>

        <div v-if="!hideActions" class="flex gap-3 text-lg">
          <button
            @click="$emit('edit', item.id)"
            class="text-found-yellow hover:text-found-yellow-700 transition"
          >
            <i class="fa-regular fa-pen-to-square"></i>
          </button>

          <button
            @click="$emit('delete', item.id)"
            class="text-red-500 hover:text-red-700 transition"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: Object,
  index: Number,
  hideActions: Boolean,
});
defineEmits(["edit", "delete"]);
</script>