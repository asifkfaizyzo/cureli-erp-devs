// src/pages/Communications/pages/Broadcast/Email/EmailBroadcastPage.jsx

import { useState, useEffect } from "react";
import {
  Mail,
  Archive,
  Calendar,
  History,
  Plus,
  Users,
  AlertCircle,
} from "lucide-react";
import CreateEmailForm from "./comps/CreateEmailForm";
import EmailDraftsList from "./comps/EmailDraftsList";
import EmailScheduledList from "./comps/EmailScheduledList";
import EmailHistoryList from "./comps/EmailHistoryList";
import UnsubscribeListModal from "./comps/UnsubscribeListModal";
import * as emailBroadcastAPI from "../../../../../api/cadminEmailBroadcast";

const EmailBroadcastPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [draftCount, setDraftCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingDraft, setEditingDraft] = useState(null);
  const [quota, setQuota] = useState(null);
  const [unsubscribeCount, setUnsubscribeCount] = useState(0);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);

  const refreshLists = () => setRefreshTrigger((v) => v + 1);

  // Load quota and unsubscribe count
  useEffect(() => {
    loadQuota();
    loadUnsubscribeCount();
  }, []);

  // ✅ FIXED: Proper response parsing
  const loadQuota = async () => {
    try {
      const res = await emailBroadcastAPI.getQuotaStatus();

      console.log("[EmailBroadcastPage] Quota API Response:", res);

      // API returns response.data, so res is already the data object
      if (res && res.success) {
        setQuota(res.data);
      } else if (res && res.remaining !== undefined) {
        // Direct data format
        setQuota(res);
      }
    } catch (err) {
      console.error("Failed to load quota:", err);
    }
  };

  // ✅ FIXED: Proper response parsing
  const loadUnsubscribeCount = async () => {
    try {
      const res = await emailBroadcastAPI.getUnsubscribeCount();

      console.log("[EmailBroadcastPage] Unsubscribe Count API Response:", res);

      // API returns response.data, so res is already the data object
      if (res && res.success) {
        setUnsubscribeCount(res.data?.count || 0);
      } else if (res && res.count !== undefined) {
        // Direct data format
        setUnsubscribeCount(res.count || 0);
      }
    } catch (err) {
      console.error("Failed to load unsubscribe count:", err);
    }
  };

  const handleEditDraft = (draft) => {
    setEditingDraft(draft);
    setActiveTab("create");
  };

  const tabs = [
    {
      id: "create",
      label: "Create",
      expandedLabel: "Create Email",
      icon: Plus,
    },
    {
      id: "drafts",
      label: "Drafts",
      expandedLabel: "Saved Drafts",
      icon: Archive,
      count: draftCount,
    },
    {
      id: "scheduled",
      label: "Scheduled",
      expandedLabel: "Scheduled Emails",
      icon: Calendar,
      count: scheduledCount,
    },
    {
      id: "history",
      label: "History",
      expandedLabel: "Send History",
      icon: History,
    },
  ];

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#05015A] flex items-center justify-center">
            <Mail size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Broadcast</h1>
            <p className="text-xs text-gray-500">Send emails to shop owners & admins</p>
          </div>
        </div>

        {/* Quota & Unsubscribe Info */}
        <div className="flex items-center gap-4">
          {/* Quota Display */}
          {quota && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div className="text-right">
                <p className="text-xs text-gray-500">Today's Quota</p>
                <p className="text-sm font-semibold text-gray-900">
                  {(quota.remaining || 0).toLocaleString()} / {(quota.limit || 0).toLocaleString()}
                </p>
              </div>
              <div
                className={`w-2 h-8 rounded-full ${
                  (quota.usage_percent || 0) > 90
                    ? "bg-red-500"
                    : (quota.usage_percent || 0) > 70
                    ? "bg-amber-500"
                    : "bg-green-500"
                }`}
              />
            </div>
          )}

          {/* Unsubscribe Button */}
          <button
            onClick={() => setShowUnsubscribeModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users size={16} />
            <span>Unsubscribes</span>
            {unsubscribeCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 rounded-full">
                {unsubscribeCount}
              </span>
            )}
          </button>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id !== "create") setEditingDraft(null);
                    setActiveTab(tab.id);
                  }}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white text-[#05015A] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <tab.icon size={16} className="flex-shrink-0" />
                  <span className="whitespace-nowrap overflow-hidden transition-all duration-200">
                    {isActive ? tab.expandedLabel : tab.label}
                  </span>
                  {tab.count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 text-xs rounded-full flex-shrink-0 ${
                        tab.id === "drafts"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quota Warning */}
      {quota && quota.remaining < 100 && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle size={16} className="text-amber-600" />
          <span className="text-sm text-amber-700">
            Low quota remaining ({quota.remaining} emails). Campaigns may be paused and resumed tomorrow.
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {activeTab === "create" && (
          <CreateEmailForm
            editDraft={editingDraft}
            onSuccess={() => {
              setEditingDraft(null);
              refreshLists();
              loadQuota();
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
            quota={quota}
          />
        )}

        {activeTab === "drafts" && (
          <EmailDraftsList
            refreshTrigger={refreshTrigger}
            onCountChange={setDraftCount}
            onEdit={handleEditDraft}
          />
        )}

        {activeTab === "scheduled" && (
          <EmailScheduledList
            refreshTrigger={refreshTrigger}
            onCountChange={setScheduledCount}
            onCancelled={refreshLists}
          />
        )}

        {activeTab === "history" && (
          <EmailHistoryList
            refreshTrigger={refreshTrigger}
            onRetry={() => {
              refreshLists();
              loadQuota();
            }}
          />
        )}
      </div>

      {/* Unsubscribe Modal */}
      {showUnsubscribeModal && (
        <UnsubscribeListModal
          onClose={() => {
            setShowUnsubscribeModal(false);
            loadUnsubscribeCount();
          }}
        />
      )}
    </div>
  );
};

export default EmailBroadcastPage;