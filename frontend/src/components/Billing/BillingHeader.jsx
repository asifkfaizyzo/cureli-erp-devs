import { FiSave } from "react-icons/fi";


const BillingHeader = () => {
  return (
    <div className="w-full flex flex-col">

      

      {/* Top row */}
      <div className="flex items-center justify-between">
        
        <div>
          <h1 className="text-[22px] font-bold text-[#000060]">
            Bill No : <span className="font-extrabold">123456</span>
          </h1>

          <div className="mt-3 flex items-center gap-6 text-sm text-gray-600">
            <span>
              Billed by <span className="font-medium text-gray-800">Amith</span>
            </span>

            <span>
              Date :
              <span className="font-medium text-gray-800 px-2 ml-1 py-1 bg-gray-100 rounded">
                12/04/25
              </span>
            </span>

            <span>
              Time :
              <span className="font-medium text-gray-800 px-2 ml-1 py-1 bg-gray-100 rounded">
                12:35 PM
              </span>
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#000060] text-white text-sm px-4 py-2 rounded-lg shadow-sm hover:bg-[#000060d1] transition">
            <FiSave size={14} />
            Save
          </button>

          <button className="bg-[#000060] text-white text-sm px-5 py-2 rounded-lg shadow-sm hover:bg-[#000060d1] transition">
            Save & Print (F5)
          </button>
        </div>

      </div>
    </div>
  );
};

export default BillingHeader;
