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
  faPlus,
  faMinus,
  faExpandArrowsAlt,
  faTrashAlt,
  faHome,
  faGlobe,
  faCopy,
  faFont,
  faTrash,
  faEraser,
  faUndoAlt,
  faRedoAlt,
  faPalette
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
  faPlus,
  faMinus,
  faExpandArrowsAlt,
  faTrashAlt,
  faHome,
  faGlobe,
  faCopy,
  faFont,
  faTrash,
  faEraser,
  faUndoAlt,
  faRedoAlt,
  faPalette
)


Vue.component('font-awesome-icon', FontAwesomeIcon)