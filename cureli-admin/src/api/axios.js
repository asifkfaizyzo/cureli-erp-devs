import axios from "axios";

const CAdminAPI = axios.create({
  baseURL: "http://localhost:5000/cadmin",
  withCredentials: true, // refresh cookie
});

// Attach access token
CAdminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("cadmin_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh
CAdminAPI.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes("/refresh")
    ) {
      original._retry = true;

      try {
        // get new token
        const refresh = await axios.get("http://localhost:5000/cadmin/refresh", {
          withCredentials: true,
        });

        const newToken = refresh.data.data.access_token;

        localStorage.setItem("cadmin_access_token", newToken);

        original.headers.Authorization = `Bearer ${newToken}`;

        return CAdminAPI(original);
      } catch (err) {
        localStorage.removeItem("cadmin_access_token");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default CAdminAPI;
