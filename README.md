# Cabañas MariaMar - Fixed author
# Cabañas MariaMar - Email Notification Setup

## 📧 Email Integration with Resend

This setup adds automatic email notifications when guests complete their registration.

### Setup Instructions

1. **File Structure**
   ```
   your-project/
   ├── api/
   │   └── send-email.js          # Serverless function
   ├── package.json               # Dependencies
   ├── vercel.json                # Vercel configuration
   ├── index.html                 # Main landing page
   ├── registro-cabana1.html      # Cabin 1 form (updated)
   ├── registro-cabana2.html      # Cabin 2 form
   └── registro-cabana3.html      # Cabin 3 form
   ```

2. **Deploy to Vercel**
   - Upload all files to your Vercel project
   - Vercel will automatically:
     - Install dependencies from package.json
     - Deploy the serverless function at `/api/send-email`
     - Serve your static HTML files

3. **How It Works**
   - When a guest submits the form, it :
     1. Saves data to Firebase (as before)
     2. Calls `/api/send-email` endpoint
     3. Sends formatted email to orhanimre@gmail.com
     4. Shows success modal to the guest

4. **Email Details**
   - **From:** Cabañas MariaMar <onboarding@resend.dev>
   - **To:** orhanimre@gmail.com
   - **Subject:** 🏡 Nuevo Registro - [Cabaña] - [Guest Name]
   - **Contains:**
     - Guest information (name, phone, ID, city)
     - Stay details (check-in/out dates and times)
     - Companion information (if any)
     - Registration timestamp.

### Important Notes

⚠️ **API Key Security:**
- The API key is currently in the code for simplicity
- For production, consider using Vercel Environment Variables:
  1. Go to the Vercel Dashboard → Project Settings → Environment Variables
  2. Add: `RESEND_API_KEY` = `re_htsSVCCG_JvqNxLVjjAPe4RTVmDu6N6SN`
  3. Update code to use: `process.env.RESEND_API_KEY`
  4. Domain: marizulynaranjo.com

### Testing

After deployment, test by:
1. Fill out the registration form
2. Submit the form
3. Check your email (orhanimre@gmail.com)
4. Email should arrive within seconds

### Customization

To customize emails, edit `/api/send-email.js`:
- Change recipient: Update `to` field
- Change sender name: Update `from` field (keep @resend.dev domain)
- Modify email template: Update `emailHTML` variable

### Troubleshooting

If emails don't arrive:
1. Check Vercel deployment logs
2. Verify API key is correct
3. Check spam folder
4. Ensure Resend account is active

### Support

For issues, check:
- Vercel deployment logs
- Browser console for errors
- Network tab for API call status