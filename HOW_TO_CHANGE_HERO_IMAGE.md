# How to Change the Home Page Hero Image

## Quick Guide

As an admin, you can now change the hero image on the homepage to your company logo or any image you prefer.

## Step-by-Step Instructions

### 1. Prepare Your Image

**Option A: Upload to Imgur (Recommended - Free & Easy)**
1. Go to [Imgur.com](https://imgur.com)
2. Click "New post" (no account needed)
3. Upload your logo/image
4. After upload, right-click the image and select "Copy image address"
5. You'll get a URL like: `https://i.imgur.com/ABC123.png`

**Option B: Use Google Drive**
1. Upload image to Google Drive
2. Right-click → Share → Set to "Anyone with the link"
3. Copy the link, it looks like: `https://drive.google.com/file/d/1ABC123XYZ/view`
4. Convert to direct link format: `https://drive.google.com/uc?export=view&id=1ABC123XYZ`
   (Replace the file ID from step 3)

**Option C: Use Cloudinary**
1. Sign up at [Cloudinary.com](https://cloudinary.com) (free tier available)
2. Upload your image
3. Copy the provided URL

### 2. Update in Admin Dashboard

1. **Login** to your admin account:
   - Email: atreyaghoshal.68@gmail.com
   - Password: 4tr3y4@54N14

2. **Navigate** to Admin Dashboard:
   - Click the orange "Admin" button in the top navigation

3. **Go to Site Settings**:
   - Click the "Site Settings" tab

4. **Update the Image**:
   - Paste your image URL in the "Home Page Hero Image" field
   - See the preview below the input field
   - Click "Save Changes"

5. **Verify**:
   - Visit your homepage
   - The new image should appear immediately
   - If not, refresh the page (Ctrl+F5 or Cmd+Shift+R)

## Image Recommendations

### Best Practices:
- **Dimensions**: 800x600 pixels or similar aspect ratio (4:3 or 16:9)
- **File Size**: Under 500KB for fast loading
- **Format**: PNG (for logos with transparency) or JPG/WebP
- **Quality**: High resolution but optimized for web

### For Company Logos:
- Use a logo with transparent background (PNG format)
- Consider a square or horizontal logo orientation
- Ensure good contrast against dark background
- Add padding/whitespace around the logo if needed

### For Hero Images:
- Use images related to mathematics, education, or community
- Ensure text is readable if overlay text is present
- Choose images with appropriate color schemes
- Avoid overly busy or distracting images

## Troubleshooting

### Image Not Showing?
1. **Check the URL**: Make sure it's a direct image link (ends with .jpg, .png, .webp)
2. **Test the URL**: Paste it in a new browser tab - you should see only the image
3. **Check Permissions**: For Google Drive links, ensure "Anyone with the link" can view
4. **Clear Cache**: Hard refresh your browser (Ctrl+F5)

### Image Looks Stretched or Distorted?
- Use an image with aspect ratio close to 4:3 or 16:9
- The image will auto-scale but maintain aspect ratio
- Consider editing your image to fit these dimensions

### Want to Revert to Original?
1. Go to Site Settings in Admin Dashboard
2. Click "Reset" button to load the current saved image
3. Or paste this original URL:
   ```
   https://images.unsplash.com/photo-1741298167028-1e781b6b3bbe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1hdGhlbWF0aWNzJTIwZ2VvbWV0cnklMjBhcnR8ZW58MHx8fHwxNzY5OTM2NzAyfDA&ixlib=rb-4.1.0&q=85
   ```

## Free Image Hosting Services

Here are reliable free services for hosting your images:

1. **Imgur** - https://imgur.com
   - No account needed
   - Unlimited uploads
   - Fast and reliable

2. **Cloudinary** - https://cloudinary.com
   - Free tier: 25GB storage
   - Advanced image optimization
   - Requires account

3. **ImgBB** - https://imgbb.com
   - Simple and fast
   - No account needed for small uploads

4. **Google Drive**
   - If you already use Google services
   - Requires proper link format

## Examples

### Example 1: Company Logo
```
URL: https://i.imgur.com/YourLogo.png
Dimensions: 600x400 pixels
Format: PNG with transparent background
```

### Example 2: Hero Image
```
URL: https://images.unsplash.com/photo-123456789
Dimensions: 1200x800 pixels
Format: JPG optimized for web
```

## Support

If you encounter any issues:
1. Check that your image URL is publicly accessible
2. Verify the URL format is correct
3. Try a different image hosting service
4. Contact your development team if problems persist

---

**Note**: Changes take effect immediately. All visitors will see the new image on their next page load.
