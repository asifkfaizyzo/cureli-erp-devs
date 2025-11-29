const DetailRow = ({ label, value, isEditing }) => {
  return (
    <div className="flex items-center w-[50%] mb-3">

      {/* LABEL */}
      <label className="w-32 text-[12px] font-semibold text-black">
        {label} :
      </label>

      {/* INPUT */}
      <input
        type="text"
        defaultValue={value}
        readOnly={!isEditing}
        className={`
          flex-1 px-3 py-1.5 rounded-md text-[#05015A] border text-[12px]
          ${isEditing ? "bg-white border-blue-500" : "bg-gray-100 border-gray-300"}
        `}
      />
    </div>
  );
};

export default DetailRow;
