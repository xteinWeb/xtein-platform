
//valida la respuesta obtenida.
export const validatorRes = (data) => {
  let res;
  let token;
  if ( data.data !== undefined ) {
    res = JSON.parse(data.data);
    token = data.token;
  } else
    res = JSON.parse(data);

  if (res.length !== 0){
    if ((token !== undefined) || (token !== '')) {
      localStorage.setItem("token", token);
    }
    if (res[0].ErrMensaje !== '') {
      return res;
    }
  } else {
    if ((token !== undefined) || (token !== '')) {
      localStorage.setItem("token", token);
    }
    if (res[0].ErrMensaje !== '') {
      return res;
    }
  }
  return res;
}