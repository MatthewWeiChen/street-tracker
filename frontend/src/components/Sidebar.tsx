/**
 * PURPOSE: Navigation sidebar component
 * - Provides role-based navigation menu (different menu items for different roles)
 * - Shows current user information and role
 * - Highlights active page
 * - Responsive design that collapses on mobile
 */

import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  HomeIcon,
  UsersIcon,
  PhoneIcon,
  AcademicCapIcon,
  CogIcon,
  MapIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/", icon: HomeIcon },
    { name: "Evangelism Contacts", href: "/contacts", icon: PhoneIcon },
    { name: "Student Records", href: "/students", icon: AcademicCapIcon },
    ...(user.role === "DIRECTOR"
      ? [
          { name: "Users", href: "/users", icon: UsersIcon },
          { name: "Regions", href: "/regions", icon: MapIcon },
        ]
      : []),
    ...(user.role === "DIRECTOR" || user.role === "REGION_LEADER"
      ? [{ name: "Settings", href: "/settings", icon: CogIcon }]
      : []),
  ];

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "DIRECTOR":
        return "Director";
      case "REGION_LEADER":
        return "Region Leader";
      case "GROUP_LEADER":
        return "Group Leader";
      case "GROUP_MEMBER":
        return "Group Member";
      default:
        return role;
    }
  };

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex flex-col flex-grow bg-blue-700 pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-white text-xl font-bold">Church Evangelism</h1>
        </div>
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? "bg-blue-800 text-white"
                    : "text-blue-100 hover:bg-blue-600"
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-6 w-6"
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex-shrink-0 flex bg-blue-800 p-4">
          <div className="flex-shrink-0 w-full group block">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs font-medium text-blue-200">
                  {getRoleDisplay(user.role)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
