import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import Layout from "../../components/Layout";
import StudentForm from "../../components/StudentForm";
import {
  PlusIcon,
  AcademicCapIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const STUDENTS_QUERY = gql`
  query StudentRecords {
    studentRecords {
      id
      studentName
      lastLesson
      lastLessonDate
      nextLessonDate
      notes
      isActive
      createdAt
      tracker {
        id
        name
      }
    }
  }
`;

export default function StudentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all"); // all, active, inactive

  const { data, loading, error, refetch } = useQuery(STUDENTS_QUERY);

  if (loading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          Error loading students: {error.message}
        </div>
      </Layout>
    );
  }

  const students = data?.studentRecords || [];

  const filteredStudents = students.filter((student: any) => {
    if (filter === "active") return student.isActive;
    if (filter === "inactive") return !student.isActive;
    return true;
  });

  const getStatusColor = (student: any) => {
    if (!student.isActive) return "bg-gray-100 text-gray-800";
    if (!student.lastLessonDate) return "bg-blue-100 text-blue-800";

    const daysSinceLastLesson = Math.floor(
      (new Date().getTime() - new Date(student.lastLessonDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastLesson <= 7) return "bg-green-100 text-green-800";
    if (daysSinceLastLesson <= 14) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusText = (student: any) => {
    if (!student.isActive) return "Inactive";
    if (!student.lastLessonDate) return "New Student";

    const daysSinceLastLesson = Math.floor(
      (new Date().getTime() - new Date(student.lastLessonDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastLesson <= 7) return "Recent";
    if (daysSinceLastLesson <= 14) return "Due Soon";
    return "Overdue";
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Student Records
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track student progress and lesson schedules
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowForm(true)}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Student
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: "all", label: "All Students", count: students.length },
              {
                key: "active",
                label: "Active",
                count: students.filter((s: any) => s.isActive).length,
              },
              {
                key: "inactive",
                label: "Inactive",
                count: students.filter((s: any) => !s.isActive).length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`${
                  filter === tab.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Students list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredStudents.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredStudents.map((student: any) => (
                <li key={student.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {student.studentName}
                            </p>
                            <span
                              className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                student
                              )}`}
                            >
                              {getStatusText(student)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            {student.lastLesson && (
                              <span className="mr-4">
                                Last lesson: {student.lastLesson}
                              </span>
                            )}
                            {student.lastLessonDate && (
                              <span className="mr-4 flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(
                                  student.lastLessonDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                            {student.nextLessonDate && (
                              <span className="flex items-center text-blue-600">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Next:{" "}
                                {new Date(
                                  student.nextLessonDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {student.notes && (
                            <p className="mt-2 text-sm text-gray-600">
                              {student.notes}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500 flex items-center">
                            <UserIcon className="h-3 w-3 mr-1" />
                            Tracked by {student.tracker.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No students found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new student record.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Add Student
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Form Modal */}
      {showForm && (
        <StudentForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </Layout>
  );
}
