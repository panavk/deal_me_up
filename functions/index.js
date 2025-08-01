const functions = require("firebase-functions");
const vision = require("@google-cloud/vision");
const cors = require("cors")({origin: true}); // Allow requests from your app

// Initialize the Vision API client
const client = new vision.ImageAnnotatorClient({
  keyFilename: "./google-vision-key.json",
});

/**
 * Normalizes a string by removing spaces and dashes,
 * and converting to lowercase.
 * @param {string} str - The string to normalize.
 * @return {string} The normalized string.
 */
function normalize(str) {
  return str.replace(/[\s-]+/g, "").toLowerCase();
}

exports.validateDealScreenshot = functions.https.onRequest((req, res) => {
  console.log("Function called with method:", req.method);
  cors(req, res, async () => {
    if (req.method !== "POST") {
      console.log("Method not allowed:", req.method);
      return res.status(405).send("Method Not Allowed");
    }
    console.log("Request body received:", {
      hasBase64Image: !!req.body.base64Image,
      hasTitle: !!req.body.title,
      hasPrice: !!req.body.price,
    });
    const {base64Image, title, price} = req.body;
    if (!base64Image || !title || !price) {
      console.log("Missing required fields");
      return res.status(400).json({error: "Missing required fields."});
    }
    try {
      console.log("Calling Vision API...");
      const [result] = await client.textDetection({
        image: {content: base64Image},
      });
      console.log("Vision API response received");
      const detections = result.textAnnotations;
      const extractedText = detections.length > 0 ?
          detections[0].description : "";

      // Clean up the extracted text - join lines and normalize
      const cleanedText = extractedText.replace(/\n/g, " ").replace(/\s+/g, " ")
          .trim();

      console.log("Extracted text:", extractedText);
      console.log("Cleaned text:", cleanedText);
      console.log("Looking for title:", title);
      console.log("Looking for price:", price);

      // Simple title check - look for the title in the cleaned text
      const titleFound = normalize(cleanedText).includes(normalize(title));

      // Normalize price: remove except numbers and dot, then check for presence
      const priceDigits = price.replace(/[^0-9.]/g, "");
      const textDigits = cleanedText.replace(/[^0-9.]/g, "");
      const priceFound = textDigits.includes(priceDigits);

      console.log("Title found:", titleFound);
      console.log("Price found:", priceFound);
      console.log("Price digits from input:", priceDigits);
      console.log("Price digits from image:", textDigits);

      console.log("Sending response:", {valid: titleFound && priceFound});
      res.json({
        valid: titleFound && priceFound,
        extractedText,
      });
    } catch (error) {
      console.error("Vision API error:", error);
      res.status(500).json({error: "Failed to validate screenshot."});
    }
  });
});
