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
    evangelismContacts {
      id
      contactName
      contacted
      createdAt
      createdBy {
        name
      }
    }
    studentRecords {
      id
      studentName
      isActive
      lastLessonDate
      tracker {
        name
      }
    }
    me {
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
        <div className="text-red-600">
          Error loading dashboard: {error.message}
        </div>
      </Layout>
    );
  }

  const { evangelismContacts = [], studentRecords = [], me } = data;

  const totalContacts = evangelismContacts.length;
  const contactedCount = evangelismContacts.filter(
    (c: any) => c.contacted
  ).length;
  const activeStudents = studentRecords.filter((s: any) => s.isActive).length;
  const recentContacts = evangelismContacts
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const stats = [
    {
      name: "Total Contacts",
      value: totalContacts,
      icon: PhoneIcon,
      color: "bg-blue-500",
    },
    {
      name: "Contacted",
      value: contactedCount,
      icon: PhoneIcon,
      color: "bg-green-500",
    },
    {
      name: "Active Students",
      value: activeStudents,
      icon: AcademicCapIcon,
      color: "bg-purple-500",
    },
    {
      name: "Pending Follow-ups",
      value: totalContacts - contactedCount,
      icon: UsersIcon,
      color: "bg-yellow-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your evangelism activities and student progress
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

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Evangelism Contacts
            </h3>
            {recentContacts.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentContacts.map((contact: any) => (
                    <li key={contact.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`h-8 w-8 rounded-full ${
                              contact.contacted
                                ? "bg-green-100"
                                : "bg-yellow-100"
                            } flex items-center justify-center`}
                          >
                            <PhoneIcon
                              className={`h-4 w-4 ${
                                contact.contacted
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {contact.contactName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Added by {contact.createdBy.name} •{" "}
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              contact.contacted
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {contact.contacted ? "Contacted" : "Pending"}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No recent contacts found.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
