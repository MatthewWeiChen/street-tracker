import React from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function Header({ user }: HeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                <span className="text-lg font-semibold text-gray-900">
                  Evangelism Tracker
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          <div className="relative ml-3">
            <div className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <span className="text-gray-700 text-sm font-medium">
                Welcome, {user.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
