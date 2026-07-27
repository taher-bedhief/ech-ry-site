"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { HiMenuAlt2 } from "react-icons/hi";
import { IoChevronDownOutline } from "react-icons/io5";
import { FaUserCircle, FaStore, FaEnvelope, FaShoppingCart } from "react-icons/fa";
import { IoMdHeart } from "react-icons/io";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { setAuthenticated, setCurrentUser } from "@/lib/features/auth/authSlice";
import { mapUserForRedux } from "@/lib/helpers/mapUserForRedux";

import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import { ToggleTheme } from "./ToggleTheme";
import { Button } from "./ui/button";

import {
  hydrateWishlistFromServer,
  hydrateCart,
} from "@/lib/features/cart/cartSlice";

// 🔹 Logos promo
import { FaBullhorn, FaGift, FaPercent } from "react-icons/fa";

/* 🔹 Navbar public links */
const links = [
  { title: "Shops", url: "/shops", icon: <FaStore /> },
  // 👉 Choisis ton logo préféré :
  { title: "Promo", url: "/promo", icon: <FaBullhorn className="text-red-500" /> },
  // { title: "Promo", url: "/promo", icon: <FaGift className="text-green-500" /> },
  // { title: "Promo", url: "/promo", icon: <FaPercent className="text-blue-500" /> },
  { title: "Contact Us", url: "/contact", icon: <FaEnvelope /> },
];

const Navbar = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { isAuthenticated, currentUser } = useAppSelector((state) => state.auth);
  const { wishlists, cartItems } = useAppSelector((state) => state.cart);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLLIElement>(null);

  /* 🔹 Hydratation user */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        let res = await fetch("/api/auth/me", { credentials: "include" });

        if (res.status === 401) {
          await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });
          res = await fetch("/api/auth/me", { credentials: "include" });
        }

        if (!res.ok) {
          dispatch(setAuthenticated(false));
          dispatch(setCurrentUser(null));
          return;
        }

        const data = await res.json();

        if (data.authenticated && data.user) {
          dispatch(
            setCurrentUser(
              mapUserForRedux(data.user, data.user.provider || "Cognito")
            )
          );
          dispatch(setAuthenticated(true));
        } else {
          dispatch(setAuthenticated(false));
          dispatch(setCurrentUser(null));
        }
      } catch {
        dispatch(setAuthenticated(false));
        dispatch(setCurrentUser(null));
      }
    };

    fetchUser();
  }, [dispatch]);

  /* 🔹 Hydratation wishlist & cart dès que currentUser est dispo */
  useEffect(() => {
    if (currentUser?.email) {
      dispatch(hydrateWishlistFromServer(currentUser.email));
      dispatch(hydrateCart({ email: currentUser.email }));
    }
  }, [dispatch, currentUser?.email]);

  /* 🔹 Close dropdown outside */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(e.target as Node)) {
        setIsCartOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* 🔹 Logout */
  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "GET",
      credentials: "include",
    });

    dispatch(setAuthenticated(false));
    dispatch(setCurrentUser(null));
    router.push("/login");
  };

  const isAdmin =
    currentUser?.role === "admin" || currentUser?.groups?.includes("admin");

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * (item.amount ?? 1),
    0
  );

  return (
    <div className="px-default py-3 bg-secondary shadow-lg border-b sticky top-0 z-50">
      <nav className="flex items-center justify-between gap-6">
        {/* LEFT */}
        <div className="flex items-center gap-6 flex-1">
          <Link href="/" className="flex items-center gap-2">
            <motion.span
              className="text-2xl font-bold text-primary"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Ech-Ry
            </motion.span>
          </Link>

          <div className="hidden md:block flex-1 max-w-sm">
            <SearchBar />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-6">
          {/* Desktop Links */}
          <ul className="hidden lg:flex gap-6 items-center">
            {links.map((link) => (
              <li key={link.title}>
                <Link
                  href={link.url}
                  className="flex items-center gap-2 hover:text-primary transition"
                >
                  <span className="text-lg">{link.icon}</span>
                  <span>{link.title}</span>
                </Link>
              </li>
            ))}

            {/* 🔹 Wishlist Link */}
            <li>
              <Link
                href="/profile/wishlists"
                className="flex items-center gap-2 hover:text-primary transition"
              >
                <IoMdHeart className="text-pink-500 text-lg" />
                <span>Wishlist ({wishlists.length})</span>
              </Link>
            </li>

            {/* 🔹 Cart Link avec menu déroulant */}
            <li className="relative" ref={cartRef}>
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="flex items-center gap-2 hover:text-primary transition"
              >
                <FaShoppingCart className="text-lg text-primary" />
                <span>Items ({cartItems.length})</span>
                <IoChevronDownOutline />
              </button>

              <ul
                className={`absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg transition ${
                  isCartOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {cartItems.length === 0 ? (
                  <li className="px-4 py-2 text-gray-500">Cart is empty</li>
                ) : (
                  <>
                    {cartItems.map((item) => (
                      <li
                        key={item.originalId}
                        className="flex items-center justify-between px-4 py-2 border-b text-sm gap-3"
                      >
                        <div className="relative w-12 h-12 flex-shrink-0">
                          <Image
                            src={Array.isArray(item.image) ? item.image[0] : item.image || "/placeholder.jpg"}
                            alt={item.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1">
                          <span className="block truncate">{item.title} × {item.amount ?? 1}</span>
                          <span className="text-gray-500">€{item.price}</span>
                        </div>
                        <span className="font-semibold">
                          €{(item.price * (item.amount ?? 1)).toFixed(2)}
                        </span>
                      </li>
                    ))}
                    <li className="flex justify-between px-4 py-2 font-bold">
                      <span>Total</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </li>
                    <li className="px-4 py-2">
                      <Link
                        href="/checkout"
                        className="block text-center bg-primary text-white py-1 rounded hover:bg-primary/80"
                      >
                        Go to Checkout
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </li>
          </ul>

                   {/* Mobile */}
          <button
            className="md:hidden text-3xl"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            <HiMenuAlt2 />
          </button>

          <ToggleTheme />

          {/* AUTH */}
          {!isAuthenticated ? (
            <div className="flex gap-2">
              <Link href="/login">
                <Button>Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline">Register</Button>
              </Link>
            </div>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2"
              >
                <div className="relative">
                  {currentUser?.picture ? (
                    <Image
                      src={currentUser.picture}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <FaUserCircle className="text-2xl" />
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                </div>

                <div className="flex flex-col items-start max-w-[160px]">
                  <span className="truncate text-sm">{currentUser?.email}</span>
                  <span className="text-xs text-gray-500">
                    {currentUser?.provider}
                  </span>
                  {isAdmin && (
                    <span className="mt-1 inline-block px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600 rounded">
                      Admin
                    </span>
                  )}
                </div>

                <IoChevronDownOutline />
              </button>

              {/* USER DROPDOWN */}
              <ul
                className={`absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg transition ${
                  isDropdownOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {isAdmin && (
                  <>
                    <li>
                      <Link
                        href="/admin/orders"
                        className="block px-4 py-2 hover:bg-gray-100 text-red-600 font-semibold"
                      >
                        Manage Orders
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/manage-products"
                        className="block px-4 py-2 hover:bg-gray-100 text-red-600 font-semibold"
                      >
                        Manage Products
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/users"
                        className="block px-4 py-2 hover:bg-gray-100 text-red-600 font-semibold"
                      >
                        Manage Users
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/stock"
                        className="block px-4 py-2 hover:bg-gray-100 text-red-600 font-semibold"
                      >
                        Stock Dashboard
                      </Link>
                    </li>
                  </>
                )}

                <li>
                  <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">
                    My Profile
                  </Link>
                </li>

                <li>
                  <Link href="/checkout" className="block px-4 py-2 hover:bg-gray-100">
                    Checkout
                  </Link>
                </li>

                <li>
                  <Link
                    href="/profile/orders"
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    My Orders
                  </Link>
                </li>

                {/* 🔹 Wishlist in dropdown */}
                <li>
                  <Link
                    href="/profile/wishlists"
                    className="block px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <IoMdHeart className="text-pink-500 text-lg" />
                    <span>My Wishlist ({wishlists.length})</span>
                  </Link>
                </li>

                <li>
                  {currentUser?.provider === "Google" ? (
                    <button
                      disabled
                      className="w-full text-left px-4 py-2 text-gray-400"
                    >
                      Change Password
                    </button>
                  ) : (
                    <Link
                      href="/change-password"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Change Password
                    </Link>
                  )}
                </li>

                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </nav>

      <MobileMenu isOpen={isMobileOpen} setIsOpen={setIsMobileOpen} />
    </div>
  );
};

export default Navbar;
