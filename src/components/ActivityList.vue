<template>
  <div class="bg-white p-4 rounded-lg shadow-md flex flex-col">
    <h2 class="text-lg text-center font-semibold mb-4 text-found-dark">
      Daftar Aktivitas
    </h2>

    <div v-if="activities.length > 0" class="ml-4 mt-2">
      <ActivityItem
        v-for="(item, index) in activities"
        :key="item.id"
        :item="item"
        :index="index"
        :hideActions="hideActions"
        @edit="$emit('edit', item.id)"
        @delete="$emit('delete', item.id)"
      />
    </div>

    <p v-else class="text-gray-500 text-center">
      Belum ada aktivitas disimpan.
    </p>

    <slot />
  </div>
</template>

<script setup>
import ActivityItem from "./ActivityItem.vue";

defineProps({
  activities: Array,
  hideActions: {
    type: Boolean,
    default: false
  }
});
defineEmits(["edit", "delete"]);
</script>
