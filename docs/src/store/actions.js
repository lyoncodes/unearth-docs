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
  // fetches rules, calls mutation to assign fetched rules to rules array in state
  async fetchRules ({ commit }) {
    const rule = firebase.rulesCollection
    const snapshot = await rule.get()
    const rulePayload = []
    snapshot.forEach((el) => {
      const rule = el.data()
      rule.id = el.id
      rulePayload.push(rule)
    })
    commit('setRuleCards', rulePayload)
  },
  // get() rulesCollection
  async fetchRuleCollection () {
    const rule = firebase.rulesCollection
    const snapshot = await rule.get()
    return snapshot.docs
  },
  // map response for id, return found value
  async mapRes ({ dispatch }, data) {
    return new Promise((resolve, reject) => {
      dispatch('fetchRuleCollection').then((res) => {
        res.map((el) => {
          return el.id === data.id ? resolve(firebase.rulesCollection.doc(data.id)) : null
        })
      })
    })
  },
  async actionThis ({ commit, dispatch }, data) {
    dispatch('mapRes', data).then(async (res) => {
      if (data.payload === 'addRule') {
        await firebase.rulesCollection.add({
          locked: data.locked,
          type: data.type,
          title: data.title,
          text: data.text,
          active: data.active,
          updating: data.updating,
          annotations: data.annotations,
          links: data.links
        })
        dispatch('fetchRules')
      }
      if (data.payload === 'deleteRule') {
        res.delete()
      }
      if (data.payload === 'toggleShow') {
        if (data.active) {
          await res.update({
            active: true
          })
        } else {
          await res.update({
            active: false
          })
        }
      }
      if (data.payload === 'toggleUpdateFields') {
        res.update({
          updating: !data.updating
        })
      }
      if (data.payload === 'updateRule') {
        res.update({
          title: data.title,
          text: data.text,
          updating: !data.updating
        })
      }
      commit('updateState', data)
    })
  },
  // add annotation to annotation array of card object in db and call mutation to annotate card in state
  async annotateCard ({ commit, dispatch }, card) {
    dispatch('mapRes', card).then((res) => {
      res.update({
        annotations: firestore.FieldValue.arrayUnion(card)
      })
    })
    card.payload = 'addAnnotation'
    commit('updateState', card)
  },
  // delete annotation to annotation array of card object in db and call mutation to remove annotation in state
  async deleteAnnotation ({ commit, dispatch }, annotation) {
    dispatch('mapRes', annotation).then((res) => {
      res.update({
        annotations: firestore.FieldValue.arrayRemove(annotation)
      })
    })
    annotation.payload = 'deleteAnnotation'
    commit('updateState', annotation)
  },
  async attachLink ({ commit, dispatch }, link) {
    dispatch('mapRes', link).then(async (res) => {
      await res.update({
        links: firestore.FieldValue.arrayUnion(link)
      })
    })
    link.payload = 'addLink'
    commit('updateState', link)
  },
  // filters by type
  filterAction: ({ commit }, type) => {
    commit('filterRules', type)
  }
}
