import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if(file.mimetype === "application/pdf") {
        cb(null, true);
    } else{
        const err = new Error("Only PDF files are allowed.");
        // Explicitly marks this as a hand-written, user-safe message so
        // the global error handler (server.js) can forward it as-is
        // instead of falling back to a generic message — without having
        // to guess "is this message safe?" from arbitrary error text.
        err.expose = true;
        err.status = 400;
        cb(err, false);
    }
};

const upload = multer({
    storage,
    limits: {
        // 30MB — a 300-page text-based PDF is typically well under this,
        // but a scanned/image-heavy 300-page PDF can exceed the previous
        // 10MB limit and get rejected before it ever reaches extraction.
        fileSize: 30 * 1024 * 1024,
    },
    fileFilter,
})

export default upload;