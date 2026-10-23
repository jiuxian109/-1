<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClubs } from '../store/clubs'
import { compressImage } from '../lib/image'

const router = useRouter()
const route = useRoute()
const { register, toast } = useClubs()

const role = ref('student')
const form = reactive({ phone: '', password: '', password2: '', name: '', clubName: '' })
const avatar = ref('') // dataURL 预览
const err = ref('')
const busy = ref(false)
const avatarInput = ref(null)

function pickAvatar() { avatarInput.value && avatarInput.value.click() }
async function onAvatarFile(e) {
  const f = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!f) return
  if (!/^image\//.test(f.type)) { err.value = '头像需为图片文件'; return }
  if (f.size > 4 * 1024 * 1024) { err.value = '头像需小于 4MB'; return }
  avatar.value = (await compressImage(f, 320, 0.85)) || ''
}

async function submit() {
  if (!/^1\d{10}$/.test(form.phone)) { err.value = '请输入 11 位手机号'; return }
  if (form.password.length < 6) { err.value = '密码至少 6 位'; return }
  if (form.password !== form.password2) { err.value = '两次输入的密码不一致'; return }
  if (role.value === 'student' && !form.name.trim()) { err.value = '请填写姓名'; return }
  if (role.value === 'club' && !form.clubName.trim()) { err.value = '请填写社团名称'; return }
  busy.value = true
  err.value = ''
  try {
    const payload = { role: role.value, phone: form.phone, password: form.password }
    if (role.value === 'student') payload.name = form.name.trim()
    else payload.clubName = form.clubName.trim()
    if (avatar.value) payload.avatar = avatar.value
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
      <div class="field">
        <label for="r-pw2">确认密码</label>
        <input id="r-pw2" v-model="form.password2" type="password" placeholder="再次输入密码" />
      </div>
      <div v-if="role === 'student'" class="field">
        <label for="r-name">姓名（必填）</label>
        <input id="r-name" v-model="form.name" placeholder="你的真实姓名" />
      </div>
      <div v-if="role === 'club'" class="field">
        <label for="r-club">社团名称</label>
        <input id="r-club" v-model="form.clubName" placeholder="注册后即为你的社团主页名称" />
      </div>

      <div v-if="role === 'student'" class="field">
        <label>头像（选填）</label>
        <div class="ava-row">
          <button type="button" class="ava-box" @click="pickAvatar" :aria-label="avatar ? '更换头像' : '上传头像'">
            <img v-if="avatar" :src="avatar" alt="" />
            <span v-else>＋</span>
          </button>
          <input ref="avatarInput" type="file" accept="image/*" style="display: none" @change="onAvatarFile" />
          <div class="ava-note">
            <div>选择一张照片作为头像</div>
            <div class="sub">JPG / PNG，小于 4MB</div>
            <button v-if="avatar" type="button" class="link-btn" @click="avatar = ''">移除</button>
          </div>
        </div>
      </div>

      <p v-if="err" class="err">{{ err }}</p>
      <button type="submit" class="btn block" :disabled="busy">{{ busy ? '注册中…' : '注册并登录' }}</button>
    </form>

    <p class="auth-alt">已有账号？<router-link to="/login" class="link">去登录</router-link></p>
  </div>
</template>