// Admin Dashboard Utility Functions
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Get authorization headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// Utility function to convert Google Drive URLs to direct/viewable URLs
export const convertGoogleDriveUrl = (url, forceDownload = false) => {
  if (!url) return url;
  
  let fileId = null;
  
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/thumbnail\?.*id=([a-zA-Z0-9_-]+)/,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }
  
  if (fileId) {
    if (forceDownload) {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    } else {
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }
  
  return url;
};

// Alias for backward compatibility
export const convertToDirectImageUrl = (url) => convertGoogleDriveUrl(url, false);
