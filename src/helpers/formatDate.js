const formatDate = (date) => {
  const parsedDate = new Date(date);

  const day = String(parsedDate.getDate()).padStart(2, "0");
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const year = parsedDate.getFullYear();

  return `${year}-${month}-${day}`;
};

module.exports = formatDate;
