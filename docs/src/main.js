import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { auth } from '../firebase'
import * as firebase from '../firebase'

Vue.config.productionTip = false

let app

firebase.postsCollection.orderBy('createdOn', 'desc').onSnapshot(snapshot => {
  const posts = []
  snapshot.forEach(async (doc) => {
    const post = doc.data()
    post.id = doc.id

    posts.push(post)
    store.commit('updatePosts', posts)
  })
})

// check app state for current user on page refresh
auth.onAuthStateChanged(user => {
  if (!app) {
    app = new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount('#app')
  }
  if (user) {
    store.dispatch('fetchUserProfile', user)
    // trigger welcome animation here:
  }
  if (!store.state.imgStore.length) {
    store.dispatch('fetchImageAssets')
  }
})
