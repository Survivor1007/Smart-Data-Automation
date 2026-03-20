import axios, {type  AxiosInstance} from "axios";
const api:AxiosInstance = axios.create({
      baseURL:'http://127.0.0.1:8000/api/v1',
      timeout:30000,
      headers:{
            'Content-Type':'application/json'
      },
});

api.interceptors.response.use(
      (response) => response,
      (error) =>{
            console.error('API error', error);
            return Promise.reject(error);
      }
);

export default api;
