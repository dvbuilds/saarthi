import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import axios from 'axios';
import { createWorker } from "tesseract.js";
import { createCanvas } from "canvas";

// Custom canvas factory required by pdfjs-dist in Node environment
class NodeCanvasFactory {
    create(width, height) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");
        return { canvas, context };
    }
    reset(canvasAndContext, width, height) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
}

export const extractPdfText = async (pdfUrl) => {

    const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer",
    });

    const pdfBuffer = Buffer.from(response.data);

    const canvasFactory = new NodeCanvasFactory();

    const pdfDoc = await pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        canvasFactory, // ✅ pass it here
    }).promise;

    console.log(`PDF has ${pdfDoc.numPages} pages`);

    const pages = [];
    const pagesNeedingOCR = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        const text = textContent.items
            .map((item) => item.str)
            .join(" ")
            .trim();

        console.log(`Page ${i}: extracted ${text.length} chars normally`);

        if (text.length < 30) {
            pagesNeedingOCR.push(i);
            pages.push({ pageNumber: i, content: "" });
        } else {
            pages.push({ pageNumber: i, content: text });
        }
    }

    console.log(`Pages needing OCR: ${pagesNeedingOCR.join(", ")}`);

    if (pagesNeedingOCR.length > 0) {
        const worker = await createWorker("eng");

        for (const pageNum of pagesNeedingOCR) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2 });

            const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

            await page.render({
                canvasContext: canvasAndContext.context,
                viewport,
                canvasFactory, // ✅ pass it here too
            }).promise;

            const imageBuffer = canvasAndContext.canvas.toBuffer("image/png");

            console.log(`OCR processing page ${pageNum}`);
            const { data: { text } } = await worker.recognize(imageBuffer);
            console.log(`OCR result for page ${pageNum}: ${text.length} chars`);

            const pageObj = pages.find(p => p.pageNumber === pageNum);
            pageObj.content = text.trim();

            canvasFactory.destroy(canvasAndContext);
        }

        await worker.terminate();
    }

    return pages;
};