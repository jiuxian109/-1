<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClubs } from '../store/clubs'

const router = useRouter()
const route = useRoute()
const { register, toast } = useClubs()

const role = ref('student')
const form = reactive({ phone: '', password: '', name: '', clubName: '' })
const err = ref('')
const busy = ref(false)

async function submit() {
  if (!/^1\d{10}$/.test(form.phone)) { err.value = '请输入 11 位手机号'; return }
  if (form.password.length < 6) { err.value = '密码至少 6 位'; return }
  if (role.value === 'club' && !form.clubName.trim()) { err.value = '请填写社团名称'; return }
  busy.value = true
  err.value = ''
  try {
    const payload = { role: role.value, phone: form.phone, password: form.password }
    if (role.value === 'student') payload.name = form.name
    else payload.clubName = form.clubName.trim()
    const user = await register(payload)
    toast(user.role === 'club' ? '社团已创建并登录' : '注册成功')
    const target = user.role === 'club' ? '/club-admin' : (route.query.redirect || '/')
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
    <h2 class="auth-title">注册账号</h2>
    <p class="auth-sub">选择身份，一个手机号对应一个账号。</p>

    <div class="role-tabs">
      <button type="button" :class="{ on: role === 'student' }" @click="role = 'student'">我是学生</button>
      <button type="button" :class="{ on: role === 'club' }" @click="role = 'club'">我是社团</button>
    </div>

    <form @submit.prevent="submit">
      <div class="field">
        <label for="r-phone">手机号</label>
        <input id="r-phone" v-model="form.phone" type="tel" maxlength="11" placeholder="11 位手机号" />
      </div>
      <div class="field">
        <label for="r-pw">密码</label>
        <input id="r-pw" v-model="form.password" type="password" placeholder="至少 6 位" />
      </div>
      <div v-if="role === 'student'" class="field">
        <label for="r-name">姓名</label>
        <input id="r-name" v-model="form.name" placeholder="你的真实姓名（选填）" />
      </div>
      <div v-if="role === 'club'" class="field">
        <label for="r-club">社团名称</label>
        <input id="r-club" v-model="form.clubName" placeholder="注册后即为你的社团主页名称" />
      </div>

      <p v-if="err" class="err">{{ err }}</p>
      <button type="submit" class="btn block" :disabled="busy">{{ busy ? '注册中…' : '注册并登录' }}</button>
    </form>

    <p class="auth-alt">已有账号？<router-link to="/login" class="link">去登录</router-link></p>
  </div>
</template>
