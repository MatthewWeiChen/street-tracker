import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { XMarkIcon } from "@heroicons/react/24/outline";

const CREATE_CONTACT_MUTATION = gql`
  mutation CreateEvangelismContact(
    $contactName: String!
    $contactInfo: String
    $location: String
    $notes: String
    $followUpDate: DateTime
  ) {
    createEvangelismContact(
      contactName: $contactName
      contactInfo: $contactInfo
      location: $location
      notes: $notes
      followUpDate: $followUpDate
    ) {
      id
      contactName
      contactInfo
      location
      notes
      followUpDate
      contacted
      createdAt
    }
  }
`;

interface ContactFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ContactForm({ onClose, onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState({
    contactName: "",
    contactInfo: "",
    location: "",
    notes: "",
    followUpDate: "",
  });

  const [createContact, { loading }] = useMutation(CREATE_CONTACT_MUTATION);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createContact({
        variables: {
          ...formData,
          followUpDate: formData.followUpDate
            ? new Date(formData.followUpDate)
            : null,
        },
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating contact:", error);
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
          <h3 className="text-lg font-medium text-gray-900">Add New Contact</h3>
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
              htmlFor="contactName"
              className="block text-sm font-medium text-gray-700"
            >
              Contact Name *
            </label>
            <input
              type="text"
              name="contactName"
              id="contactName"
              required
              value={formData.contactName}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="contactInfo"
              className="block text-sm font-medium text-gray-700"
            >
              Contact Info (Phone/Email)
            </label>
            <input
              type="text"
              name="contactInfo"
              id="contactInfo"
              value={formData.contactInfo}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700"
            >
              Location
            </label>
            <input
              type="text"
              name="location"
              id="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="followUpDate"
              className="block text-sm font-medium text-gray-700"
            >
              Follow-up Date
            </label>
            <input
              type="date"
              name="followUpDate"
              id="followUpDate"
              value={formData.followUpDate}
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
              {loading ? "Creating..." : "Create Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
