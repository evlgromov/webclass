import Vue from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPencilAlt, faArrowsAlt, faObjectGroup, faImage, faFileAlt, faLayerGroup, faExpandArrowsAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faPencilAlt, faArrowsAlt, faObjectGroup, faImage, faFileAlt, faLayerGroup, faExpandArrowsAlt, faTrashAlt)


Vue.component('font-awesome-icon', FontAwesomeIcon)