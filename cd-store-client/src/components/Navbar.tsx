import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, ShoppingCart, X, Package, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ cartCount = 0 }) => {
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
    `text-sm font-medium transition-colors duration-150 px-3 py-2 rounded-md ${
      isActive
        ? "bg-gray-100 text-black font-semibold"
        : "text-gray-600 hover:text-black hover:bg-gray-50"
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
        {/* Logo Section */}
        <Link
          to="/products"
          onClick={closeMenu}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-black rounded-lg"
        >
          <img
            src="/Logo.png"
            alt="Physical Media Store"
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain transition-transform group-hover:scale-105"
          />

          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 leading-tight">
              Physical Media
            </h1>
            <p className="hidden sm:block text-[11px] text-gray-500 font-medium">
              Music • Movies • Memories
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-2 md:flex">
          <NavLink to="/products" className={navLinkStyle}>
            Products
          </NavLink>

          {user && role === "CUSTOMER" && (
            <NavLink to="/my-orders" className={navLinkStyle}>
              My Orders
            </NavLink>
          )}

          {user && role === "ADMIN" && (
            <NavLink to="/admin/orders" className={navLinkStyle}>
              Admin Orders
            </NavLink>
          )}

          {/* Desktop Cart */}
          {role !== "ADMIN" && (
            <Link
              to="/cart"
              className="relative p-2 ml-2 text-gray-600 transition hover:text-black hover:bg-gray-100 rounded-full"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          <div className="h-5 w-px bg-gray-200 mx-2" />

          {/* Desktop Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="max-w-[140px] truncate text-xs font-semibold text-gray-900">
                  {user.email}
                </p>
                <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                  {role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
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

        {/* Mobile Header Right Controls */}
        <div className="flex items-center gap-1 md:hidden">
          {/* Always Visible Cart Icon on Mobile */}
          {role !== "ADMIN" && (
            <Link
              to="/cart"
              onClick={closeMenu}
              className="relative p-2.5 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 active:bg-gray-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="animate-in slide-in-from-top-2 border-t border-gray-100 bg-white px-4 pt-3 pb-6 shadow-xl md:hidden">
          <div className="flex flex-col gap-1.5">
            <NavLink
              to="/products"
              onClick={closeMenu}
              className={mobileNavLinkStyle}
            >
              <Package size={18} />
              Products
            </NavLink>

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

            {/* Mobile User Profile / Auth Section */}
            {user ? (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="mb-3 flex items-center gap-3 px-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                      {user.email}
                    </p>
                    <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                      {role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full rounded-xl bg-black py-3 text-sm font-medium text-white transition hover:bg-gray-800 active:scale-[0.99]"
                >
                  Logout
                </button>
              </div>
            ) : (
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