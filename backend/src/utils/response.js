export function success(res, data = {}, message = "OK", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function fail(res, message = "Bad Request", status = 400, data = {}) {
  return res.status(status).json({ success: false, message, data });
}
