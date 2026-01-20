const formatCurrency = (value) => {
  const number = parseFloat(value);
  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
};

module.exports = formatCurrency;
