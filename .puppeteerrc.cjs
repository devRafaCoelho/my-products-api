const { join } = require('path');

/**
 * Configuração do Puppeteer para deploy na Render.
 * O cache fica dentro do projeto para persistir entre build e runtime.
 */
module.exports = {
  cacheDirectory: join(__dirname, 'node_modules', '.cache', 'puppeteer'),
};
