# FSD Lab 06 — Dynamic Personal Portfolio

A responsive personal portfolio built with HTML, CSS, jQuery AJAX, Node.js, Express and MySQL.

## 1. Requirements
- Node.js and npm
- MySQL Server (and MySQL Workbench or another SQL client)
- VS Code (recommended)

## 2. Create the database
Open MySQL Workbench, connect to your local MySQL server, and run:

```sql
CREATE DATABASE rubab_portfolio;
```

The application automatically creates the tables and starter rows when it first starts.

## 3. Configure MySQL
Open `db.js`. Set `user`, `password`, and `database` to match your local MySQL setup. The default is user `root`, blank password, database `rubab_portfolio`.

## 4. Install and run
Open a terminal in this project folder:

```bash
npm install
npm start
```

Open http://localhost:3000. Keep the terminal open while using the website.

## 5. Edit portfolio information
Click **Manage Portfolio** in the navigation. Update the profile, add your own skills, education, experience, projects, and upload a profile image. The website sends AJAX requests to Express; Express saves the data in MySQL.

## 6. API endpoints
- `GET /api/portfolio` — load profile and all sections
- `PUT /api/profile` — update the profile text/links
- `POST /api/profile/image` — upload a profile image (multipart form field: `profileImage`)
- `POST /api/skills`, `PUT /api/skills/:id`, `DELETE /api/skills/:id`
- `POST /api/education`, `PUT /api/education/:id`, `DELETE /api/education/:id`
- `POST /api/experience`, `PUT /api/experience/:id`, `DELETE /api/experience/:id`
- `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id`

## 7. Test checklist
1. Open the site and confirm starter content appears.
2. Manage Portfolio → Profile → change headline → Save profile.
3. Refresh the browser and confirm the headline remains.
4. Upload an image and confirm it appears in the hero section.
5. Add a skill, edit it, and delete it.
6. Add/edit/delete an education entry, experience entry, and project.
7. Stop and restart the Node server; confirm the content remains.
8. Resize the browser or use mobile device emulation to check responsiveness.

## 8. Notes
- Do not publish your database password or private contact details in a public repository.
- This lab version has no login/authentication. Do not deploy the manager publicly as-is.
- Google Fonts, Bootstrap Icons, and jQuery are loaded from CDNs, so those visual assets need internet access. The main app runs locally.
- Image files are saved in `uploads/`; image paths are stored in MySQL. Keep this folder with the project.
