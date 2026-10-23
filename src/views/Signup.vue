<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubs } from '../store/clubs'

const route = useRoute()
const router = useRouter()
const { getClub, addSignup, track } = useClubs()

const club = computed(() => getClub(route.params.id))
const form = reactive({ name: '', sid: '', phone: '', wechat: '', why: '' })
const agree = ref(false)
const err = ref('')

function submit() {
  if (!club.value) return
  if (!form.name || !form.sid || !form.phone || !form.wechat) { err.value = '请填写所有必填项'; return }
  if (!/^1\d{10}$/.test(form.phone)) { err.value = '请输入 11 位手机号'; return }
  if (!agree.value) { err.value = '请先勾选同意'; return }
  const idx = addSignup(club.value.id, { ...form })
  track('submit_signup', club.value.id)
  router.push('/success/' + club.value.id + '?row=' + idx)
}
</script>

<template>
  <div v-if="club" class="view-anim">
    <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px">加入 {{ club.name }}</h2>
    <p style="font-size: 13px; color: var(--muted); margin-bottom: 18px">提交后，你的名字会写入社团花名册。</p>

    <form @submit.prevent="submit">
      <div class="field">
        <label for="f-name">姓名</label>
        <input id="f-name" v-model="form.name" placeholder="你的真实姓名" />
      </div>
      <div class="field">
        <label for="f-sid">学号</label>
        <input id="f-sid" v-model="form.sid" placeholder="如 2025010101" />
      </div>
      <div class="field">
        <label for="f-phone">手机号</label>
        <input id="f-phone" v-model="form.phone" type="tel" maxlength="11" placeholder="11 位手机号" />
      </div>
      <div class="field">
        <label for="f-wechat">微信号</label>
        <input id="f-wechat" v-model="form.wechat" placeholder="方便社团联系你" />
      </div>
      <div class="field">
        <label for="f-why">一句话介绍自己</label>
        <textarea id="f-why" v-model="form.why" placeholder="为什么想加入？（选填）"></textarea>
      </div>

      <label class="check">
        <input v-model="agree" type="checkbox" /> 我同意社团通过手机号与我联系
      </label>

      <p v-if="err" class="err">{{ err }}</p>
      <button type="submit" class="btn block">提交报名</button>
    </form>
  </div>
  <div v-else class="empty">社团不存在或已下架。</div>
</template>
