# KeepSecret 🔒

KeepSecret is a secure, full-stack, end-to-end encrypted note-taking web application designed to protect user privacy. Built with modern web technologies, it allows users to effortlessly organize, manage, and encrypt their text notes within dedicated notebooks while maintaining a seamless user experience.

---

## 🚀 Key Features

* **🔐 Client-Side & Database Encryption**: Secure note architecture ensuring that sensitive text notes remain encrypted in the database and safely decrypted for the user interface.
* **📚 Advanced Notebooks System**: Group notes into dedicated notebooks with support for creating unlimited notes and organizing them smoothly.
* **✋ Drag-and-Drop Interface**: Intuitive layout interactions powered by modern UI components for seamless workflow management.
* **👤 Comprehensive User Management**: 
  * Secure Email/Password registration and authentication.
  * Google OAuth login integration (optimized with multi-account conflict handling).
  * Robust Forgot Password and Reset Password workflows.
* **📝 Pure Text File Handling**: Dedicated support for creating, reading, updating, and deleting secure text-based notes of unlimited length.
* **🌓 Light & Dark Mode**: Fully integrated theme toggling for an optimal reading and writing experience across all environments.
* **⚡ High-Performance Regional Routing**: Optimized infrastructure layout keeping the backend and Neon database co-located in the Singapore region (`sin1`) to ensure ultra-low latency.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework**: [Next.js](https://nextjs.org/) (React)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **UI & Icons**: Lucide React, Radix UI components
* **State & Data Fetching**: Zustand / React Query / Axios

### **Backend**
* **Framework**: [NestJS](https://nestjs.com/) (Node.js)
* **API Architecture**: RESTful Services with secure interceptors and token refresh logic
* **Authentication**: Passport.js, JWT, Google OAuth2

### **Database & Infrastructure**
* **Database**: [Neon](https://neon.tech/) (Serverless PostgreSQL hosted in Singapore)
* **ORM**: Prisma / TypeORM
* **Hosting & Deployment**: Vercel (Edge network optimization and Serverless Functions)
* **Monitoring**: Vercel Speed Insights & Analytics

---

## 🏗️ Architecture Overview

KeepSecret follows a zero-knowledge architecture principle regarding data privacy during transit and storage. 
1. **Data Encryption**: Notes are processed securely before reaching persistence layers, safeguarding user content.
2. **Decryption on the Fly**: Authorized sessions safely decrypt authorized contents exclusively on the client-side UI view.
3. **Session Security**: Uses secure `HttpOnly` cookies and automatic token-refresh mechanisms to prevent unauthorized access and protect user sessions.

Live: https://keep-secret-frontend.vercel.app