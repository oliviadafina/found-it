<script setup>
import { ref, onMounted, watch } from "vue";
import maplibregl from "maplibre-gl";

/**
 * - searchLocation: teks lokasi dari ActivityForm (parent) untuk fitur search + pindah peta.
 * - update-location: kirim status/hasil geocoding balik ke parent (MapActivityPage).
 * - ready: memberi tahu parent kalau map sudah selesai load (aman untuk dipanggil resize/add markers).
 */
const props = defineProps({
  searchLocation: String,
});
const emit = defineEmits(["update-location", "ready"]);

/**
 * mapContainer: elemen DOM tempat map dirender.
 * map: instance MapLibre.
 * marker: marker "titik lokasi sekarang" (hasil klik map atau hasil search).
 * markers: kumpulan marker bernomor (aktivitas 1,2,3,...) yang digambar saat ada activities.
 */
const mapContainer = ref(null);
let map;
let marker = null;
const markers = [];

/**
 * lineLayerId: id layer/source untuk garis route di MapLibre.
 * routeReady: flag untuk menandai garis route sudah berhasil digambar.
 *            Dipakai agar focusAllActivities tidak melakukan fitBounds terlalu cepat.
 */
let lineLayerId = "route-line";

// Flag untuk menandai bahwa route (garis) sudah selesai digambar
// Digunakan agar focus tidak dijalankan sebelum route siap
let routeReady = false;

/**
 * Membuat instance map pada saat komponen mounted.
 * - style: pakai MapTiler style.
 * - center/zoom: default tampilan awal.
 * - attributionControl: dimatikan (UI attribution default disembunyikan).
 *
 * Setelah map load:
 * - emit("ready") agar parent bisa melakukan restore (addMarkersAndLine/focus/resize).
 *
 * Click handler:
 * - handleMapClick hanya aktif saat map click enabled (bisa disable saat mode hasil AI).
 */
onMounted(() => {
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: `https://api.maptiler.com/maps/streets/style.json?key=V0XTaLbStTryqr496n5Y`,
    center: [106.827153, -6.17511],
    zoom: 11,
    attributionControl: false,
  });

  // Map sudah selesai load → kabari parent supaya aman panggil resize / add markers
  map.on("load", () => {
    emit("ready"); // PENTING
  });

  // Klik map → ambil koordinat → reverse geocoding → update location ke parent
  map.on("click", handleMapClick);
});

/**
 * Saat user klik map:
 * 1) Pasang marker "current" di titik yang diklik
 * 2) Reverse geocoding ke Nominatim untuk mendapatkan nama lokasi
 * 3) Emit status ke parent:
 *    - loading: sedang cari lokasi
 *    - found: lokasi ketemu (nama + lat/lng)
 *    - error: gagal fetch (fallback)
 *
 * Catatan:
 * - formVisible: guard sederhana supaya klik map tidak aktif saat tidak ada form (mis. mode tertentu).
 */
const handleMapClick = async (e) => {
  const formVisible = document.querySelector("form");
  if (!formVisible) return;

  const { lng, lat } = e.lngLat;

  // Kalau ada marker sebelumnya, hapus dulu supaya hanya 1 current marker
  if (marker) marker.remove();

  // Buat marker baru di posisi klik
  marker = new maplibregl.Marker({ color: "#8BB4E0" })
    .setLngLat([Number(lng), Number(lat)])
    .addTo(map);

  // Beritahu parent: sedang mencari lokasi
  emit("update-location", { status: "loading" });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();
    const name = data.display_name || "Tidak ditemukan";

    // Lokasi ditemukan → kirim detail ke parent (akan mengisi input lokasi di form)
    emit("update-location", {
      status: "found",
      name,
      lat: Number(lat),
      lng: Number(lng),
    });
  } catch (err) {
    console.error(err);
    // Jika gagal reverse geocoding
    emit("update-location", "Gagal mendapatkan lokasi");
    // Supaya focusAllActivities tidak menunggu selamanya, set routeReady true (fallback)
    routeReady = true;
  }
};

/**
 * Dipanggil dari parent untuk mengunci interaksi klik map.
 * Contoh: setelah analisis AI sukses, map click bisa dimatikan.
 */
const disableMapClick = () => map.off("click", handleMapClick);
const enableMapClick = () => map.on("click", handleMapClick);

/**
 * addMarkersAndLine(activities):
 * 1) Bersihkan marker bernomor & route line lama (biar tidak double).
 * 2) Ambil koordinat valid dari activities (lat/lng harus angka).
 * 3) Gambar marker bernomor untuk tiap aktivitas.
 * 4) Request rute ke OpenRouteService (driving-car).
 * 5) Gambar garis LineString di map.
 * 6) Fit bounds agar semua titik terlihat.
 *
 * routeReady:
 * - diset false sebelum proses.
 * - diset true setelah line berhasil digambar.
 */
const addMarkersAndLine = async (activities) => {
  // Guard: tunggu style loaded supaya addLayer/addSource tidak error
  if (!map || !map.isStyleLoaded()) {
    await new Promise((r) => setTimeout(r, 100));
  }

  // Mulai proses route → tandai belum siap
  routeReady = false;

  // Hapus semua marker aktivitas yang lama
  markers.forEach((m) => m.remove());
  markers.length = 0;

  // Hapus marker current (biar fokus ke aktivitas)
  if (marker) {
    marker.remove();
    marker = null;
  }

  // Hapus garis route lama jika ada
  if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
  if (map.getSource(lineLayerId)) map.removeSource(lineLayerId);

  // Ambil koordinat valid dari activities
  const coordinates = activities
    .filter((a) => !isNaN(a.lng) && !isNaN(a.lat))
    .map((a) => [a.lng, a.lat]);

  // Kalau tidak ada koordinat valid, stop
  if (coordinates.length === 0) return;

  /**
   * Marker bernomor per aktivitas
   * Marker pakai custom element HTML agar bisa tampil nomor 1..n
   */
  coordinates.forEach((coord, i) => {
    const el = document.createElement("div");
    el.innerHTML = `
      <div style="
        background-color: transparent;
        color: white;
        font-weight: bold;
        font-size: 13px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid #DC0E0E;
        box-shadow: 0 0 4px rgba(0,0,0,0.25);
        position: relative;
      ">
        <span style="
          background-color: #DC0E0E;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        ">
          ${i + 1}
        </span>
      </div>
    `;

    // Pasang marker & popup detail aktivitas
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(coord)
      .setPopup(
        new maplibregl.Popup({ offset: 15, closeButton: true }).setHTML(`
          <div style="
            font-family: 'Inter', sans-serif;
            padding: 6px 8px;
            max-width: 180px;
          ">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px; color: #333;">
              ${activities[i].location.split(",")[0]}
            </div>
            <div style="font-size: 12px; color: #555; margin-bottom: 4px;">
              ${activities[i].activity}
            </div>
            <div style="font-size: 11px; color: #999;">
              ${activities[i].location.split(",").slice(1, 3).join(", ")}
            </div>
          </div>
        `)
      )
      .addTo(map);

    markers.push(marker);
  });

  /**
   * Request route ke OpenRouteService
   * API ini mengembalikan LineString koordinat rute berdasarkan titik-titik aktivitas.
   * NOTE: key masih hardcoded untuk tugas (sebaiknya pakai env kalau production).
   */
  const apiKey =
    "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImRhOGViNWIzNjVhNzQ1MGU4MTc4NTU4YjY4ODgxNjZjIiwiaCI6Im11cm11cjY0In0=";

  const routeUrl = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;

  try {
    const res = await fetch(routeUrl, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: coordinates,
      }),
    });

    const data = await res.json();
    const routeCoords = data.features[0].geometry.coordinates;

    /**
     * Tambahkan source + layer garis route ke MapLibre
     */
    map.addSource(lineLayerId, {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeCoords,
        },
      },
    });

    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: lineLayerId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#0046FF",
        "line-width": 3,
      },
    });

    // Route sudah selesai digambar → aman untuk focus
    routeReady = true;

    /**
     * Auto fit agar semua titik aktivitas terlihat
     * (ini fit berdasarkan marker points, bukan route line)
     */
    const bounds = new maplibregl.LngLatBounds();
    coordinates.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, {
      padding: 80,
      animate: true,
    });
  } catch (err) {
    console.error("Gagal mengambil rute:", err);
  }
};

/**
 * Membersihkan:
 * - marker aktivitas (markers)
 * - route line layer/source
 * Dipanggil dari parent saat user "Keluar"/reset session.
 */
const resetMap = () => {
  markers.forEach((m) => m.remove());
  markers.length = 0;

  if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
  if (map.getSource(lineLayerId)) map.removeSource(lineLayerId);
};

/**
 * Jika props.searchLocation berubah:
 * - query ke Nominatim (search)
 * - jika ketemu: flyTo ke lokasi & pasang current marker
 * - emit update-location ke parent agar input lokasi terisi dan lat/lng tersimpan
 */
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

      // Geser kamera ke lokasi hasil search
      map.flyTo({ center: [lon, lat], zoom: 15 });

      // Ganti current marker ke lokasi hasil search
      if (marker) marker.remove();
      marker = new maplibregl.Marker({ color: "#8BB4E0" })
        .setLngLat([Number(lon), Number(lat)])
        .addTo(map);

      // Update parent supaya form tahu lokasi + koordinat
      emit("update-location", {
        status: "found",
        name: display_name,
        lat: Number(lat),
        lng: Number(lon),
      });
    } else {
      emit("update-location", { status: "notfound" });
    }
  }
);

/**
 * Digunakan parent untuk memfokuskan map agar semua pin aktivitas terlihat.
 * - Menunggu routeReady agar fitBounds tidak "keduluan" sebelum garis/marker siap.
 * - Jika hanya 1 aktivitas: pakai flyTo zoom dekat.
 * - Jika >1: fitBounds agar semua titik masuk layar.
 */
async function focusAllActivities(activities, padding = 80) {
  if (!activities || activities.length === 0) return;

  // Tunggu hingga route benar-benar siap sebelum melakukan fitBounds
  // Menghindari map fokus terlalu cepat sebelum garis digambar
  for (let i = 0; i < 20; i++) {
    if (routeReady) break;
    await new Promise((res) => setTimeout(res, 50));
  }

  const bounds = new maplibregl.LngLatBounds();

  activities.forEach((a) => {
    if (!isNaN(a.lat) && !isNaN(a.lng)) {
      bounds.extend([a.lng, a.lat]);
    }
  });

  if (bounds.isEmpty()) return;

  // Jika hanya 1 pin, zoom dekat ke titik itu
  if (activities.length === 1) {
    map.flyTo({
      center: bounds.getCenter(),
      zoom: 17,
      animate: true,
    });
    return;
  }

  // Jika banyak pin, fitBounds agar semua terlihat
  map.fitBounds(bounds, { padding, animate: true });
}

/**
 * Fokus ke marker "current" (hasil klik map / hasil search).
 * Cocok untuk tombol crosshair saat belum ada activities.
 */
function focusCurrentMarker(padding = 80) {
  if (!marker) return;

  const { lng, lat } = marker.getLngLat();
  map.easeTo({
    center: [lng, lat],
    zoom: 17,
    padding,
    duration: 700,
  });
}

/**
 * EXPOSE METHODS TO PARENT
 * Parent (MapActivityPage) memanggil method ini via ref MapView:
 * - addMarkersAndLine: gambar pin + garis
 * - resetMap: bersih-bersih
 * - disable/enableMapClick: kunci interaksi klik map
 * - focusAllActivities / focusCurrentMarker: tombol fokus
 * - zoomIn/zoomOut/resize: kontrol map pada desktop
 */
defineExpose({
  addMarkersAndLine,
  resetMap,
  disableMapClick,
  enableMapClick,
  focusAllActivities,
  focusCurrentMarker,
  zoomIn: () => map?.zoomIn(),
  zoomOut: () => map?.zoomOut(),
  resize: () => map?.resize(),
});
</script>

<template>
  <!-- Container map full size (parent mengatur tinggi/lebar via class) -->
  <div ref="mapContainer" class="w-full h-full"></div>
</template>