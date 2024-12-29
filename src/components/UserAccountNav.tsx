import { getUserSubscriptionPlan } from "@/lib/stripe";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import Image from "next/image";
import Link from "next/link";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/server";
import { 
  User, 
  LayoutDashboard, 
  CreditCard, 
  LogOut,
  Settings,
} from "lucide-react";

interface UserAccountNavProps {
  email: string | undefined;
  name: string;
  imageUrl: string;
}

const UserAccountNav = async ({
  email,
  imageUrl,
  name,
}: UserAccountNavProps) => {
  const subscriptionPlan = await getUserSubscriptionPlan();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="overflow-visible">
        <Button 
          className="group rounded-full h-9 w-9 aspect-square bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 ring-offset-2 ring-offset-white focus:ring-2 ring-indigo-500 p-0 animate-gradient-x"
        >
          <Avatar className="relative w-8 h-8 border-2 border-white rounded-full transform group-hover:scale-105 transition-transform duration-200">
            {imageUrl ? (
              <div className="relative aspect-square h-full w-full">
                <Image
                  fill
                  src={imageUrl}
                  alt="profile picture"
                  referrerPolicy="no-referrer"
                  className="rounded-full object-cover transform transition-transform duration-200"
                />
              </div>
            ) : (
              <AvatarFallback className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
                <span className="sr-only">{name}</span>
                <User className="h-4 w-4 text-white" />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="bg-white/95 backdrop-blur-sm border border-zinc-200 shadow-lg shadow-black/10 rounded-xl w-64 p-2" 
        align="end"
        sideOffset={8}
        
      >
        <div className="flex items-center justify-start gap-3 p-3 group cursor-pointer hover:bg-zinc-50 rounded-lg transition-colors duration-200">
          <Avatar className="relative w-10 h-10 border-2 border-white rounded-full shadow-sm group-hover:shadow-md transition-all duration-200">
            {imageUrl ? (
              <div className="relative aspect-square h-full w-full">
                <Image
                  fill
                  src={imageUrl}
                  alt="profile picture"
                  referrerPolicy="no-referrer"
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <AvatarFallback className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
                <User className="h-4 w-4 text-white" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            {name && (
              <p className="font-semibold text-sm text-zinc-900 group-hover:text-zinc-700">
                {name}
              </p>
            )}
            {email && (
              <p className="w-[180px] truncate text-xs text-zinc-500 group-hover:text-zinc-600">
                {email}
              </p>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-zinc-200 my-1" />

        <div className="space-y-1 p-1">
          <DropdownMenuItem asChild>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-md transition-all duration-200 cursor-pointer group"
            >
              <LayoutDashboard className="h-4 w-4 text-zinc-500 group-hover:text-indigo-600 transition-colors" />
              <span className="text-sm text-zinc-900 group-hover:text-indigo-600 transition-colors">Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            {subscriptionPlan?.isSubscribed ? (
              <Link
                href="/dashboard/billing"
                className="flex items-center gap-2 px-3 py-2 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-md transition-all duration-200 cursor-pointer group"
              >
                <CreditCard className="h-4 w-4 text-zinc-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-sm text-zinc-900 group-hover:text-indigo-600 transition-colors">Manage Subscription</span>
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-3 py-2 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-md transition-all duration-200 cursor-pointer group"
              >
                <CreditCard className="h-4 w-4 text-zinc-500 group-hover:text-indigo-600 transition-colors" />
                <span className="text-sm text-zinc-900 group-hover:text-indigo-600 transition-colors">Upgrade Plan</span>
              </Link>
            )}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-zinc-200 my-1" />

        <DropdownMenuItem asChild>
          <LogoutLink className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 rounded-md transition-all duration-200 cursor-pointer text-zinc-600 hover:text-red-600 w-full group">
            <LogOut className="h-4 w-4 transition-colors" />
            <span className="text-sm">Log out</span>
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountNav;