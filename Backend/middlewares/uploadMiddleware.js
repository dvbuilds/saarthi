import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if(file.mimetype === "application/pdf") {
        cb(null, true);
    } else{
        cb(new Error("Only pdf files are allowed"), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter,
})

export default upload;