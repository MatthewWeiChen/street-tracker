import React from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import Layout from "../components/Layout";
import {
  PhoneIcon,
  AcademicCapIcon,
  UsersIcon,
  MapIcon,
} from "@heroicons/react/24/outline";

const DASHBOARD_QUERY = gql`
  query Dashboard {
    me {
      id
      name
      role
    }
  }
`;

export default function Dashboard() {
  const { data, loading, error } = useQuery(DASHBOARD_QUERY);

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <strong>GraphQL Error:</strong> {error.message}
          </div>
          <div className="text-red-600 text-sm mt-2">
            Make sure your backend server is running on port 4000
          </div>
        </div>
      </Layout>
    );
  }

  const currentUser = data?.me;

  const stats = [
    {
      name: "Total Contacts",
      value: "--",
      icon: PhoneIcon,
      color: "bg-blue-500",
    },
    {
      name: "Active Students",
      value: "--",
      icon: AcademicCapIcon,
      color: "bg-green-500",
    },
    {
      name: "Your Role",
      value: currentUser?.role?.replace("_", " ") || "Member",
      icon: UsersIcon,
      color: "bg-purple-500",
    },
    {
      name: "Regions",
      value: "--",
      icon: MapIcon,
      color: "bg-yellow-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {currentUser?.name || "User"}! Overview of your
            evangelism activities.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.name}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {currentUser?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {currentUser?.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {currentUser?.role?.replace("_", " ")}
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Next Steps
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-blue-500 mr-3" />
                <span className="text-sm text-gray-700">
                  Start tracking evangelism contacts
                </span>
              </div>
              <div className="flex items-center">
                <AcademicCapIcon className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-sm text-gray-700">
                  Add student records for discipleship
                </span>
              </div>
              <div className="flex items-center">
                <UsersIcon className="h-5 w-5 text-purple-500 mr-3" />
                <span className="text-sm text-gray-700">
                  Coordinate with your team
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
