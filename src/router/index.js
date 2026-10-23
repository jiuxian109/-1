import { createRouter, createWebHashHistory } from 'vue-router'
import { state } from '../store/clubs'
import Discover from '../views/Discover.vue'
import ClubDetail from '../views/ClubDetail.vue'
import Signup from '../views/Signup.vue'
import Success from '../views/Success.vue'
import Me from '../views/Me.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/club/Dashboard.vue'
import EditProfile from '../views/club/EditProfile.vue'
import NewActivity from '../views/club/NewActivity.vue'
import Roster from '../views/club/Roster.vue'
import Members from '../views/club/Members.vue'
import Settings from '../views/club/Settings.vue'

const routes = [
  { path: '/', name: 'discover', component: Discover, meta: { title: '' } },
  { path: '/club/:id', name: 'club', component: ClubDetail, meta: { title: '社团主页' } },
  { path: '/signup/:id', name: 'signup', component: Signup, meta: { title: '报名', hideTab: true, student: true } },
  { path: '/success/:id', name: 'success', component: Success, meta: { title: '报名成功', hideTab: true, student: true } },
  { path: '/me', name: 'me', component: Me, meta: { title: '我的' } },
  { path: '/login', name: 'login', component: Login, meta: { title: '登录', hideTab: true } },
  { path: '/register', name: 'register', component: Register, meta: { title: '注册', hideTab: true } },
  { path: '/club-admin', name: 'dashboard', component: Dashboard, meta: { title: '工作台', club: true, hideTab: true } },
  { path: '/club-admin/edit', name: 'edit', component: EditProfile, meta: { title: '编辑主页', club: true, hideTab: true } },
  { path: '/club-admin/activity', name: 'activity', component: NewActivity, meta: { title: '发布活动', club: true, hideTab: true } },
  { path: '/club-admin/roster', name: 'roster', component: Roster, meta: { title: '报名名单', club: true, hideTab: true } },
  { path: '/club-admin/members', name: 'members', component: Members, meta: { title: '成员管理', club: true, hideTab: true } },
  { path: '/club-admin/settings', name: 'settings', component: Settings, meta: { title: '社团设置', club: true, hideTab: true } }
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach((to) => {
  const user = state.user
  // 学生端（报名相关）：需学生身份登录
  if (to.meta.student && (!user || user.role !== 'student')) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // 社团端：需社团身份登录
  if (to.meta.club && (!user || user.role !== 'club')) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
