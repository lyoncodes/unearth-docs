import * as firebase from '../../firebase'
import router from '../router/index'
import { firestore } from 'firebase'

export default {
  // logs user in
  async login ({ dispatch }, form) {
    const { user } = await firebase.auth.signInWithEmailAndPassword(form.email, form.password)
    dispatch('fetchUserProfile', user)
    dispatch('fetchRules')
  },
  // logs user out and resets current user obj
  async logout ({ commit }) {
    await firebase.auth.signOut()
    commit('setUserProfile', {})
    router.push('/login')
  },
  // signs user up and saves doc in firebase with set() method
  async signUp ({ dispatch }, form) {
    const { user } = await firebase.auth.createUserWithEmailAndPassword(form.email, form.password)
    await firebase.usersCollection.doc(user.uid).set({
      email: form.email,
      password: form.password
    })
    dispatch('fetchUserProfile', user)
  },
  // get() for user profile via user.uid
  async fetchUserProfile ({ commit }, user) {
    const userProfile = await firebase.usersCollection.doc(user.uid).get()
    commit('setUserProfile', userProfile.data())
    if (router.currentRoute.path === '/login') {
      router.push('/')
    }
  },
  // fetches rules, sets cards array to fetched rules
  async fetchRules ({ commit }) {
    const rule = firebase.rulesCollection
    const snapshot = await rule.get()
    const ruleData = []
    snapshot.forEach(el => ruleData.push(el.data()))
    commit('setRuleCards', ruleData)
  },
  // get() rulesCollection
  async fetchRuleCollection () {
    const rule = firebase.rulesCollection
    const snapshot = await rule.get()
    return snapshot.docs
  },
  // add card from add card form
  async submitRule ({ commit }, card) {
    commit('addRule', card)
  },
  // updates card in firebase to active
  async appendCard ({ commit, dispatch }, card) {
    dispatch('fetchRuleCollection').then((res) => {
      const ruleId = res[card.idx - 1].id
      firebase.rulesCollection.doc(ruleId).update({
        active: true
      })
    })
    commit('activateRule', card)
  },
  // update/clear form fields
  async showUpdateField ({ commit, dispatch }, card) {
    dispatch('fetchRuleCollection').then((res) => {
      const ruleId = res[card.idx].id
      firebase.rulesCollection.doc(ruleId).update({
        updating: !card.updating
      })
    })
    commit('updateCardField', card)
  },
  // update card in Cards and pinnedcards arrays
  async updateCard ({ commit, dispatch }, card) {
    dispatch('fetchRuleCollection').then((res) => {
      const ruleId = res[card.idx].id
      firebase.rulesCollection.doc(ruleId).update({
        title: card.title,
        text: card.text,
        updating: !card.updating
      })
    })
    commit('replaceCardRule', card)
  },
  // annotate
  async annotateCard ({ commit }, card) {
    const rules = firebase.rulesCollection
    const ruleSet = await rules.get()
    const ruleId = ruleSet.docs[card.idx].id
    const ruleRef = rules.doc(ruleId)
    await ruleRef.update({
      annotations: firestore.FieldValue.arrayUnion(card)
    })
    commit('submitAnnotation', card)
  },
  // hides pin
  async hidePin ({ commit }, card) {
    console.log(card)
    const rules = firebase.rulesCollection
    const ruleSet = await rules.get()
    const ruleId = ruleSet.docs[card.idx - 1].id
    await rules.doc(ruleId).update({
      active: false
    })
    commit('removeCard', card)
  },
  // filters by type
  filterAction: ({ commit }, type) => {
    commit('filterRules', type)
  }
}
