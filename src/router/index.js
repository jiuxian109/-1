import { createRouter, createWebHashHistory } from 'vue-router'
import { state } from '../store/clubs'
import Discover from '../views/Discover.vue'
import ClubDetail from '../views/ClubDetail.vue'
import Signup from '../views/Signup.vue'
import Success from '../views/Success.vue'
import Me from '../views/Me.vue'
import Dashboard from '../views/club/Dashboard.vue'
import EditProfile from '../views/club/EditProfile.vue'
import NewActivity from '../views/club/NewActivity.vue'
import Roster from '../views/club/Roster.vue'
import NewClub from '../views/club/NewClub.vue'

const routes = [
  { path: '/', name: 'discover', component: Discover, meta: { title: '' } },
  { path: '/club/:id', name: 'club', component: ClubDetail, meta: { title: '社团主页' } },
  { path: '/signup/:id', name: 'signup', component: Signup, meta: { title: '报名', hideTab: true } },
  { path: '/success/:id', name: 'success', component: Success, meta: { title: '报名成功', hideTab: true } },
  { path: '/me', name: 'me', component: Me, meta: { title: '我的' } },
  { path: '/club/new', name: 'newClub', component: NewClub, meta: { title: '创建社团', hideTab: true } },
  { path: '/club-admin', name: 'dashboard', component: Dashboard, meta: { title: '工作台', club: true, hideTab: true } },
  { path: '/club-admin/edit', name: 'edit', component: EditProfile, meta: { title: '编辑主页', club: true, hideTab: true } },
  { path: '/club-admin/activity', name: 'activity', component: NewActivity, meta: { title: '发布活动', club: true, hideTab: true } },
  { path: '/club-admin/roster', name: 'roster', component: Roster, meta: { title: '报名名单', club: true, hideTab: true } }
]

const router = createRouter({ history: createWebHashHistory(), routes })

// 社团端路由守卫：非社团身份跳转到「我的」
router.beforeEach((to) => {
  if (to.meta.club && state.identity.role !== 'club') {
    return { name: 'me' }
  }
})

export default router
