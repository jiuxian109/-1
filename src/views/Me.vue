<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClubs } from '../store/clubs'

const router = useRouter()
const { state, logout, toast, MEMBER_STATUS, fetchMySignups } = useClubs()

const user = computed(() => state.user)
const memberships = computed(() => (state.user && state.user.memberships) || [])
const pendingSignups = computed(() =>
  (state.mySignups || []).filter((s) => s.status === 'pending').length
)

onMounted(() => {
  if (state.user && state.user.role === 'student') fetchMySignups().catch(() => {})
})

function signOut() {
  logout()
  toast('已退出登录')
  router.push('/')
}
</script>

<template>
  <div class="view-anim">
    <!-- 未登录 -->
    <template v-if="!user">
      <div class="id-card" style="text-align: center">
        <div class="who" style="margin-bottom: 4px">欢迎来到百团</div>
        <div class="role">登录后报名社团、维护社团主页。</div>
      </div>
      <router-link to="/login" class="btn block">登录</router-link>
      <router-link to="/register" class="btn ghost block" style="margin-top: 10px">注册账号</router-link>
    </template>

    <!-- 学生 -->
    <template v-else-if="user.role === 'student'">
      <div class="id-card">
        <div class="role">学生</div>
        <div class="who">{{ user.name || ('手机尾号 ' + user.phone.slice(-4)) }}</div>
        <div class="role" style="margin-top: 4px">{{ user.phone }}</div>
      </div>
      <div class="section-title" v-if="memberships.length">我的社团身份</div>
      <div v-if="memberships.length" class="mem-list">
        <router-link v-for="m in memberships" :key="m.clubId" :to="'/club/' + m.clubId" class="mem-item">
          <span class="mem-club">{{ m.clubName }}</span>
          <span class="mem-role">{{ m.role }}<template v-if="m.dept"> · {{ m.dept }}</template></span>
          <span class="m-tag" :class="'st-' + m.status">{{ MEMBER_STATUS[m.status] }}</span>
        </router-link>
      </div>
      <div class="section-title">我的报名</div>
      <div class="quick">
        <router-link to="/my-signups">
          查看报名与处理进度
          <span v-if="pendingSignups" class="red-dot">{{ pendingSignups }}</span>
        </router-link>
      </div>
      <div class="section-title">私信</div>
      <div class="quick">
        <router-link to="/messages">与社团的私信</router-link>
      </div>
      <div class="section-title">逛逛社团</div>
      <div class="quick">
        <router-link to="/">发现社团</router-link>
      </div>
      <button class="btn ghost block" style="margin-top: 18px" @click="signOut">退出登录</button>
    </template>

    <!-- 社团 -->
    <template v-else>
      <div class="id-card">
        <div class="role">社团管理员</div>
        <div class="who">{{ user.clubName || '我的社团' }}</div>
        <div class="role" style="margin-top: 4px">{{ user.phone }}</div>
      </div>
      <div class="section-title">工作台</div>
      <div class="quick">
        <router-link to="/club-admin">社团工作台</router-link>
        <router-link to="/club-admin/edit">编辑社团主页</router-link>
        <router-link to="/club-admin/activity">发布活动</router-link>
        <router-link to="/club-admin/roster">查看报名名单</router-link>
        <router-link to="/messages">站内私信</router-link>
        <router-link to="/club-admin/members">成员管理</router-link>
        <router-link to="/club-admin/settings">社团设置</router-link>
      </div>
      <button class="btn ghost block" style="margin-top: 18px" @click="signOut">退出登录</button>
    </template>
  </div>
</template>
