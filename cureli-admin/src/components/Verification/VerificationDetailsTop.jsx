const VerificationDetailsTop = ({ user }) => {
  const dummy = {
    ownerId: "1323445",
    username: "ALEX645836",
    address: "Sunrise Technologies Noida, 201309",
    gst: "27ABCDE1234A1Z5",
    busiType: "Private Limited",
    loginProvider: "Google",
    phone: "7035261820",
  };

  const InputField = ({ label, value }) => (
    <div className="flex flex-col gap-1 group">
      <label className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider group-hover:text-blue-600 transition-colors">{label}</label>
      <div className="w-full border border-slate-200 bg-slate-50 text-slate-700 rounded-md px-3 py-2 text-[13px] font-medium shadow-sm outline-none hover:border-blue-300 transition-colors">
        {value || "N/A"}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
      <div className="col-span-1 md:col-span-2 pb-1 border-b border-slate-100 mb-1">
         <h4 className="text-sm font-semibold text-slate-800">Personal Information</h4>
      </div>

      <InputField label="Shop Name" value={user.shopName} />
      <InputField label="Owner Name" value={user.ownerName} />
      <InputField label="Email Address" value={user.email} />
      <InputField label="Phone Number" value={dummy.phone} />
      <InputField label="Shop ID" value={user.shopId} />
      <InputField label="Username" value={dummy.username} />
      <InputField label="GST Number" value={dummy.gst} />
      <InputField label="Business Type" value={dummy.busiType} />
      <InputField label="Address" value={dummy.address} />
      <InputField label="Subscription Date" value={user.date} />
    </div>
  );
};

export default VerificationDetailsTop;