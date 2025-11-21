import axios from "axios";
const BASE = "https://cpaas.messagecentral.com";

export async function mcSendOtp({ authToken, customerId, mobileNumber, otpLength = 4, countryCode = "91" }) {
  if (!authToken) throw new Error("MC auth token required");

  const url = `${BASE}/verification/v3/send`;
  const params = {
    customerId,
    mobileNumber,
    flowType: "SMS",
    otpLength,
    countryCode,
  };

  const resp = await axios.post(url, null, {
    params,
    headers: { authToken },
    timeout: 10_000,
  });

  if (resp.status !== 200) throw new Error("mcSendOtp failed");
  return resp.data?.data;
}
