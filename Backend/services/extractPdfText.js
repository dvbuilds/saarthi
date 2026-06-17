import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import axios from 'axios';

export const extractPdfText = async(pdfUrl) => {
    
    const response = await axios.get(pdfUrl, {
        responseType: "arraybuffer",
    });
    
    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(response.data),
    }).promise;

    const pages = [];

    for(let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const text = textContent.items
            .map((item) => item.str)
            .join(" ");

        pages.push({
            pageNumber: i,
            content: text,
        });
    }

    return pages;
}