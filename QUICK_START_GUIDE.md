# Mentis - Quick Start Guide for Admins

## 🚀 Quick Commands Reference

### View Platform Statistics
```bash
cd /app/backend && python3 platform_stats.py
```

### View All Registered Users
```bash
cd /app/backend && python3 view_users.py
```

### View Matrix Community Members
```bash
cd /app/backend && python3 view_matrix_members.py
```

### Export Data to CSV
```bash
cd /app/backend && python3 export_users.py
# Creates: /app/users_export.csv and /app/matrix_members_export.csv
```

---

## 📝 Adding New Content

### Add a Curiofact
1. Edit the template file:
```bash
nano /app/backend/add_curiofact_template.py
```

2. Update the `new_fact` dictionary with your content:
   - Title
   - Content (can be multi-paragraph)
   - Image URL (optional)

3. Run:
```bash
cd /app/backend && python3 add_curiofact_template.py
```

### Add a Resource (with Google Drive link)
1. **Prepare your Google Drive link:**
   - Upload file to Google Drive
   - Share → "Anyone with the link can view"
   - Copy the link

2. Edit the template:
```bash
nano /app/backend/add_resource_template.py
```

3. Update the `new_resource` dictionary:
   - Title
   - Description
   - Type (notes, playlist, book, article)
   - URL (your Google Drive link)
   - Topic

4. Run:
```bash
cd /app/backend && python3 add_resource_template.py
```

---

## 🎯 Admin Dashboard Access

**URL:** https://mentis-dev-1.preview.emergentagent.com/admin

**Credentials:**
- Email: `admin@mentis.com`
- Password: `admin123`

**Available Functions:**
- Approve/Reject pending resource submissions
- Add new games
- Publish curiofacts
- Manage all content

---

## 📊 Tracking Users

### Method 1: View in Terminal
```bash
cd /app/backend && python3 view_users.py
```

### Method 2: View Matrix Members
```bash
cd /app/backend && python3 view_matrix_members.py
```

### Method 3: Export to Spreadsheet
```bash
cd /app/backend && python3 export_users.py
```
Then download `/app/users_export.csv` and `/app/matrix_members_export.csv`

---

## 🔗 Important Links

- **Platform:** https://mentis-dev-1.preview.emergentagent.com
- **Admin Dashboard:** https://mentis-dev-1.preview.emergentagent.com/admin
- **WhatsApp Community Form:** https://docs.google.com/forms/d/e/1FAIpQLSfR6H5KD8WIhl3OfMhuDMib7Z-VzjqYb6AWZkz9Q33cfSFu7g/viewform

---

## 💡 Tips

1. **Monthly Routine:**
   - Add 1-2 new curiofacts
   - Review pending resources
   - Check platform statistics
   - Export user data for backup

2. **Google Drive Best Practices:**
   - Use descriptive file names
   - Organize in folders by topic
   - Always set to "Anyone with link can view"
   - Test links before adding to platform

3. **Content Quality:**
   - Review all community submissions before approval
   - Ensure resources are relevant and high-quality
   - Add engaging images to curiofacts
   - Update outdated content regularly

---

## 🆘 Need Help?

For detailed instructions, see: `/app/ADMIN_GUIDE.md`

For any issues, check backend logs:
```bash
tail -n 50 /var/log/supervisor/backend.err.log
```
