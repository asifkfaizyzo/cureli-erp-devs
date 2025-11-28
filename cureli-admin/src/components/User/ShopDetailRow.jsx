const ShopDetailRow = ({ label, value, isEditing }) => {
  return (
    <div className="flex items-center gap-4 w-[50%]">

      {/* LABEL */}
      <label className="w-30 text-[12px] font-semibold text-black">
        {label} :
      </label>

      {/* INPUT */}
      <input
        type="text"
        defaultValue={value}
        readOnly={!isEditing}
        className={`
          flex-1 px-3 py-2 rounded-md border text-[#05015A] text-[12px]
          ${isEditing ? "bg-white border-blue-500" : "bg-gray-100 border-gray-300"}
        `}
      />
    </div>
  );
};

export default ShopDetailRow;
