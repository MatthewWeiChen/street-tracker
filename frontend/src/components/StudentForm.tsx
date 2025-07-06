import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { XMarkIcon } from "@heroicons/react/24/outline";

const CREATE_STUDENT_MUTATION = gql`
  mutation CreateStudentRecord(
    $studentName: String!
    $lastLesson: String
    $lastLessonDate: DateTime
    $nextLessonDate: DateTime
    $notes: String
  ) {
    createStudentRecord(
      studentName: $studentName
      lastLesson: $lastLesson
      lastLessonDate: $lastLessonDate
      nextLessonDate: $nextLessonDate
      notes: $notes
    ) {
      id
      studentName
      lastLesson
      lastLessonDate
      nextLessonDate
      notes
      isActive
      createdAt
    }
  }
`;

interface StudentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentForm({ onClose, onSuccess }: StudentFormProps) {
  const [formData, setFormData] = useState({
    studentName: "",
    lastLesson: "",
    lastLessonDate: "",
    nextLessonDate: "",
    notes: "",
  });

  const [createStudent, { loading }] = useMutation(CREATE_STUDENT_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createStudent({
        variables: {
          ...formData,
          lastLessonDate: formData.lastLessonDate
            ? new Date(formData.lastLessonDate)
            : null,
          nextLessonDate: formData.nextLessonDate
            ? new Date(formData.nextLessonDate)
            : null,
        },
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating student:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Student</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="studentName"
              className="block text-sm font-medium text-gray-700"
            >
              Student Name *
            </label>
            <input
              type="text"
              name="studentName"
              id="studentName"
              required
              value={formData.studentName}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="lastLesson"
              className="block text-sm font-medium text-gray-700"
            >
              Last Lesson
            </label>
            <input
              type="text"
              name="lastLesson"
              id="lastLesson"
              value={formData.lastLesson}
              onChange={handleChange}
              placeholder="e.g., Lesson 3: The Gospel"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="lastLessonDate"
              className="block text-sm font-medium text-gray-700"
            >
              Last Lesson Date
            </label>
            <input
              type="date"
              name="lastLessonDate"
              id="lastLessonDate"
              value={formData.lastLessonDate}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="nextLessonDate"
              className="block text-sm font-medium text-gray-700"
            >
              Next Lesson Date
            </label>
            <input
              type="date"
              name="nextLessonDate"
              id="nextLessonDate"
              value={formData.nextLessonDate}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Notes
            </label>
            <textarea
              name="notes"
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              placeholder="Progress notes, prayer requests, etc."
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
