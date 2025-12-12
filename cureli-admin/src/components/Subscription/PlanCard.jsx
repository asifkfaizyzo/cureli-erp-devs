//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\cureli-admin\src\components\Subscription\PlanCard.jsx
import { Pencil } from "lucide-react";

const PlanCard = ({ plan, onEdit, onToggle }) => {
  return (
    <div
      className="
        group
        h-full flex flex-col justify-between relative rounded-xl p-6 shadow-md
        bg-gradient-to-b from-[#afccf4] to-[#e7e9ec]
        transition-all duration-300
        hover:from-[#05015A] hover:to-[#05015A]
      "
    >
      {/* Edit Button */}
      <button
        className="
          absolute top-4 right-4 
          bg-white text-[#05015A]
          p-2 rounded-full shadow
          transition-all
          group-hover:bg-white group-hover:text-[#05015A]
        "
        onClick={() => onEdit(plan)}
      >
        <Pencil size={16} />
      </button>

      {/* Top Section */}
      <div>
        <h2 className="text-xl font-semibold mb-3 group-hover:text-white">
          {plan.name}
        </h2>

        <div className="flex items-end gap-1 mb-2">
          <span className="text-2xl font-bold group-hover:text-white">
            ₹ {plan.price}
          </span>
          <span className="text-gray-600 group-hover:text-white/70">
            {plan.duration}
          </span>
        </div>

        <p className="text-sm mb-4 text-gray-600 group-hover:text-white/70">
          {plan.description}
        </p>

        <div className="h-[1px] w-full mb-4 bg-gray-300 group-hover:bg-white/40"></div>
      </div>

      {/* Features */}
      <div className="flex-1">
        <ul className="space-y-2 text-sm">
          {plan.features.map((feat, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-[#6A5ACD] group-hover:text-white">✔</span>
              <span className="text-gray-700 group-hover:text-white">
                {feat}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => onToggle(plan.id)}
        className={`
          mt-6 w-full py-2 rounded-lg text-sm font-medium transition-all

          ${plan.active
            ? "bg-white text-[#05015A] group-hover:bg-white group-hover:text-[#05015A]"
            : "bg-[#05015A] text-white group-hover:bg-white group-hover:text-[#05015A]"
          }
        `}
      >
        {plan.active ? "Suspend Plan" : "Activate Plan"}
      </button>
    </div>
  );
};

export default PlanCard;
