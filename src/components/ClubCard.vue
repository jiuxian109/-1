<script setup>
import ClubArt from './ClubArt.vue'
import StatusTag from './StatusTag.vue'

const props = defineProps({ club: { type: Object, required: true } })

function thumbs(act) {
  const n = Math.min(act.photos || 1, 3)
  return Array.from({ length: n }, (_, i) => ({ type: act.type, seed: (act.seed || 'x') + i }))
}
</script>

<template>
  <router-link :to="'/club/' + club.id" class="club-card">
    <div class="cover"><ClubArt :type="club.art" :seed="club.id" /></div>
    <div class="club-card-body">
      <div class="club-card-head">
        <h3>{{ club.name }}</h3>
        <span class="cat">{{ club.category }}</span>
      </div>
      <p class="club-card-intro">{{ club.intro }}</p>
      <div class="recent">
        <div class="recent-photos">
          <template v-for="act in club.activities.slice(0, 1)" :key="act.id">
            <div v-for="t in thumbs(act)" :key="t.seed" class="ph"><ClubArt :type="t.type" :seed="t.seed" /></div>
          </template>
        </div>
        <StatusTag :status="club.status" />
      </div>
    </div>
  </router-link>
</template>
