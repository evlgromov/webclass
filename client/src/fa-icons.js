import Vue from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faPencilAlt,
  faArrowsAlt,
  faObjectGroup,
  faImage,
  faFileAlt,
  faMinusSquare,
  faPlusSquare,
  faExpandArrowsAlt,
  faTrashAlt,
  faHome,
  faGlobe,
  faCopy
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(
  faPencilAlt,
  faArrowsAlt,
  faObjectGroup,
  faImage,
  faFileAlt,
  faMinusSquare,
  faPlusSquare,
  faExpandArrowsAlt,
  faTrashAlt,
  faHome,
  faGlobe,
  faCopy
)


Vue.component('font-awesome-icon', FontAwesomeIcon)