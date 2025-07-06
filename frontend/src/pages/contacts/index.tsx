import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import Layout from "../../components/Layout";
import ContactForm from "../../components/ContactForm";
import {
  PlusIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

const CONTACTS_QUERY = gql`
  query EvangelismContacts {
    evangelismContacts {
      id
      contactName
      contactInfo
      location
      notes
      followUpDate
      contacted
      createdAt
      createdBy {
        id
        name
      }
    }
  }
`;

const UPDATE_CONTACT_MUTATION = gql`
  mutation UpdateEvangelismContact($id: String!, $contacted: Boolean) {
    updateEvangelismContact(id: $id, contacted: $contacted) {
      id
      contacted
    }
  }
`;

export default function ContactsPage() {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all"); // all, contacted, pending

  const { data, loading, error, refetch } = useQuery(CONTACTS_QUERY);
  const [updateContact] = useMutation(UPDATE_CONTACT_MUTATION);

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
          Error loading contacts: {error.message}
        </div>
      </Layout>
    );
  }

  const contacts = data?.evangelismContacts || [];

  const filteredContacts = contacts.filter((contact: any) => {
    if (filter === "contacted") return contact.contacted;
    if (filter === "pending") return !contact.contacted;
    return true;
  });

  const handleToggleContacted = async (id: string, contacted: boolean) => {
    try {
      await updateContact({
        variables: { id, contacted: !contacted },
      });
      refetch();
    } catch (error) {
      console.error("Error updating contact:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Evangelism Contacts
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage your evangelism contacts
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowForm(true)}
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Contact
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: "all", label: "All Contacts", count: contacts.length },
              {
                key: "pending",
                label: "Pending",
                count: contacts.filter((c: any) => !c.contacted).length,
              },
              {
                key: "contacted",
                label: "Contacted",
                count: contacts.filter((c: any) => c.contacted).length,
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

        {/* Contacts list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredContacts.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredContacts.map((contact: any) => (
                <li key={contact.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div
                            className={`h-10 w-10 rounded-full ${
                              contact.contacted
                                ? "bg-green-100"
                                : "bg-yellow-100"
                            } flex items-center justify-center`}
                          >
                            <PhoneIcon
                              className={`h-5 w-5 ${
                                contact.contacted
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {contact.contactName}
                            </p>
                            <span
                              className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                contact.contacted
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {contact.contacted ? "Contacted" : "Pending"}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            {contact.contactInfo && (
                              <span className="mr-4">
                                📞 {contact.contactInfo}
                              </span>
                            )}
                            {contact.location && (
                              <span className="mr-4 flex items-center">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {contact.location}
                              </span>
                            )}
                            {contact.followUpDate && (
                              <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(
                                  contact.followUpDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="mt-2 text-sm text-gray-600">
                              {contact.notes}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-gray-500">
                            Added by {contact.createdBy.name} on{" "}
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            handleToggleContacted(contact.id, contact.contacted)
                          }
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            contact.contacted
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {contact.contacted
                            ? "Mark as Pending"
                            : "Mark as Contacted"}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No contacts found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new evangelism contact.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Add Contact
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showForm && (
        <ContactForm
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
