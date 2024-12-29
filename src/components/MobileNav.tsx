"use client";

import { 
  ArrowRight, 
  Menu, 
  X, 
  Home, 
  ShoppingCart, 
  LogIn, 
  UserPlus, 
  LogOut,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/server";
interface MobileNavProps {
  isAuth: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ isAuth }) => {
  const [isOpen, setOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Toggle the navigation menu
  const toggleOpen = () => setOpen((prev) => !prev);

  // Close the menu
  const closeMenu = () => setOpen(false);

  // Close the menu when the route changes
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  // Close menu if the user navigates to the current path
  const closeOnCurrent = (href: string) => {
    if (pathname === href) {
      closeMenu();
    }
  };

  return (
    <div className="sm:hidden relative z-50">
      {/* Menu Toggle Button */}
      <button
        onClick={toggleOpen}
        aria-label="Toggle Menu"
        className="relative z-50 p-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 hover:bg-gray-100/80 rounded-full transition-transform duration-300 active:scale-95"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-zinc-700 transition-transform duration-300" />
        ) : (
          <Menu className="h-6 w-6 text-zinc-700 transition-transform duration-300" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md animate-fadeIn">
          {/* Navigation Menu */}
          <div className="fixed inset-x-0 top-0 z-50 bg-white shadow-lg animate-slideIn rounded-b-3xl border-b border-gray-200 backdrop-blur-xl">
            <ul className="space-y-4 p-6 pt-16 max-w-md mx-auto">
              {!isAuth ? (
                /* Guest Links */
                <>
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/sign-up")}
                      href="/sign-up"
                      className="flex items-center font-semibold text-green-600 p-4 rounded-xl hover:bg-green-50 transition-colors duration-300 group"
                    >
                      <UserPlus className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-base">Get Started</span>
                      <ArrowRight className="ml-auto h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </li>
                  <hr className="border-gray-200" />
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/sign-in")}
                      href="/sign-in"
                      className="flex items-center font-medium p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300 group text-gray-700"
                    >
                      <LogIn className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-base">Sign In</span>
                    </Link>
                  </li>
                  <hr className="border-gray-200" />
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/pricing")}
                      href="/pricing"
                      className="flex items-center font-medium p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300 group text-gray-700"
                    >
                      <ShoppingCart className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-base">Pricing</span>
                    </Link>
                  </li>
                </>
              ) : (
                /* Authenticated User Links */
                <>
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/dashboard")}
                      href="/dashboard"
                      className="flex items-center font-medium p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300 group text-gray-700"
                    >
                      <LayoutDashboard className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-base">Dashboard</span>
                    </Link>
                  </li>
                  <hr className="border-gray-200" />
                  <li>
                    <Link
                      onClick={() => closeOnCurrent("/pricing")}
                      href="/pricing"
                      className="flex items-center font-medium p-4 rounded-xl hover:bg-gray-50 transition-colors duration-300 group text-gray-700"
                    >
                      <ShoppingCart className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-base">Pricing</span>
                    </Link>
                  </li>
                  <hr className="border-gray-200" />
                  <li>
                    <Link
                      href="/api/auth/logout"
                      className="flex items-center font-medium p-4 rounded-xl hover:bg-red-50 text-red-600 transition-colors duration-300 group"
                    >
                      <LogOut className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-base">Sign Out</span>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNav;