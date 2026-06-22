import axios from "axios";

const BACKEND = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND}/api`;

export const apiClient = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
});

export async function listProducts() {
  const { data } = await apiClient.get("/products");
  return data;
}
export async function getProduct(id) {
  const { data } = await apiClient.get(`/products/${id}`);
  return data;
}
export async function createCheckout(items, originUrl, email) {
  const { data } = await apiClient.post("/checkout/session", { items, origin_url: originUrl, email });
  return data;
}
export async function checkoutStatus(sessionId) {
  const { data } = await apiClient.get(`/checkout/status/${sessionId}`);
  return data;
}
export async function subscribeEmail(email, source = "skin_labs") {
  const { data } = await apiClient.post("/newsletter", { email, source });
  return data;
}
