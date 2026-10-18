
import { Route, Routes, useLocation } from "react-router-dom";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConrimation";
import AdminPayments from "./pages/AdminPayments";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoutes";
import AdminOrders from "./pages/AdminOrders";
import MyOrders from "./pages/MyOrders";
import MyOrderDetails from "./pages/MyOrderDetails";
import Navbar from "./components/Navbar";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AddProduct from "./pages/admin/AddProduct";
import EditProduct from "./pages/admin/EditProduct";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCustomers from "./pages/admin/AdminCustomer";
import NotFound from "./pages/NotFound";
import Account from "./pages/Account";
import AdminSales from "./pages/admin/AdminSales";
import AdminEmailTemplate from "./pages/admin/AdminEmailTemplate";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const App = () => {
  const location = useLocation();

  const hideNavbar =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && <Navbar />}

      <Routes>
        {/* ================================================
            CUSTOMER / PUBLIC ROUTES
        ================================================= */}

        <Route path="/" element={<Home />} />

        <Route path="/products" element={<Products />} />

        <Route
          path="/products/:id"
          element={<ProductDetails />}
        />

        <Route path="/cart" element={<Cart />} />

        <Route
          path="/order-confirmation/:orderId"
          element={<OrderConfirmation />}
        />

        {/* ================================================
            CUSTOMER PROTECTED ROUTES
        ================================================= */}

        <Route
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]} />
          }
        >
          <Route path="/checkout" element={<Checkout />} />

          <Route path="/my-orders" element={<MyOrders />} />

          <Route
            path="/my-orders/:orderId"
            element={<MyOrderDetails />}
          />

          <Route path="/account" element={<Account />} />
        </Route>

        {/* ================================================
            AUTHENTICATION
        ================================================= */}

        <Route path="/register" element={<Register />} />

        <Route path="/login" element={<Login />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================================================
            ADMIN + STAFF ROUTES
            Both roles can access dashboard, products,
            and order management.
        ================================================= */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["ADMIN", "STAFF"]}
            />
          }
        >
          <Route element={<AdminLayout />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />

            {/* Product management */}
            <Route
              path="/admin/products"
              element={<AdminProducts />}
            />

            <Route
              path="/admin/products/new"
              element={<AddProduct />}
            />

            <Route
              path="/admin/products/:id/edit"
              element={<EditProduct />}
            />

            {/* Order management */}
            <Route
              path="/admin/orders"
              element={<AdminOrders />}
            />

            <Route
                path="/admin/payments"
                element={<AdminPayments />}
              />

            <Route path="/admin/sales-reports" element={<AdminSales />} />

            {/* ============================================
                ADMIN-ONLY ROUTES
                STAFF cannot access these pages.
            ============================================ */}

            <Route
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]} />
              }
            >
              
              <Route
                path="/admin/email-templates"
                element={<AdminEmailTemplate />}
              />

              <Route
                path="/admin/admins"
                element={<AdminManagement />}
              />

              <Route
                path="/admin/settings"
                element={<AdminSettings />}
              />
   

              <Route
                path="/admin/customers"
                element={<AdminCustomers />}
              />

         </Route>
          </Route>
        </Route>

        {/* ================================================
            NOT FOUND
        ================================================= */}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
