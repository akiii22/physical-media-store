import { Navigate, Route, Routes } from "react-router-dom";

import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConrimation";
import AdminPayments from "./pages/AdminPayments";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoutes";
import AdminOrders from "./pages/AdminOrders";
import MyOrders from "./pages/MyOrders";
import MyOrderDetails from "./pages/MyOrderDetails";

const App = () => {
  const { user, role, logout } = useAuth();


  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div>
      {user && (
        <div className="flex items-center justify-end gap-4 border-b px-6 py-3">
          <div className="text-sm">
            <span>{user.email}</span>

            <span className="ml-2 rounded bg-gray-100 px-2 py-1 text-xs">
              {role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/products" replace />} />

        <Route path="/products" element={<Products />} />

        <Route
          path="/products/:id"
          element={<ProductDetails />}
        />

        <Route path="/cart" element={<Cart />} />

        <Route
          element={<ProtectedRoute allowedRoles={["CUSTOMER"]} />}
        >
          <Route path="/checkout" element={<Checkout />} />
          <Route
      path="/my-orders"
      element={<MyOrders />}
    />  <Route
    path="/my-orders/:orderId"
    element={<MyOrderDetails />}
  />
        </Route>

        <Route
          path="/order-confirmation/:orderId"
          element={<OrderConfirmation />}
        />

        <Route path="/register" element={<Register />} />

        <Route path="/login" element={<Login />} />

        <Route
          element={<ProtectedRoute allowedRoles={["ADMIN"]} />}
        >
          <Route
            path="/admin/payments"
            element={<AdminPayments />}
          />
        </Route>

        <Route
    path="/admin/orders"
    element={<AdminOrders />}
  />
      </Routes>
    </div>
  );
};
export default App;