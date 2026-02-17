// =============================================================================
// GOOGLE CLOUD STORAGE SERVICE
// =============================================================================

const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Configuration
const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'cport-translations-audio';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'solid-choir-472118-q6';

// Service account key file path (auto-detect)
const KEY_FILE_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
  path.join(__dirname, '../../gcs-key.json');

// Initialize storage client
let storage = null;
let bucket = null;

try {
  const fs = require('fs');
  
  // Check if key file exists
  if (fs.existsSync(KEY_FILE_PATH)) {
    storage = new Storage({
      projectId: PROJECT_ID,
      keyFilename: KEY_FILE_PATH,
    });
    console.log(`✓ Google Cloud Storage initialized with key: ${KEY_FILE_PATH}`);
  } else {
    // Try Application Default Credentials
    storage = new Storage({
      projectId: PROJECT_ID,
    });
    console.log('✓ Google Cloud Storage initialized with ADC');
  }
  
  bucket = storage.bucket(BUCKET_NAME);
} catch (error) {
  console.warn('⚠ Google Cloud Storage not configured:', error.message);
}

// =============================================================================
// UPLOAD AUDIO
// =============================================================================

async function uploadAudio(audioBuffer, filename) {
  if (!storage || !bucket) {
    console.log('[Storage] Not configured, skipping upload');
    return null;
  }

  try {
    const filePath = `audio/${filename}`;
    const blob = bucket.file(filePath);
    
    await blob.save(audioBuffer, {
      contentType: 'audio/webm',
      metadata: {
        cacheControl: 'no-cache',
      },
    });

    // Return the GCS path (not public URL) - we'll generate signed URLs on demand
    const gcsPath = `gs://${BUCKET_NAME}/${filePath}`;
    
    console.log(`[Storage] Uploaded: ${gcsPath}`);
    return gcsPath;
  } catch (error) {
    console.error('[Storage] Upload error:', error.message);
    throw error;
  }
}

// =============================================================================
// GET SIGNED URL (for secure access)
// =============================================================================

async function getSignedUrl(gcsPath, expiresInMinutes = 60) {
  if (!gcsPath) {
    return null;
  }

  // Convert gs:// URL to public HTTPS URL
  // Bucket is configured with public read access (allUsers: objectViewer)
  // UUIDs in file paths make URLs effectively unguessable
  const filePath = gcsPath.replace(`gs://${BUCKET_NAME}/`, '');
  const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;
  
  console.log(`[Storage] Generated public URL: ${publicUrl}`);
  return publicUrl;
}

// =============================================================================
// UPLOAD TRANSLATION DATA (JSON backup)
// =============================================================================

async function uploadTranslationData(translationData, sessionId) {
  if (!storage || !bucket) {
    return null;
  }

  try {
    const filename = `translations/${sessionId}/${translationData.id}.json`;
    const blob = bucket.file(filename);
    
    await blob.save(JSON.stringify(translationData, null, 2), {
      contentType: 'application/json',
    });

    return `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
  } catch (error) {
    console.error('[Storage] Translation upload error:', error.message);
    return null;
  }
}

// =============================================================================
// LIST FILES
// =============================================================================

async function listFiles(prefix = '') {
  if (!storage || !bucket) {
    return [];
  }

  try {
    const [files] = await bucket.getFiles({ prefix });
    return files.map(file => ({
      name: file.name,
      size: file.metadata.size,
      updated: file.metadata.updated,
    }));
  } catch (error) {
    console.error('[Storage] List error:', error.message);
    return [];
  }
}

// =============================================================================
// SERVICE STATUS
// =============================================================================

function isStorageAvailable() {
  return !!storage && !!bucket;
}

function getStorageStatus() {
  return {
    available: isStorageAvailable(),
    bucket: BUCKET_NAME,
    projectId: PROJECT_ID,
  };
}

module.exports = {
  uploadAudio,
  uploadTranslationData,
  getSignedUrl,
  listFiles,
  isStorageAvailable,
  getStorageStatus,
};
