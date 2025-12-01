const VerificationDetailsTop = ({ user }) => {
  return (
    <div className="grid grid-cols-3 gap-4 text-[12px]">

      <div className="space-y-3">
        <p><b>Shop ID:</b> {user.shopId}</p>
        <p><b>Owner ID:</b> 1323445</p>
        <p><b>Username:</b> ALEX645836</p>
        <p><b>Address:</b> Sunrise Technologies Noida, 201309</p>
      </div>

      <div className="space-y-3">
        <p><b>Busi Name:</b> {user.shopName}</p>
        <p><b>Own Name:</b> {user.ownerName}</p>
        <p><b>GST:</b> 27ABCDE1234A1Z5</p>
        <p>
          <b>Email:</b>{" "}
          <a href={`mailto:${user.email}`} className="text-blue-600 underline">
            {user.email}
          </a>
        </p>
      </div>

      <div className="space-y-3">
        <p><b>Busi Type:</b> Private Limited</p>
        <p><b>Login Provider:</b> Google</p>
        <p><b>Sub Date:</b> {user.date}</p>
        <p><b>Phone:</b> 7035261820</p>
      </div>

    </div>
  );
};

export default VerificationDetailsTop;
