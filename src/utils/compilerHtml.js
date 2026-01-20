const fs = require("fs").promises;
const handlebars = require("handlebars");

const compilerHtml = async (filePath, data) => {
  const template = await fs.readFile(filePath, "utf-8");
  const compiledTemplate = handlebars.compile(template);
  return compiledTemplate(data);
};

module.exports = compilerHtml;
