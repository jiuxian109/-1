<script setup>
import { computed } from 'vue'
import { useClubs } from '../../store/clubs'
import ClubArt from '../../components/ClubArt.vue'

const { identity, getClub, funnel } = useClubs()
const club = computed(() => getClub(identity.clubId))
const f = computed(() => funnel(identity.clubId))
</script>

<template>
  <div v-if="club" class="view-anim">
    <div class="dash-hero">
      <div class="cover"><ClubArt :type="club.art" :seed="club.id" /></div>
      <div>
        <h2>{{ club.name }}</h2>
        <div class="dash-cat">{{ club.category }}</div>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat"><b>{{ club.roster.length }}</b><span>报名人数</span></div>
      <div class="stat"><b>{{ club.activities.length }}</b><span>发布活动</span></div>
      <div class="stat"><b>{{ f.view_club }}</b><span>主页浏览</span></div>
    </div>

    <div class="id-card" style="font-size: 13px; color: var(--ink-soft)">
      报名漏斗：进主页 {{ f.view_club }} · 点报名 {{ f.click_signup }} · 提交 {{ f.submit_signup }}
    </div>

    <div class="quick">
      <router-link to="/club-admin/edit">编辑社团主页</router-link>
      <router-link to="/club-admin/activity">发布活动</router-link>
      <router-link to="/club-admin/roster">查看报名名单（{{ club.roster.length }}）</router-link>
    </div>
  </div>
  <div v-else class="empty">还没有绑定社团，请先在「我的」选择社团身份。</div>
</template>
