import { CHANGE_EMAIL_LOGIN, CHANGE_PASSWORD_LOGIN } from "./mutation-types";

export const changeEmailLogin = (email) => ({
  type: CHANGE_EMAIL_LOGIN,
  email
})

export const changePasswordLogin = (password) => ({
  type: CHANGE_PASSWORD_LOGIN,
  password
})