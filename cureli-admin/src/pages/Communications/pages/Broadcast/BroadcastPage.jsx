// src/pages/Communications/pages/Broadcast/BroadcastPage.jsx

import { Radio, Construction, Bell, Users, Calendar } from "lucide-react";

const BroadcastPage = () => {
  return (
    <div className=" space-y-6 font-poppins">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl 
                        flex items-center justify-center shadow-lg shadow-violet-500/20"
        >
          <Radio className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast</h1>
          <p className="text-sm text-gray-500">
            Send announcements and notifications to users
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mb-6">
            <Construction className="w-10 h-10 text-violet-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Coming Soon
          </h2>
          <p className="text-gray-500 text-center max-w-md mb-8">
            The broadcast feature is under development. You'll be able to send
            push notifications, emails, and in-app messages to your users.
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Bell className="w-5 h-5 text-violet-500" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">
                Push Notifications
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Send instant alerts to mobile apps
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-violet-500" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">
                Targeted Audiences
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Send to specific user segments
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5 text-violet-500" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">
                Schedule Messages
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Plan broadcasts in advance
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastPage;