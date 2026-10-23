<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClubs } from '../../store/clubs'
import ClubArt from '../../components/ClubArt.vue'

const { state, fetchClub, fetchStats } = useClubs()
const loading = ref(true)
const err = ref('')
const stats = ref({ impression: 0, view_club: 0, click_signup: 0, submit_signup: 0 })

onMounted(async () => {
  try {
    await fetchClub(state.user.clubId)
    stats.value = await fetchStats(state.user.clubId)
  } catch (e) {
    err.value = e.message
  } finally {
    loading.value = false
  }
})

const club = computed(() => state.club)
</script>

<template>
  <div class="view-anim">
    <p v-if="loading" class="empty">正在加载工作台…</p>
    <p v-else-if="err" class="empty">{{ err }}</p>
    <template v-else-if="club">
      <div class="dash-hero">
        <div class="cover"><ClubArt :type="club.art" :seed="club.id" /></div>
        <div>
          <h2>{{ club.name }}</h2>
          <div class="dash-cat">{{ club.category }}</div>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat"><b>{{ club.rosterCount }}</b><span>报名人数</span></div>
        <div class="stat"><b>{{ club.memberCount }}</b><span>在册成员</span></div>
        <div class="stat"><b>{{ club.activities.length }}</b><span>发布活动</span></div>
        <div class="stat"><b>{{ stats.view_club }}</b><span>主页浏览</span></div>
      </div>

      <div class="id-card" style="font-size: 13px; color: var(--ink-soft)">
        报名漏斗：进主页 {{ stats.view_club }} · 点报名 {{ stats.click_signup }} · 提交 {{ stats.submit_signup }}
      </div>

      <!-- Q2 回执质量面板：回执率 ≥80% 、处理中位 ≤48h -->
      <div class="receipt">
        <div class="rc-title">回执质量</div>
        <div class="rc-row"><span>报名总数</span><b>{{ stats.receipt?.total ?? 0 }}</b></div>
        <div class="rc-row"><span>已处理</span><b>{{ stats.receipt?.processed ?? 0 }}</b></div>
        <div class="rc-row">
          <span>回执率（目标 ≥80%）</span>
          <b :class="(stats.receipt?.rate ?? 0) >= 80 ? 'ok' : 'no'">{{ stats.receipt?.rate ?? 0 }}%</b>
        </div>
        <div class="rc-row">
          <span>处理中位时长（目标 ≤48h）</span>
          <b :class="stats.receipt?.medianHours !== null && stats.receipt?.medianHours <= 48 ? 'ok' : 'no'">
            {{ stats.receipt?.medianHours === null ? '—' : stats.receipt?.medianHours + 'h' }}
          </b>
        </div>
      </div>

      <div class="quick">
        <router-link to="/club-admin/edit">编辑社团主页</router-link>
        <router-link to="/club-admin/activity">发布活动</router-link>
        <router-link to="/club-admin/roster" class="todo-link">
          处理报名待办<i v-if="club.pendingCount > 0" class="red-dot">{{ club.pendingCount }}</i>
        </router-link>
        <router-link to="/club-admin/members">成员管理（{{ club.memberCount }}）</router-link>
        <router-link to="/club-admin/settings">社团设置</router-link>
      </div>
    </template>
    <p v-else class="empty">还没有绑定社团。</p>
  </div>
</template>

<style scoped>
.receipt { background: var(--surface); border-radius: var(--radius); padding: 14px 16px; margin: 14px 0; }
.rc-title { font-weight: 800; font-size: 15px; margin-bottom: 8px; }
.rc-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: var(--ink-soft); }
.rc-row b.ok { color: var(--good); }
.rc-row b.no { color: var(--end); }
</style>
