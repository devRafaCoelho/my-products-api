const axios = require("axios");
const { JSDOM } = require("jsdom");
const xml2js = require("xml2js");
const puppeteer = require("puppeteer");
const soap = require("soap");

class NfceController {
  parseNFCeUrl(qrCodeUrl) {
    try {
      const url = new URL(qrCodeUrl);
      const params = url.searchParams.get("p");

      if (!params) {
        throw new Error(
          "URL do QR Code inválida - parâmetro 'p' não encontrado"
        );
      }

      // Os parâmetros vêm separados por |
      const parts = params.split("|");

      if (parts.length < 4) {
        throw new Error(
          `Formato de QR Code inválido - esperado pelo menos 4 partes, encontrado ${parts.length}`
        );
      }

      return {
        chave: parts[0],
        versao: parts[1],
        ambiente: parts[2],
        fullParams: params,
      };
    } catch (error) {
      throw new Error("Erro ao processar URL do QR Code: " + error.message);
    }
  }

  parseProductsFromText(htmlContent) {
    const products = [];
    let text = "";
    
    try {
      const dom = new JSDOM(htmlContent);
      const doc = dom.window.document;
      const scripts = doc.querySelectorAll("script, style");
      scripts.forEach(el => el.remove());
      
      const body = doc.body;
      if (body) {
        text = body.textContent || body.innerText || "";
      } else {
        text = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/div>/gi, "\n")
          .replace(/<\/tr>/gi, "\n")
          .replace(/<\/td>/gi, " ")
          .replace(/<\/p>/gi, "\n")
          .replace(/<\/li>/gi, "\n")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/gi, " ")
          .replace(/&[a-z]+;/gi, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
    } catch (error) {
      text = htmlContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/div>/gi, "\n")
        .replace(/<\/tr>/gi, "\n")
        .replace(/<\/td>/gi, " ")
        .replace(/<\/p>/gi, "\n")
        .replace(/<\/li>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&[a-z]+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    const pricePattern = /(?:VI\.\s*Unit\.|VI\.\s*Total|R\$)\s*:?\s*(\d+[.,]\d{2})/i;
    const quantityPattern = /Qtde\.\s*:?\s*(\d+)/i;
    const codePattern = /\(Código:\s*(\d+)\)/i;

    let productBlocks = text.split(/(?=Qtde\.|VI\.\s*Unit\.|VI\.\s*Total|\(Código:)/i);
    
    if (productBlocks.length < 3) {
      productBlocks = text.split(/(?=\d+[.,]\d{2})/);
    }

    for (const block of productBlocks) {
      const blockText = block.trim();
      
      if (blockText.length < 10) continue;
      
      if (
        blockText.match(
          /^(total|subtotal|desconto|imposto|cnpj|cpf|nota fiscal|chave|tributo|icms|ipi|descri|produto|valor\s*unit|valor\s*total)/i
        ) && !blockText.match(/\d+[.,]\d{2}/)
      ) {
        continue;
      }

      const unitPriceMatch = blockText.match(/VI\.\s*Unit\.\s*:?\s*(\d+[.,]\d{2})/i);
      const totalPriceMatch = blockText.match(/VI\.\s*Total\s*:?\s*(\d+[.,]\d{2})/i);
      const simplePriceMatch = blockText.match(/R\$\s*(\d+[.,]\d{2})/);

      const priceMatch = unitPriceMatch || totalPriceMatch || simplePriceMatch;
      
      if (!priceMatch) continue;

      const price = parseFloat(priceMatch[1].replace(",", "."));
      const quantityMatch = blockText.match(quantityPattern);
      const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
      const codeMatch = blockText.match(codePattern);
      const productCode = codeMatch ? codeMatch[1] : null;

      let name = blockText
        .replace(/VI\.\s*Unit\.\s*:?\s*\d+[.,]\d{2}/gi, "")
        .replace(/VI\.\s*Total\s*:?\s*\d+[.,]\d{2}/gi, "")
        .replace(/R\$\s*\d+[.,]\d{2}/g, "")
        .replace(/Qtde\.\s*:?\s*\d+/gi, "")
        .replace(/UN\s*:?\s*UN/gi, "")
        .replace(/\(Código:\s*\d+\)/gi, "")
        .replace(/\d+/g, "")
        .replace(/[|]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (name.length < 3) {
        const beforePatterns = blockText.split(/(?:Qtde\.|VI\.|\(Código:)/i)[0];
        name = beforePatterns
          .replace(/\d+/g, "")
          .replace(/[|]/g, "")
          .replace(/\s+/g, " ")
          .trim();
      }

      name = name.substring(0, 200).trim();

      if (name.length > 2 && price > 0) {
        products.push({
          name: name || "Produto sem nome",
          description: productCode ? `Código: ${productCode}` : "",
          price: price,
          stock: quantity,
          expiration_date: null,
          category: "Outros",
        });
      }
    }

    return products;
  }

  parseNFCeResponse(htmlContent) {
    const products = [];

    try {
      const dom = new JSDOM(htmlContent);
      const doc = dom.window.document;

      const isSynthetic =
        htmlContent.includes("Sintetico") ||
        htmlContent.includes("sintético") ||
        doc.body?.textContent?.includes("Sintetico");

      if (isSynthetic) {
        return this.parseProductsFromText(htmlContent);
      }

      let productRows = doc.querySelectorAll("table tr");

      if (productRows.length === 0) {
        productRows = doc.querySelectorAll(
          ".produto, .item-produto, [class*='produto'], [class*='item'], " +
            "[id*='produto'], [id*='item'], .linhaProduto, tr[class*='Item']"
        );
      }

      if (productRows.length === 0) {
        productRows = doc.querySelectorAll(
          "div[class*='produto'], div[class*='item']"
        );
      }

      if (productRows.length === 0) {
        const allRows = doc.querySelectorAll("tr");
        productRows = Array.from(allRows).filter((row) => {
          const text = row.textContent || "";
          return (
            (text.match(/VI\.\s*Unit\.|VI\.\s*Total|R\$\s*\d+[.,]\d{2}/i) ||
             text.match(/\d+[.,]\d{2}/)) &&
            !text.match(/^(descri|produto|valor|total|subtotal|imposto|chave|cnpj|cpf)/i) &&
            text.length > 20
          );
        });
      }

      if (productRows.length === 0) {
        const allElements = doc.querySelectorAll("div, span, p, li, td");
        productRows = Array.from(allElements).filter((el) => {
          const text = el.textContent || "";
          return (
            text.match(/Qtde\.\s*:?\s*\d+/i) &&
            (text.match(/VI\.\s*Unit\.|VI\.\s*Total|R\$\s*\d+[.,]\d{2}/i) ||
             text.match(/\d+[.,]\d{2}/)) &&
            text.length > 30 &&
            !text.match(/^(descri|produto|valor|total|subtotal|imposto|chave)/i)
          );
        });
      }

      if (productRows.length === 0) {
        return this.parseProductsFromText(htmlContent);
      }

      productRows.forEach((row) => {
        const cells = row.querySelectorAll("td, th");
        const textContent = row.textContent || "";

        if (cells.length < 2) return;

        if (
          textContent.match(
            /descri|produto|valor|total|subtotal|imposto|chave|cnpj|cpf/i
          ) &&
          !textContent.match(/\d+[.,]\d{2}/) &&
          cells.length <= 3
        ) {
          return;
        }

        const unitPriceMatch = textContent.match(/VI\.\s*Unit\.\s*:?\s*(\d+[.,]\d{2})/i);
        const totalPriceMatch = textContent.match(/VI\.\s*Total\s*:?\s*(\d+[.,]\d{2})/i);
        const simplePriceMatch = textContent.match(/R\$\s*(\d+[.,]\d{2})/);
        const priceMatch = unitPriceMatch || totalPriceMatch || simplePriceMatch;

        const quantityMatch = textContent.match(/Qtde\.\s*:?\s*(\d+)/i) ||
                              textContent.match(/(\d+)\s*(?:x|un|unid|kg|g|ml|l)/i);
        
        const codeMatch = textContent.match(/\(Código:\s*(\d+)\)/i);

        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(",", "."));
          const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
          const productCode = codeMatch ? codeMatch[1] : null;

          let name = textContent
            .replace(/VI\.\s*Unit\.\s*:?\s*\d+[.,]\d{2}/gi, "")
            .replace(/VI\.\s*Total\s*:?\s*\d+[.,]\d{2}/gi, "")
            .replace(/R\$\s*\d+[.,]\d{2}/g, "")
            .replace(/Qtde\.\s*:?\s*\d+/gi, "")
            .replace(/UN\s*:?\s*UN/gi, "")
            .replace(/\(Código:\s*\d+\)/gi, "")
            .replace(/\d+\s*(?:x|un|unid|kg|g|ml|l)/gi, "")
            .replace(/\d+/g, "")
            .replace(/[|]/g, "")
            .replace(/\s+/g, " ")
            .trim();

          if (cells.length >= 2 && name.length < 5) {
            const nameCell = cells[0] || cells[1];
            if (nameCell) {
              const cellText = nameCell.textContent || "";
              if (cellText.length > name.length) {
                name = cellText
                  .replace(/VI\.\s*Unit\.\s*:?\s*\d+[.,]\d{2}/gi, "")
                  .replace(/VI\.\s*Total\s*:?\s*\d+[.,]\d{2}/gi, "")
                  .replace(/R\$\s*\d+[.,]\d{2}/g, "")
                  .replace(/Qtde\.\s*:?\s*\d+/gi, "")
                  .replace(/\(Código:\s*\d+\)/gi, "")
                  .replace(/\d+/g, "")
                  .replace(/\s+/g, " ")
                  .trim();
              }
            }
          }

          if (name.length < 3) {
            const beforePatterns = textContent.split(/(?:Qtde\.|VI\.|\(Código:)/i)[0];
            name = beforePatterns
              .replace(/\d+/g, "")
              .replace(/[|]/g, "")
              .replace(/\s+/g, " ")
              .trim();
          }

          if (name.length > 2 && price > 0) {
            products.push({
              name: name.substring(0, 200) || "Produto sem nome",
              description: productCode ? `Código: ${productCode}` : "",
              price: price,
              stock: quantity,
              expiration_date: null,
              category: "Outros",
            });
          }
        }
      });

      if (products.length === 0) {
        return this.parseProductsFromText(htmlContent);
      }

      return products;
    } catch (error) {
      console.error("Erro ao processar resposta da SEFAZ:", error);
      return this.parseProductsFromText(htmlContent);
    }
  }

  async consultNFCeViaSOAP(chaveAcesso) {
    try {
      const wsUrls = [
        `https://nfe.sefaz.ba.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx?wsdl`,
        `https://hnfe.sefaz.ba.gov.br/webservices/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx?wsdl`,
      ];

      const soapRequest = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <nfeConsultaNF xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">
      <nfeDadosMsg>
        <consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
          <tpAmb>1</tpAmb>
          <xServ>CONSULTAR</xServ>
          <chNFe>${chaveAcesso}</chNFe>
        </consSitNFe>
      </nfeDadosMsg>
    </nfeConsultaNF>
  </soap12:Body>
</soap12:Envelope>`;

      for (const wsUrl of wsUrls) {
        try {
          const response = await axios.post(wsUrl.replace('?wsdl', ''), soapRequest, {
            headers: {
              'Content-Type': 'application/soap+xml; charset=utf-8',
              'SOAPAction': 'http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF',
            },
            timeout: 30000,
            responseType: 'text',
          });

          const xmlResponse = response.data;
          
          if (xmlResponse && (xmlResponse.includes('<?xml') || xmlResponse.includes('<nfeProc'))) {
            let nfeXml = xmlResponse;
            const nfeProcMatch = xmlResponse.match(/<nfeProc[^>]*>[\s\S]*<\/nfeProc>/i);
            if (nfeProcMatch) {
              nfeXml = nfeProcMatch[0];
            }
            
            const products = await this.parseNFCeXML(nfeXml);
            if (products && products.length > 0) {
              return products;
            }
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error("Erro ao consultar via SOAP:", error);
      return null;
    }
  }

  async consultNFCeXML(chaveAcesso) {
    try {
      if (chaveAcesso.length !== 44) {
        return null;
      }

      const xmlUrls = [
        `https://www.nfce.fazenda.gov.br/portal/consulta?p=${chaveAcesso}`,
        `http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx?p=${chaveAcesso}`,
        `https://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx?p=${chaveAcesso}`,
        `https://www.nfce.fazenda.gov.br/portal/consulta?p=${chaveAcesso}&tipo=xml`,
      ];

      for (const xmlUrl of xmlUrls) {
        try {
          const response = await axios.get(xmlUrl, {
            headers: {
              Accept: "application/xml, text/xml, application/json, */*",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept-Language": "pt-BR,pt;q=0.9",
            },
            timeout: 15000,
            responseType: "text",
            validateStatus: function (status) {
              return status >= 200 && status < 400;
            },
          });

          const content = response.data;
          
          if (content && (content.trim().startsWith("<?xml") || content.trim().startsWith("<"))) {
            if (!content.includes("<html") && !content.includes("<!DOCTYPE html")) {
              const products = await this.parseNFCeXML(content);
              if (products && products.length > 0) {
                return products;
              }
            }
          }
        } catch (error) {
          continue;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async parseNFCeXML(xmlContent) {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        mergeAttrs: true,
        explicitRoot: false,
      });

      const result = await parser.parseStringPromise(xmlContent);
      const products = [];
      let detItems = [];
      
      if (result.NFe && result.NFe.infNFe && result.NFe.infNFe.det) {
        detItems = Array.isArray(result.NFe.infNFe.det) 
          ? result.NFe.infNFe.det 
          : [result.NFe.infNFe.det];
      } else if (result.infNFe && result.infNFe.det) {
        detItems = Array.isArray(result.infNFe.det) 
          ? result.infNFe.det 
          : [result.infNFe.det];
      } else if (result.det) {
        detItems = Array.isArray(result.det) ? result.det : [result.det];
      }

      for (const det of detItems) {
        try {
          const prod = det.prod || {};
          const name = prod.xProd || prod.desc || "Produto sem nome";
          const description = prod.xProd || "";
          const price = parseFloat(prod.vProd || prod.vUnCom || "0");
          const quantity = parseFloat(prod.qCom || prod.qTrib || "1");
          const code = prod.cProd || prod.cEAN || null;

          if (name && price > 0) {
            products.push({
              name: name.substring(0, 200),
              description: code ? `Código: ${code}` : description.substring(0, 500),
              price: price,
              stock: Math.round(quantity),
              expiration_date: null,
              category: "Outros",
            });
          }
        } catch (error) {
          continue;
        }
      }

      return products;
    } catch (error) {
      console.error("Erro ao fazer parsing do XML:", error);
      return [];
    }
  }

  async consultNFCeWithPuppeteer(qrCodeUrl) {
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      await page.goto(qrCodeUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await page.waitForTimeout(3000);

      const products = await page.evaluate(() => {
        const productList = [];
        const allElements = document.querySelectorAll('*');
        
        for (const el of allElements) {
          const text = el.textContent || '';
          const hasQtde = /Qtde\.\s*:?\s*\d+/i.test(text);
          const hasPrice = /VI\.\s*Unit\.|VI\.\s*Total|\d+[.,]\d{2}/i.test(text);
          const hasProductName = text.length > 10 && text.length < 200;
          
          if (hasQtde && hasPrice && hasProductName) {
            const children = el.querySelectorAll('*');
            let hasSimilarChildren = false;
            
            for (const child of children) {
              const childText = child.textContent || '';
              if (/Qtde\.\s*:?\s*\d+/i.test(childText) && /VI\.\s*Unit\.|VI\.\s*Total|\d+[.,]\d{2}/i.test(childText)) {
                hasSimilarChildren = true;
                break;
              }
            }
            
            if (!hasSimilarChildren) {
              const unitPriceMatch = text.match(/VI\.\s*Unit\.\s*:?\s*(\d+[.,]\d{2})/i);
              const totalPriceMatch = text.match(/VI\.\s*Total\s*:?\s*(\d+[.,]\d{2})/i);
              const simplePriceMatch = text.match(/(\d+[.,]\d{2})/);
              
              const priceMatch = unitPriceMatch || totalPriceMatch || simplePriceMatch;
              const quantityMatch = text.match(/Qtde\.\s*:?\s*(\d+)/i);
              const codeMatch = text.match(/\(Código:\s*(\d+)\)/i);
              
              if (priceMatch) {
                const price = parseFloat(priceMatch[1].replace(',', '.'));
                const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
                const code = codeMatch ? codeMatch[1] : null;
                
                let name = text
                  .replace(/VI\.\s*Unit\.\s*:?\s*\d+[.,]\d{2}/gi, '')
                  .replace(/VI\.\s*Total\s*:?\s*\d+[.,]\d{2}/gi, '')
                  .replace(/Qtde\.\s*:?\s*\d+/gi, '')
                  .replace(/UN\s*:?\s*UN/gi, '')
                  .replace(/\(Código:\s*\d+\)/gi, '')
                  .replace(/\d+[.,]\d{2}/g, '')
                  .replace(/\d+/g, '')
                  .replace(/\s+/g, ' ')
                  .trim();
                
                if (name.length < 5) {
                  const beforePatterns = text.split(/(?:Qtde\.|VI\.|\(Código:)/i)[0];
                  name = beforePatterns
                    .replace(/\d+/g, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                }
                
                if (name.length > 2 && price > 0) {
                  const isDuplicate = productList.some(p => 
                    Math.abs(p.price - price) < 0.01 && 
                    p.name.toLowerCase().includes(name.toLowerCase().substring(0, 10))
                  );
                  
                  if (!isDuplicate) {
                    productList.push({
                      name: name.substring(0, 200),
                      description: code ? `Código: ${code}` : '',
                      price: price,
                      stock: quantity,
                      expiration_date: null,
                      category: 'Outros',
                    });
                  }
                }
              }
            }
          }
        }
        
        return productList;
      });

      if (products.length > 0) {
        return products;
      }

      const tableProducts = await page.evaluate(() => {
        const products = [];
        const rows = document.querySelectorAll('table tr, tr');
        
        for (const row of rows) {
          const text = row.textContent || '';
          if (/Qtde\.\s*:?\s*\d+/i.test(text) && /\d+[.,]\d{2}/.test(text)) {
            const cells = row.querySelectorAll('td, th');
            if (cells.length >= 2) {
              const cellTexts = Array.from(cells).map(c => c.textContent || '').join(' ');
              
              const priceMatch = cellTexts.match(/(\d+[.,]\d{2})/);
              const quantityMatch = cellTexts.match(/Qtde\.\s*:?\s*(\d+)/i);
              
              if (priceMatch) {
                const price = parseFloat(priceMatch[1].replace(',', '.'));
                const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
                
                let name = cellTexts
                  .replace(/\d+[.,]\d{2}/g, '')
                  .replace(/Qtde\.\s*:?\s*\d+/gi, '')
                  .replace(/UN\s*:?\s*UN/gi, '')
                  .replace(/\(Código:\s*\d+\)/gi, '')
                  .replace(/\d+/g, '')
                  .trim();
                
                if (name.length > 2 && price > 0) {
                  products.push({
                    name: name.substring(0, 200),
                    description: '',
                    price: price,
                    stock: quantity,
                    expiration_date: null,
                    category: 'Outros',
                  });
                }
              }
            }
          }
        }
        
        return products;
      });

      if (tableProducts.length > 0) {
        return tableProducts;
      }

      return [];
    } catch (error) {
      console.error("Erro ao usar Puppeteer:", error);
      return null;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async consultNFCe(qrCodeUrl) {
    try {
      // Normaliza a URL se necessário
      let urlToUse = qrCodeUrl;
      if (!urlToUse.match(/^https?:\/\//i)) {
        urlToUse = `https://${urlToUse}`;
      }

      const nfceParams = this.parseNFCeUrl(qrCodeUrl);

      const soapProducts = await this.consultNFCeViaSOAP(nfceParams.chave);
      if (soapProducts && soapProducts.length > 0) {
        return soapProducts;
      }

      const xmlProducts = await this.consultNFCeXML(nfceParams.chave);
      if (xmlProducts && xmlProducts.length > 0) {
        return xmlProducts;
      }

      const puppeteerProducts = await this.consultNFCeWithPuppeteer(qrCodeUrl);
      if (puppeteerProducts && puppeteerProducts.length > 0) {
        return puppeteerProducts;
      }

      const response = await axios.get(urlToUse, {
        headers: {
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        timeout: 20000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        },
      });

      const htmlContent = response.data;

      if (urlToUse.includes("sefaz.ba.gov.br") || urlToUse.includes("nfe.sefaz.ba.gov.br")) {
        const danfeUrls = [
          `http://nfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_danfe.aspx?p=${nfceParams.fullParams}`,
          `https://nfe.sefaz.ba.gov.br/servicos/nfce/Modulos/Geral/NFCEC_consulta_danfe.aspx?p=${nfceParams.fullParams}`,
          `http://nfe.sefaz.ba.gov.br/servicos/nfce/qrcode.aspx?p=${nfceParams.fullParams}`,
        ];

        for (const danfeUrl of danfeUrls) {
          try {
            const danfeResponse = await axios.get(danfeUrl, {
              headers: {
                Accept:
                  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
              },
              timeout: 20000,
              maxRedirects: 5,
            });
            
            const danfeProducts = this.parseNFCeResponse(danfeResponse.data);
            if (danfeProducts.length > 0) {
              return danfeProducts;
            }
          } catch (danfeError) {
            continue;
          }
        }
      }

      return this.parseNFCeResponse(htmlContent);
    } catch (error) {
      console.error("Erro ao consultar NFCe:", error);
      throw error;
    }
  }

  async consult(req, res) {
    try {
      const { qrCodeUrl } = req.body;

      if (!qrCodeUrl) {
        return res.status(400).json({
          message: "URL do QR Code é obrigatória",
        });
      }

      // Valida se é uma URL de nota fiscal
      if (
        !qrCodeUrl.includes("sefaz") &&
        !qrCodeUrl.includes("nfce") &&
        !qrCodeUrl.includes("nfe")
      ) {
        return res.status(400).json({
          message: "URL não é de uma nota fiscal válida",
        });
      }

      const products = await this.consultNFCe(qrCodeUrl);

      if (products.length === 0) {
        return res.status(404).json({
          message: "Nenhum produto encontrado na nota fiscal",
        });
      }

      res.status(200).json(products);
    } catch (error) {
      console.error("Erro ao consultar NFCe:", error);
      res.status(500).json({
        message:
          error.message ||
          "Erro ao consultar nota fiscal. Verifique se o QR Code é válido.",
      });
    }
  }
}

module.exports = NfceController;
