// frontend/src/pages/tickets/TicketsPage.jsx

import { Ticket } from "lucide-react";

const TicketsPage = () => {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Ticket size={40} className="text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Support Tickets</h2>
        <p className="text-gray-600">
          Ticket system interface coming in Phase 2
        </p>
      </div>
    </div>
  );
};

export default TicketsPage;
