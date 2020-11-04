import { HAVE_USER, SET_USER } from "./mutation-types";

export const haveUser = (have) => ({
  type: HAVE_USER,
  have
})

export const setUser = (user) => ({
  type: SET_USER,
  user
})