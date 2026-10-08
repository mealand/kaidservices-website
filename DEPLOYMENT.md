# Deploying to Namecheap (kaidservices.com)

The site builds to static files in `dist/`, plus one PHP script. Any Namecheap shared-hosting plan (cPanel) can serve it.

There are two ways to deploy:

- **A. Automatic.** Every push to `main` builds and uploads the site through GitHub Actions. This is the recommended option.
- **B. Manual.** You build locally and upload the files through cPanel File Manager.

---

## 0. Before either option

1. **Point the domain at the hosting.** If you bought the domain and the hosting together at Namecheap, this is usually already done. Otherwise, go to Namecheap → Domain List → *kaidservices.com* → Manage → Nameservers, and choose **Namecheap Web Hosting DNS**.
2. **Turn on SSL.** In cPanel, open **SSL/TLS Status**, select kaidservices.com and www.kaidservices.com, and click **Run AutoSSL**. Namecheap includes a free certificate. The site's `.htaccess` redirects all traffic to HTTPS, so the certificate must exist first.
3. **Create the mailbox** `info@kaidservices.com` (cPanel → **Email Accounts**). The signup form sends notifications to this address.
4. **Clear out `public_html`.** If it holds a default placeholder page such as `index.php` or `default.html`, delete it or move it into a backup folder.

## A. Automatic deploys (GitHub Actions → FTPS)

### 1. Create an FTP account in cPanel

1. Open cPanel → **FTP Accounts** → *Add FTP Account*.
2. Choose a username, for example `deploy`. The full login becomes `deploy@kaidservices.com`.
3. Set a strong password.
4. Set **Directory** to `public_html`. The account is then restricted to the web root.
5. Note the **FTP server** name. It is usually `ftp.kaidservices.com`. If the domain isn't pointing at the hosting yet, use the server hostname shown under *Configure FTP Client*.

### 2. Add secrets and variables to the GitHub repo

Go to the repository → **Settings** → **Secrets and variables** → **Actions**.

| Type | Name | Value |
| --- | --- | --- |
| Secret | `FTP_SERVER` | `ftp.kaidservices.com` |
| Secret | `FTP_USERNAME` | `deploy@kaidservices.com` |
| Secret | `FTP_PASSWORD` | the password from step 1 |
| Variable | `FTP_DEPLOY` | `true` |
| Variable | `FTP_SERVER_DIR` | `./` (because the FTP account above is already rooted at `public_html`) |

If you use your main cPanel FTP login instead, which starts in your home folder, set `FTP_SERVER_DIR` to `/public_html/`.

### 3. Deploy

Push to `main`, or open **Actions** → *Build & deploy* → **Run workflow**. The first upload takes a minute or two. Later deploys only upload changed files.

## B. Manual deploy (cPanel File Manager)

1. Run `npm run build` locally.
2. Zip the **contents** of `dist/`, not the folder itself. The zip must include `.htaccess`, which is a hidden file, so make sure hidden files are visible when you zip.
3. Open cPanel → **File Manager** → `public_html`, then click **Upload** and upload the zip.
4. Right-click the zip, choose **Extract**, then delete the zip.
5. In File Manager → *Settings*, tick **Show Hidden Files** and check that `.htaccess` is present.

## After going live, check that

- `https://kaidservices.com` loads, and `http://` and `www.` both redirect to it.
- Submitting the "Notify me" form shows a success message. Signups are stored in `~/kaid-private/subscribers.csv`, which is outside `public_html` so nobody can browse to it. You can download it from File Manager. You'll also receive an email for each signup.
- `https://kaidservices.com/does-not-exist` shows the branded 404 page.
- The share preview looks right. Paste the URL into WhatsApp or LinkedIn, or use https://www.opengraph.xyz.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| 500 error right after upload | Some hosts reject a directive in `.htaccess`. Rename it to `.htaccess.off` to confirm, then remove the `<If>` block or the `Header` lines one at a time. |
| Redirect loop | Your SSL isn't active yet. Run AutoSSL (step 0.2), or temporarily comment out the two HTTPS lines in `.htaccess`. |
| Form says "temporarily unavailable" | PHP couldn't create `~/kaid-private`. Create that folder yourself in File Manager (one level above `public_html`). |
| No signup emails | Make sure `info@kaidservices.com` exists. Check cPanel → **Track Delivery**. |
| GitHub Action fails at FTP step | Recheck the secrets. Try `protocol: ftp` in `deploy.yml` if FTPS is blocked on your plan. |
