<script setup>
import ClubArt from './ClubArt.vue'
import StatusTag from './StatusTag.vue'

const props = defineProps({ club: { type: Object, required: true } })

function thumbs(act) {
  return Array.isArray(act.photos) ? act.photos.filter(Boolean).slice(0, 3) : []
}

const firstAct = () => (props.club.activities || [])[0] || null
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
          <template v-if="firstAct()">
            <div v-for="(src, i) in thumbs(firstAct())" :key="src + i" class="ph">
              <img :src="src" alt="" loading="lazy" />
            </div>
            <div v-if="!thumbs(firstAct()).length" class="ph">
              <ClubArt :type="club.art" :seed="firstAct().id" />
            </div>
          </template>
        </div>
        <StatusTag :status="club.status" />
      </div>
    </div>
  </router-link>
</template>
