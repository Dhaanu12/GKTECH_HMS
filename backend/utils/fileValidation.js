/**
 * File Validation Utility
 * Validates file types using magic bytes (file signatures)
 */

// Magic byte signatures for common file types
const FILE_SIGNATURES = {
    // Images
    'image/jpeg': [
        [0xFF, 0xD8, 0xFF, 0xE0],
        [0xFF, 0xD8, 0xFF, 0xE1],
        [0xFF, 0xD8, 0xFF, 0xE2],
        [0xFF, 0xD8, 0xFF, 0xE3],
        [0xFF, 0xD8, 0xFF, 0xE8],
        [0xFF, 0xD8, 0xFF, 0xDB],
        [0xFF, 0xD8, 0xFF, 0xEE]
    ],
    'image/png': [
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    ],
    'image/gif': [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
    ],
    'image/webp': [
        [0x52, 0x49, 0x46, 0x46] // RIFF (WebP starts with RIFF)
    ],
    'image/bmp': [
        [0x42, 0x4D]
    ],
    'image/tiff': [
        [0x49, 0x49, 0x2A, 0x00], // Little endian
        [0x4D, 0x4D, 0x00, 0x2A]  // Big endian
    ],
    // Documents
    'application/pdf': [
        [0x25, 0x50, 0x44, 0x46] // %PDF
    ],
    // DICOM medical imaging
    'application/dicom': [
        [0x44, 0x49, 0x43, 0x4D] // DICM (at offset 128)
    ]
};

// Allowed MIME types for patient documents
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'application/pdf',
    'application/dicom'
];

// Maximum file size (20 MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Check if a buffer starts with any of the given signatures
 * @param {Buffer} buffer - File buffer
 * @param {Array} signatures - Array of signature byte arrays
 * @returns {boolean}
 */
function matchesSignature(buffer, signatures) {
    for (const sig of signatures) {
        let matches = true;
        for (let i = 0; i < sig.length; i++) {
            if (buffer[i] !== sig[i]) {
                matches = false;
                break;
            }
        }
        if (matches) return true;
    }
    return false;
}

/**
 * Detect MIME type from file buffer using magic bytes
 * @param {Buffer} buffer - File buffer
 * @returns {string|null} Detected MIME type or null
 */
function detectMimeType(buffer) {
    if (!buffer || buffer.length < 8) {
        return null;
    }
    
    // Special case for DICOM - signature at offset 128
    if (buffer.length > 132) {
        const dicomCheck = buffer.slice(128, 132);
        if (dicomCheck.toString() === 'DICM') {
            return 'application/dicom';
        }
    }
    
    // Check other signatures
    for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
        if (mimeType === 'application/dicom') continue; // Already checked
        if (matchesSignature(buffer, signatures)) {
            return mimeType;
        }
    }
    
    return null;
}

/**
 * Validate a file for upload
 * @param {Buffer} fileBuffer - The file data
 * @param {string} claimedMimeType - The MIME type claimed by the client
 * @param {string} fileName - Original file name
 * @returns {Object} { valid: boolean, error: string|null, detectedType: string|null }
 */
function validateFile(fileBuffer, claimedMimeType, fileName) {
    // Check file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024} MB)`,
            detectedType: null
        };
    }
    
    // Check if claimed MIME type is allowed
    if (!ALLOWED_MIME_TYPES.includes(claimedMimeType)) {
        return {
            valid: false,
            error: `File type '${claimedMimeType}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
            detectedType: null
        };
    }
    
    // Detect actual MIME type from magic bytes
    const detectedType = detectMimeType(fileBuffer);
    
    if (!detectedType) {
        return {
            valid: false,
            error: 'Could not verify file type. File may be corrupted or unsupported.',
            detectedType: null
        };
    }
    
    // Check if detected type matches claimed type (allow some flexibility)
    const isMatch = detectedType === claimedMimeType || 
        (claimedMimeType.startsWith('image/') && detectedType.startsWith('image/'));
    
    if (!isMatch) {
        return {
            valid: false,
            error: `File content does not match claimed type. Claimed: ${claimedMimeType}, Detected: ${detectedType}`,
            detectedType
        };
    }
    
    // Validate file extension matches
    const extension = fileName.split('.').pop()?.toLowerCase();
    const validExtensions = getValidExtensions(detectedType);
    
    if (extension && !validExtensions.includes(extension)) {
        return {
            valid: false,
            error: `File extension '.${extension}' does not match detected type '${detectedType}'`,
            detectedType
        };
    }
    
    return {
        valid: true,
        error: null,
        detectedType
    };
}

/**
 * Get valid file extensions for a MIME type
 * @param {string} mimeType 
 * @returns {Array<string>}
 */
function getValidExtensions(mimeType) {
    const extensionMap = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'image/gif': ['gif'],
        'image/webp': ['webp'],
        'image/bmp': ['bmp'],
        'image/tiff': ['tif', 'tiff'],
        'application/pdf': ['pdf'],
        'application/dicom': ['dcm', 'dicom']
    };
    return extensionMap[mimeType] || [];
}

/**
 * Sanitize file name to prevent path traversal and other issues
 * @param {string} fileName - Original file name
 * @returns {string} Sanitized file name
 */
function sanitizeFileName(fileName) {
    // Remove path separators and null bytes
    let sanitized = fileName.replace(/[\/\\:\*\?"<>\|]/g, '_');
    sanitized = sanitized.replace(/\0/g, '');
    
    // Remove leading dots (hidden files)
    sanitized = sanitized.replace(/^\.+/, '');
    
    // Limit length
    if (sanitized.length > 200) {
        const ext = sanitized.split('.').pop();
        const name = sanitized.slice(0, 190);
        sanitized = `${name}.${ext}`;
    }
    
    // Ensure we have a valid name
    if (!sanitized || sanitized === '') {
        sanitized = 'unnamed_file';
    }
    
    return sanitized;
}

/**
 * Generate a unique storage file name
 * @param {string} originalName - Original file name
 * @returns {string} Unique file name with timestamp
 */
function generateStorageFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const sanitized = sanitizeFileName(originalName);
    const ext = sanitized.split('.').pop();
    const nameWithoutExt = sanitized.replace(`.${ext}`, '');
    
    return `${nameWithoutExt}_${timestamp}_${random}.${ext}`;
}

module.exports = {
    validateFile,
    detectMimeType,
    sanitizeFileName,
    generateStorageFileName,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE
};
