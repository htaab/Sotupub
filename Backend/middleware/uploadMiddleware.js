import multer from "multer";
import path from "path";
import fs from "fs";

// Create necessary directories
const uploadsDir = path.join(process.cwd(), "uploads");
const userUploadsDir = path.join(uploadsDir, "users");
const documentsDir = path.join(uploadsDir, "documents");
const productsDir = path.join(uploadsDir, "products");

[uploadsDir, userUploadsDir, documentsDir, productsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Choose destination based on file type
    if (req.originalUrl.includes("/products")) {
      cb(null, productsDir);
    } else if (req.originalUrl.includes("/users")) {
      cb(null, userUploadsDir);
    } else {
      cb(null, documentsDir);
    }
  },
  filename: (req, file, cb) => {
    const originalName = path
      .parse(file.originalname)
      .name.replace(/[^a-zA-Z0-9]/g, "");
    const timestamp = Date.now();
    const uniqueSuffix = Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname).toLowerCase();

    // Determine prefix based on route
    let prefix = "doc";
    if (req.originalUrl.includes("/products")) {
      prefix = "product";
    } else if (req.originalUrl.includes("/users")) {
      prefix = "profile";
    }
    cb(
      null,
      `${prefix}-${originalName}-${timestamp}-${uniqueSuffix}${extension}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "image") {
    // Image files validation
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Only .png, .jpg, .jpeg, .gif and .webp formats are allowed for images"
        ),
        false
      );
    }
  } else {
    // Document files validation
    const allowedDocTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowedDocTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          "Invalid file type. Allowed types: images, PDF, Word, and Excel documents"
        ),
        false
      );
    }
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size cannot exceed 10MB",
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};
