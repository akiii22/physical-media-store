
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  UserRound,
  ShieldCheck,
  LogOut,
  Package,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

type CartLinkProps = {
  mobile?: boolean;
  cartCount: number;
};

const CartLink = ({ mobile = false, cartCount }: CartLinkProps) => (
  <Link
    to="/cart"
    aria-label={`Shopping cart, ${cartCount} items`}
    className={`relative inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-gray-700 transition hover:bg-gray-100 ${
      mobile ? "" : ""
    }`}
  >
    <ShoppingCart className="h-5 w-5" />

    {cartCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
        {cartCount > 99 ? "99+" : cartCount}
      </span>
    )}
  </Link>
);

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { user, role, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const navigate = useNavigate();

  const cartCount = getCartItemCount();

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();

    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-gray-100 text-gray-900"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center gap-2"
        >
          <img
            src="/Logo.png"
            alt="Physical Media Store"
            className="h-10 w-10 object-contain"
          />

          <span className="hidden text-lg font-bold tracking-tight text-gray-900 sm:block">
            CDSATBP
          </span>

          <span className="text-lg font-bold tracking-tight text-gray-900 sm:hidden">
            PMS
          </span>
        </Link>

        {/* Desktop Navigation and Actions — grouped on the right */}
        <div className="hidden items-center gap-3 md:flex">
          <nav className="flex items-center gap-1">
            <NavLink to="/products" className={navLinkClass}>
              Products
            </NavLink>

            {user && role === "CUSTOMER" && (
              <NavLink to="/my-orders" className={navLinkClass}>
                My Orders
              </NavLink>
            )}

            {user && role === "ADMIN" && (
              <NavLink to="/admin/orders" className={navLinkClass}>
                Admin Orders
              </NavLink>
            )}
          </nav>

          {role !== "ADMIN" && <CartLink cartCount={cartCount} />}

          {user ? (
            <>
              {role === "CUSTOMER" && (
                <Link
                  to="/account"
                  aria-label="My account"
                  className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <UserRound className="h-5 w-5" />
                </Link>
              )}

              {role === "ADMIN" && (
                <Link
                  to="/admin"
                  aria-label="Admin dashboard"
                  className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                >
                  <ShieldCheck className="h-5 w-5" />
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex items-center gap-1 md:hidden">
          {role !== "ADMIN" && (
            <CartLink mobile cartCount={cartCount} />
          )}

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            <NavLink
              to="/products"
              onClick={closeMenu}
              className={navLinkClass}
            >
              Products
            </NavLink>

            {user && role === "CUSTOMER" && (
              <>
                <NavLink
                  to="/my-orders"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  <span className="inline-flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    My Orders
                  </span>
                </NavLink>

                <NavLink
                  to="/account"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4" />
                    My Account
                  </span>
                </NavLink>
              </>
            )}

            {user && role === "ADMIN" && (
              <>
                <NavLink
                  to="/admin"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Dashboard
                  </span>
                </NavLink>

                <NavLink
                  to="/admin/orders"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  <span className="inline-flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Orders
                  </span>
                </NavLink>

                <NavLink
                  to="/admin/payments"
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payments
                  </span>
                </NavLink>
              </>
            )}

            <div className="my-2 border-t border-gray-100" />

            {user ? (
              <>
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user.email}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {role === "ADMIN" ? "Administrator" : "Customer"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center cursor-pointer gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3 py-2">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-gray-700"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
