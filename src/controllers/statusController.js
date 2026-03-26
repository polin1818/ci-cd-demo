export const getStatus = (req, res) => {
  res.json({
    status: "OK",
    time: new Date().toISOString(),
  });
};