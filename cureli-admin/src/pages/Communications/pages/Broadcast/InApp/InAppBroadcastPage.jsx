// src/pages/Communications/pages/Broadcast/InApp/InAppBroadcastPage.jsx
import { useState, useEffect } from "react";
import {
  Megaphone,
  Archive,
  Calendar,
  History,
  AlertCircle,
} from "lucide-react";
import CreateBroadcastForm from "./comps/CreateBroadcastForm";
import DraftsList from "./comps/DraftsList";
import ScheduledList from "./comps/ScheduledList";
import HistoryList from "./comps/HistoryList";

const InAppBroadcastPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [draftCount, setDraftCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshLists = () => setRefreshTrigger((v) => v + 1);

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#05015A] flex items-center justify-center flex-shrink-0">
            <Megaphone size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">In-App Broadcast</h1>
            <p className="text-sm text-gray-500">
              Send announcements to all or selected users
            </p>
          </div>
        </div>
      </div>

      {/* Best Practices Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <strong className="font-medium">Best Practices:</strong>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>Keep messages under 500 characters</li>
            <li>Use Critical priority only for emergencies</li>
            <li>Schedule during business hours (9 AM – 6 PM)</li>
            <li>Always preview recipient count before sending</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "create"
              ? "bg-white text-[#05015A] shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Megaphone size={18} />
          Create New
        </button>

        <button
          onClick={() => setActiveTab("drafts")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
            activeTab === "drafts"
              ? "bg-white text-[#05015A] shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Archive size={18} />
          Drafts
          {draftCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {draftCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("scheduled")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
            activeTab === "scheduled"
              ? "bg-white text-[#05015A] shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Calendar size={18} />
          Scheduled
          {scheduledCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {scheduledCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "history"
              ? "bg-white text-[#05015A] shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <History size={18} />
          History
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {activeTab === "create" && (
          <CreateBroadcastForm
            onSuccess={() => {
              refreshLists();
              setActiveTab("history");
            }}
            onDraftSaved={() => {
              refreshLists();
              setActiveTab("drafts");
            }}
            onScheduled={() => {
              refreshLists();
              setActiveTab("scheduled");
            }}
          />
        )}

        {activeTab === "drafts" && (
          <DraftsList
            refreshTrigger={refreshTrigger}
            onCountChange={setDraftCount}
          />
        )}

        {activeTab === "scheduled" && (
          <ScheduledList
            refreshTrigger={refreshTrigger}
            onCountChange={setScheduledCount}
          />
        )}

        {activeTab === "history" && <HistoryList refreshTrigger={refreshTrigger} />}
      </div>
    </div>
  );
};

export default InAppBroadcastPage;