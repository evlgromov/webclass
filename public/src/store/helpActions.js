import axios from 'axios';

const axiosHaveMethod = (method) => ['post', 'put', 'get', 'delete'].indexOf(method) !== -1;

export const fetch = (method, url, payload, cb) => axiosHaveMethod(method) ? axios[method](url, payload)
  .then((res) => {
    const data = res.data;

    if (data.success) {
      return cb(null, data.data);
    } else {
      return cb(data.error);
    }
  })
  .catch((err) => {
    const data = err.response.data;
    cb(data);
  })
  .finally(() => {
  }) : cb({ message: 'Такого метода не существует' });