<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClubs } from '../store/clubs'
import ClubArt from '../components/ClubArt.vue'

const router = useRouter()
const { clubs, getClub, identity, setRole, signOut, toast } = useClubs()

const myClub = computed(() => (identity.clubId ? getClub(identity.clubId) : null))

function enterClub(id) { setRole('club', id); toast('已切换到社团身份'); router.push('/club-admin') }
function backToStudent() { signOut(); toast('已切换到学生身份'); router.push('/') }
</script>

<template>
  <div class="view-anim">
    <div class="id-card">
      <div class="role">{{ identity.role === 'club' ? '社团管理员' : '学生' }}</div>
      <div class="who">{{ identity.role === 'club' && myClub ? myClub.name : '逛社团、看活动' }}</div>
    </div>

    <template v-if="identity.role === 'student'">
      <div class="section-title">以社团身份进入</div>
      <div class="pick-list">
        <button v-for="c in clubs" :key="c.id" class="pick" @click="enterClub(c.id)">
          <span class="cover"><ClubArt :type="c.art" :seed="c.id" /></span>
          <span>{{ c.name }}</span>
          <span class="go">›</span>
        </button>
      </div>
      <button class="btn block" style="margin-top: 18px" @click="router.push('/club/new')">创建我的社团</button>
    </template>

    <template v-else>
      <div class="section-title">工作台</div>
      <div class="quick">
        <router-link to="/club-admin">社团工作台</router-link>
        <router-link to="/club-admin/edit">编辑社团主页</router-link>
        <router-link to="/club-admin/activity">发布活动</router-link>
        <router-link to="/club-admin/roster">查看报名名单</router-link>
      </div>
      <button class="btn ghost block" style="margin-top: 18px" @click="backToStudent">切换为学生身份</button>
    </template>
  </div>
</template>
