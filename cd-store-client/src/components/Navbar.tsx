import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu,
  ShoppingCart,
  X,
  Package,
  ShieldCheck,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type NavbarProps = {
  cartCount?: number;
};

const Navbar = ({ cartCount = 0 }: NavbarProps) => {
  const { user, role, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      closeMenu();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
      isActive
        ? "bg-gray-100 font-semibold text-black"
        : "text-gray-600 hover:bg-gray-50 hover:text-black"
    }`;

  const mobileNavLinkStyle = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-black text-white"
        : "text-gray-700 hover:bg-gray-100 hover:text-black"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* =====================================================
            LOGO
        ====================================================== */}
        <Link
          to="/products"
          onClick={closeMenu}
          className="group flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        >
          <img
            src="/Logo.png"
            alt="Physical Media Store"
            className="h-10 w-10 object-contain transition-transform group-hover:scale-105 sm:h-12 sm:w-12"
          />

          <div className="flex flex-col">
            <h1 className="text-base font-bold leading-tight tracking-tight text-gray-900 sm:text-lg">
              Physical Media
            </h1>

            <p className="hidden text-[11px] font-medium text-gray-500 sm:block">
              Music • Movies • Memories
            </p>
          </div>
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ====================================================== */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Products */}
          <NavLink to="/products" className={navLinkStyle}>
            Products
          </NavLink>

          {/* Customer Orders */}
          {user && role === "CUSTOMER" && (
            <NavLink to="/my-orders" className={navLinkStyle}>
              My Orders
            </NavLink>
          )}

          {/* Admin Orders */}
          {user && role === "ADMIN" && (
            <NavLink to="/admin/orders" className={navLinkStyle}>
              Admin Orders
            </NavLink>
          )}

          {/* =================================================
              SHOPPING CART
          ================================================== */}
          {role !== "ADMIN" && (
            <Link
              to="/cart"
              className="relative ml-1 rounded-full p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-black"
              aria-label={`Shopping cart${
                cartCount > 0 ? `, ${cartCount} items` : ""
              }`}
              title="Shopping Cart"
            >
              <ShoppingCart size={21} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          <div className="mx-2 h-5 w-px bg-gray-200" />

          {/* =================================================
              DESKTOP AUTH
          ================================================== */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Customer Account */}
              {role === "CUSTOMER" && (
                <Link
                  to="/account"
                  className="group relative rounded-full p-2.5 text-gray-600 transition hover:bg-gray-100 hover:text-black"
                  aria-label="My Account"
                  title="My Account"
                >
                  <User size={21} />

                  {/* Tooltip */}
                  <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-gray-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                    My Account
                  </span>
                </Link>
              )}

              {/* Admin Indicator */}
              {role === "ADMIN" && (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700"
                  title="Administrator"
                  aria-label="Administrator"
                >
                  <ShieldCheck size={19} />
                </div>
              )}

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* =====================================================
            MOBILE HEADER CONTROLS
        ====================================================== */}
        <div className="flex items-center gap-1 md:hidden">
          {/* Mobile Cart */}
          {role !== "ADMIN" && (
            <Link
              to="/cart"
              onClick={closeMenu}
              className="relative rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 active:bg-gray-200"
              aria-label={`Shopping cart${
                cartCount > 0 ? `, ${cartCount} items` : ""
              }`}
            >
              <ShoppingCart size={22} />

              {cartCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Menu */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 active:bg-gray-200"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* =======================================================
          MOBILE NAVIGATION DRAWER
      ======================================================== */}
      {isMenuOpen && (
        <div className="animate-in slide-in-from-top-2 border-t border-gray-100 bg-white px-4 pb-6 pt-3 shadow-xl md:hidden">
          <div className="flex flex-col gap-1.5">
            {/* Products */}
            <NavLink
              to="/products"
              onClick={closeMenu}
              className={mobileNavLinkStyle}
            >
              <Package size={18} />
              Products
            </NavLink>

            {/* Customer Orders */}
            {user && role === "CUSTOMER" && (
              <NavLink
                to="/my-orders"
                onClick={closeMenu}
                className={mobileNavLinkStyle}
              >
                <Package size={18} />
                My Orders
              </NavLink>
            )}

            {/* Customer Account */}
            {user && role === "CUSTOMER" && (
              <NavLink
                to="/account"
                onClick={closeMenu}
                className={mobileNavLinkStyle}
              >
                <User size={18} />
                My Account
              </NavLink>
            )}

            {/* Admin Navigation */}
            {user && role === "ADMIN" && (
              <>
                <NavLink
                  to="/admin/orders"
                  onClick={closeMenu}
                  className={mobileNavLinkStyle}
                >
                  <ShieldCheck size={18} />
                  Admin Orders
                </NavLink>

                <NavLink
                  to="/admin/payments"
                  onClick={closeMenu}
                  className={mobileNavLinkStyle}
                >
                  <ShieldCheck size={18} />
                  Payments
                </NavLink>
              </>
            )}

            {/* =================================================
                MOBILE USER INFORMATION
            ================================================== */}
            {user ? (
              <div className="mt-4 border-t border-gray-100 pt-4">
                {/* User */}
                <div className="mb-3 flex items-center gap-3 px-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    {role === "ADMIN" ? (
                      <ShieldCheck size={18} />
                    ) : (
                      <User size={18} />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <p className="max-w-[220px] truncate text-sm font-semibold text-gray-900">
                      {user.email}
                    </p>

                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      {role}
                    </span>
                  </div>
                </div>

                {/* Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.99]"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            ) : (
              /* Login / Register */
              <div className="mt-4 flex gap-3 border-t border-gray-100 pt-4">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 rounded-xl bg-black py-2.5 text-center text-sm font-medium text-white hover:bg-gray-800"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;