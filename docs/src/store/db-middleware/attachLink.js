import { firestore } from 'firebase'
async function attachLink ({ commit, dispatch }, link) {
  dispatch('mapRes', link).then(async (res) => {
    await res.update({
      links: firestore.FieldValue.arrayUnion(link)
    })
  })
  commit('updateState', link)
}
export { attachLink }