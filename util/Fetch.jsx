import { XMLParser } from 'fast-xml-parser';

// Helper to extract price from title
function extractPriceAndTitle(title) {
  // Match price at the end, e.g., $10.96 or $199.99
  const match = title.match(/^(.*?)(\s*\$[\d,.]+)$/);
  if (match) {
    return {
      cleanTitle: match[1].trim(),
      price: match[2].trim(),
    };
  }
  return { cleanTitle: title, price: null };
}

// Fetches and parses TechBargains RSS feed
export async function scrapeTechBargains() {
  const url = 'https://www.techbargains.com/rss.xml';
  try {
    const response = await fetch(url);
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const jsonObj = parser.parse(xmlText);
    const items = jsonObj.rss.channel.item || [];
    // Normalize to array
    const deals = Array.isArray(items) ? items : [items];
    // Extract only the fields we care about, and split price from title
    return deals.map(item => {
      const { cleanTitle, price } = extractPriceAndTitle(item.title);
      return {
        title: cleanTitle,
        price: price,
        link: item.link,
        description: item.description,
        pubDate: item.pubDate,
        vendorname: item.vendorname,
        category: item.category,
        imagelink: item.imagelink,
      };
    });
  } catch (error) {
    console.error('Error fetching TechBargains RSS:', error);
    return [];
  }
}

// Main Fetch function that calls scrapeTechBargains
export async function Fetch() {
  return await scrapeTechBargains();
}
