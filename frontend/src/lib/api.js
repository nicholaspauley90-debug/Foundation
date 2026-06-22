import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND}/api`;

export const apiClient = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach bearer token from localStorage as fallback
apiClient.interceptors.request.use((config) => {
  const t = localStorage.getItem("foundation_token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

// Products
export const listProducts = () => apiClient.get("/products").then((r) => r.data);
export const getProduct = (id) => apiClient.get(`/products/${id}`).then((r) => r.data);

// Reviews
export const getReviews = (id) => apiClient.get(`/products/${id}/reviews`).then((r) => r.data);
export const postReview = (id, payload) => apiClient.post(`/products/${id}/reviews`, payload).then((r) => r.data);

// Checkout
export const createCheckout = (items, originUrl, email, shipping_address) =>
  apiClient.post("/checkout/session", { items, origin_url: originUrl, email, shipping_address }).then((r) => r.data);
export const checkoutStatus = (sid) => apiClient.get(`/checkout/status/${sid}`).then((r) => r.data);

// Newsletter
export const subscribeEmail = (email, source = "skin_labs") =>
  apiClient.post("/newsletter", { email, source }).then((r) => r.data);

// Cart tracking (abandoned cart)
export const trackCart = (email, items) => apiClient.post("/cart/track", { email, items }).then((r) => r.data);

// Auth
export const register = (payload) => apiClient.post("/auth/register", payload).then((r) => r.data);
export const login = (payload) => apiClient.post("/auth/login", payload).then((r) => r.data);
export const logout = () => apiClient.post("/auth/logout").then((r) => r.data);
export const me = () => apiClient.get("/auth/me").then((r) => r.data);

// Account
export const myOrders = () => apiClient.get("/account/orders").then((r) => r.data);
