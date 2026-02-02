// src/pages/Communications/pages/Broadcast/InApp/InAppBroadcastPage.jsx
import { useState, useEffect } from "react";
import {
  Megaphone,
  Archive,
  Calendar,
  History,
  AlertCircle,
  Plus,
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
  const [editingDraft, setEditingDraft] = useState(null);

  const refreshLists = () => setRefreshTrigger((v) => v + 1);

  const handleEditDraft = (draft) => {
    setEditingDraft(draft);
    setActiveTab("create");
  };

  const tabs = [
    { id: "create", label: "Create New", icon: Plus },
    { id: "drafts", label: "Drafts", icon: Archive, count: draftCount },
    { id: "scheduled", label: "Scheduled", icon: Calendar, count: scheduledCount },
    { id: "history", label: "History", icon: History },
  ];

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#05015A] flex items-center justify-center">
            <Megaphone size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">In-App Broadcast</h1>
            <p className="text-xs text-gray-500">Send announcements to users</p>
          </div>
        </div>
        
        {/* Compact Tips */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
          <AlertCircle size={14} className="text-blue-500" />
          <span>Max 500 chars • Schedule 9AM-6PM • Preview before sending</span>
        </div>
      </div>

      {/* Tabs - Inline */}
      <div className="flex-shrink-0 flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id !== "create") setEditingDraft(null);
              setActiveTab(tab.id);
            }}
            className={`relative flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-[#05015A] shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                tab.id === "drafts" 
                  ? "bg-amber-100 text-amber-700" 
                  : "bg-orange-100 text-orange-700"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {activeTab === "create" && (
          <CreateBroadcastForm
            editDraft={editingDraft}
            onSuccess={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab("history");
            }}
            onDraftSaved={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab("drafts");
            }}
            onScheduled={() => {
              setEditingDraft(null);
              refreshLists();
              setActiveTab("scheduled");
            }}
          />
        )}

        {activeTab === "drafts" && (
          <DraftsList
            refreshTrigger={refreshTrigger}
            onCountChange={setDraftCount}
            onEdit={handleEditDraft}
          />
        )}

        {activeTab === "scheduled" && (
          <ScheduledList
            refreshTrigger={refreshTrigger}
            onCountChange={setScheduledCount}
          />
        )}

        {activeTab === "history" && (
          <HistoryList refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
};

export default InAppBroadcastPage;