import axios from "axios";

const adminApi = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
});

// Add admin JWT automatically
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(
      "odikart_admin_token"
    );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT: HANDLE FORMDATA
    |--------------------------------------------------------------------------
    |
    | Courier creation/update uploads:
    | - Photo
    | - Aadhaar
    | - Driving License
    |
    | When the request body is FormData, DO NOT set
    | Content-Type manually.
    |
    | The browser/Axios will automatically generate:
    |
    | multipart/form-data; boundary=...
    |
    */

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers["Content-Type"] =
        "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized requests
adminApi.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(
        "odikart_admin_token"
      );

      localStorage.removeItem(
        "odikart_admin_user"
      );

      if (
        window.location.pathname.startsWith(
          "/admin"
        )
      ) {
        window.location.href =
          "/admin/login";
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;