<script setup>
import { ref, onMounted, watch } from "vue";
import maplibregl from "maplibre-gl";

const props = defineProps({
  searchLocation: String,
});
const emit = defineEmits(["update-location"]);

const mapContainer = ref(null);
let map;
let marker = null;

onMounted(() => {
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: `https://api.maptiler.com/maps/streets/style.json?key=V0XTaLbStTryqr496n5Y`,
    center: [106.827153, -6.175110], // Jakarta
    zoom: 11,
  });

  map.on("click", async (e) => {
    const { lng, lat } = e.lngLat;

    if (marker) marker.remove();

    marker = new maplibregl.Marker({ color: "red" })
      .setLngLat([lng, lat])
      .addTo(map);

    emit("update-location", "Mencari lokasi...");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const name = data.display_name || "Tidak ditemukan";
      emit("update-location", name);
    } catch (err) {
      console.error(err);
      emit("update-location", "Gagal mendapatkan lokasi");
    }
  });
});

watch(
  () => props.searchLocation,
  async (newLocation) => {
    if (!newLocation) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        newLocation
      )}`
    );
    const data = await res.json();

    if (data.length > 0) {
      const { lon, lat, display_name } = data[0];
      map.flyTo({ center: [lon, lat], zoom: 15 });

      if (marker) marker.remove();
      marker = new maplibregl.Marker({ color: "red" })
        .setLngLat([lon, lat])
        .addTo(map);

      emit("update-location", display_name);
    }
  }
);
</script>

<template>
  <div ref="mapContainer" class="w-full h-full"></div>
</template>
