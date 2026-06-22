import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const SkinLabs = lazy(() => import("./pages/SkinLabs"));
const About = lazy(() => import("./pages/About"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Account = lazy(() => import("./pages/Account"));
const NotFound = lazy(() => import("./pages/NotFound"));

function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-100">
      <div className="flex gap-2 text-stone-950">
        <span className="dot-pulse" style={{ animationDelay: "0s" }} />
        <span className="dot-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="dot-pulse" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/skin-labs" element={<SkinLabs />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/account" element={<Account />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
