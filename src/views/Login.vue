<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClubs } from '../store/clubs'

const router = useRouter()
const route = useRoute()
const { login, toast } = useClubs()

const form = reactive({ phone: '', password: '' })
const err = ref('')
const busy = ref(false)

async function submit() {
  if (!/^1\d{10}$/.test(form.phone)) { err.value = '请输入 11 位手机号'; return }
  if (!form.password) { err.value = '请输入密码'; return }
  busy.value = true
  err.value = ''
  try {
    const user = await login(form.phone, form.password)
    toast(user.role === 'club' ? '欢迎回来，社团管理员' : '欢迎回来')
    const target = route.query.redirect || (user.role === 'club' ? '/club-admin' : '/')
    router.replace(target)
  } catch (e) {
    err.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="view-anim">
    <h2 class="auth-title">登录百团</h2>
    <p class="auth-sub">学生与社团，一个账号逛社团。</p>

    <form @submit.prevent="submit">
      <div class="field">
        <label for="l-phone">手机号</label>
        <input id="l-phone" v-model="form.phone" type="tel" maxlength="11" placeholder="11 位手机号" />
      </div>
      <div class="field">
        <label for="l-pw">密码</label>
        <input id="l-pw" v-model="form.password" type="password" placeholder="至少 6 位" />
      </div>

      <p v-if="err" class="err">{{ err }}</p>
      <button type="submit" class="btn block" :disabled="busy">{{ busy ? '登录中…' : '登录' }}</button>
    </form>

    <p class="auth-alt">还没有账号？<router-link to="/register" class="link">去注册</router-link></p>
  </div>
</template>
