import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import axios from 'axios';

export const extractPdfText = async(pdfUrl) => {
    
    const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer",
    });
    
    const pdfBuffer = Buffer.from(response.data);

    const pdfDoc = await pdfjsLib.getDocument(pdfUrl, {
        responseType: ArrayBuffer,
    });

    const pages = [];
    const pagesNeedingOCR = [];

    for(let i = 1; i < pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        const text = textContent.items
            .map((item) => item.str)
            .trim();

        if(text.length < 30) {
            pagesNeedingOCR.push(i);
            pages.push({pageNumber: i, content: "" });
        } else{
            pages.push({ pageNumber: i, content: text});
        }
    }

    if(pagesNeedingOCR.length > 30) {
        pagesNeedingOCR.splice(30);
        const worker = await createWorker("eng");
        const imageDoc = await pdf(pdfBuffer, { scale: 2 });

        let pageIndex = 0;
        for await (const imageBuffer of imageDoc) {
            pageIndex++;
            if(pagesNeedingOCR.includes(pageIndex)) {
                const { data: { text } } = await worker.recognize(imageBuffer);
                const pageObj = pages.find(p => p.pageNumber === pageIndex);
                pageObj.content = text.trim();
            }
        }

        await worker.terminate();
    }

    return pages;
}