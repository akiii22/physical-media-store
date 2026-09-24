import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout"
import OrderConfirmation from "./pages/OrderConrimation";
import AdminPayments from "./pages/AdminPayments";
const App = () => {
     return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/products" replace />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/products/:id"
          element={<ProductDetails />}
        />

        <Route
         path="/cart"
         element={<Cart />}/>

        <Route 
        path="/checkout"
        element={<Checkout />} />

        <Route
        path="/order-confirmation/:orderId"
        element={<OrderConfirmation />}
        />

        <Route
  path="/admin/payments"
  element={<AdminPayments />}
/>

      </Routes>
      
    </BrowserRouter>
  );
} 


export default App;