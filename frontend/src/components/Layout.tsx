/**
 * PURPOSE: Main application layout component
 * - Provides the overall structure for all pages (sidebar + main content)
 * - Handles user authentication checking
 * - Shows loading states and login form for unauthenticated users
 * - Wraps all page content with consistent navigation and header
 */

import React from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import Sidebar from "./Sidebar";
import Header from "./Header";

// GraphQL query to get information about the currently logged-in user
const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      role
    }
  }
`;

interface LayoutProps {
  children: React.ReactNode; // Page content to be wrapped by the layout
}

export default function Layout({ children }: LayoutProps) {
  // Query the current user to check authentication status
  const { data, loading, error } = useQuery(ME_QUERY);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login form if user is not authenticated
  if (error || !data?.me) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in to your account
            </h2>
          </div>
          {/* Simple login form - in production, integrate with NextAuth.js or similar */}
          <div className="mt-8 space-y-6">
            <div className="rounded-md shadow-sm -space-y-px">
              <input
                type="email"
                placeholder="Email address"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
              <input
                type="password"
                placeholder="Password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main application layout with sidebar and content area
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed sidebar for navigation */}
      <Sidebar user={data.me} />

      {/* Main content area with header */}
      <div className="lg:pl-64">
        {" "}
        {/* Offset for sidebar width */}
        <Header user={data.me} />
        {/* Page content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
