import * as types from "./mutation-types";

export const changeEmailRegister = (email) => ({
  type: types.CHANGE_EMAIL_REGISTER,
  email
})

export const changePasswordRegister = (password) => ({
  type: types.CHANGE_PASSWORD_REGISTER,
  password
})

export const changeFirstnameRegister = (firstname) => ({
  type: types.CHANGE_FIRSTNAME_REGISTER,
  firstname
})

export const changeLastnameRegister = (lastname) => ({
  type: types.CHANGE_LASTNAME_REGISTER,
  lastname
})

export const changeRoleRegister = (role) => ({
  type: types.CHANGE_ROLE_REGISTER,
  role
})