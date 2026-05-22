<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=E8C84A&height=180&section=header&text=MOVIEFINDER&fontSize=55&fontColor=0a0a0f&fontAlignY=38&desc=Cinematic%20Full-Stack%20Movie%20%26%20Series%20Discovery&descAlignY=60&descColor=0a0a0f&descSize=15&animation=fadeIn" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&duration=2500&pause=800&color=E8C84A&center=true&vCenter=true&multiline=false&width=620&lines=Next.js+14+%7C+React+%7C+Node.js+%7C+MongoDB+Atlas;JWT+Auth+%7C+Supabase+%7C+Redis+%7C+Firebase;Social+Feeds+%7C+Real-time+Chat+%7C+Smart+Recommendations;Ken+Burns+Hero+%7C+Bento+Grid+%7C+Framer+Motion" alt="Typing SVG" />

<br/><br/>

<!-- STACK BADGES -->
<img src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
<img src="https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
<img src="https://img.shields.io/badge/MongoDB-Atlas-00ED64?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
<img src="https://img.shields.io/badge/Redis-Upstash-FF4438?style=for-the-badge&logo=redis&logoColor=white" alt="Redis"/>
<img src="https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"/>

<br/>

<img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
<img src="https://img.shields.io/badge/TMDB-API-01b4e4?style=for-the-badge&logo=themoviedb&logoColor=white" alt="TMDB"/>
<img src="https://img.shields.io/badge/Firebase-Analytics-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/>
<img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>
<img src="https://img.shields.io/badge/Sentry-Monitoring-362D59?style=for-the-badge&logo=sentry&logoColor=white" alt="Sentry"/>

<br/><br/>

<img src="https://img.shields.io/github/stars/core-ctrl/MovieFinderForYOU?style=for-the-badge&color=E8C84A&labelColor=0a0a0f" alt="Stars"/>
<img src="https://img.shields.io/github/forks/core-ctrl/MovieFinderForYOU?style=for-the-badge&color=E8C84A&labelColor=0a0a0f" alt="Forks"/>
<img src="https://img.shields.io/github/last-commit/core-ctrl/MovieFinderForYOU?style=for-the-badge&color=E8C84A&labelColor=0a0a0f" alt="Last Commit"/>
<img src="https://img.shields.io/github/license/core-ctrl/MovieFinderForYOU?style=for-the-badge&color=E8C84A&labelColor=0a0a0f" alt="License"/>

</div>

---

## 🧠 What is This?

**MovieFinder** is a feature-rich, full-stack **Next.js 14** application designed for cinematic discovery, social interaction, and real-time community engagement. 

It has evolved far beyond a simple movie lookup tool into a complete social network for cinephiles. Next.js handles both the stunning React frontend and the powerful Node.js backend API routes.

For an in-depth breakdown of how the systems communicate, caching strategies, and database schemas, please read our **[Architecture Documentation (ARCHITECTURE.md)](ARCHITECTURE.md)**.

---

## ✨ Features & Tech Stack

We utilize a wide array of modern technologies to deliver a premium user experience:

| Feature | Tech Used | Details |
|:---|:---|:---|
| **Social Feeds ("Takes")** | MongoDB, Next.js API | Post hot takes, reviews, follow users, and like posts. |
| **Real-Time Chat** | Supabase WebSockets | Peer-to-peer messaging and live notifications. |
| **Smart Recommendations** | Custom Decision Engine | Tailored suggestions based on watch history and onboarding preferences. |
| **High-Speed Caching** | Upstash Redis | API rate limiting and sub-millisecond response caching. |
| **Cinematic UI** | Framer Motion, Tailwind | Ken Burns effects, smooth scrolling (Lenis), and dynamic carousels. |
| **Global Trailers** | YouTube Embeds | Autoplaying HD trailers via a global floating modal. |
| **Robust Auth** | JWT, NextAuth, bcrypt | Secure email/password login with HTTP-only cookies and password resets. |
| **Production Ready** | Docker, Nginx | Multi-stage Dockerfiles utilizing Next.js `standalone` mode. |
| **Monitoring & Analytics**| Firebase, Sentry | Real-time crash reporting and user behavior tracking. |

---

## 🚀 Quick Start

<details>
<summary><b>🖥️ Local Development (Node.js)</b></summary>
<br/>

```bash
git clone https://github.com/core-ctrl/MovieFinderForYOU.git
cd MovieFinderForYOU
npm install --legacy-peer-deps
cp .env.example .env.local
# Fill in your keys in .env.local (See Environment Variables below)
npm run dev
```

Open → [http://localhost:3000](http://localhost:3000)

</details>

<details>
<summary><b>🐳 Docker Deployment (Recommended)</b></summary>
<br/>

Our Docker configuration uses Next.js `standalone` mode and injects `.env.local` directly into the build context for a seamless setup.

```bash
# Start the entire stack (App, MongoDB, Nginx)
docker-compose up --build -d

# View logs
docker-compose logs -f app

# Stop the stack
docker-compose down
```

</details>

<details>
<summary><b>⚙️ Environment Variables (.env.local)</b></summary>
<br/>

Create a `.env.local` file in the root directory. **Never commit this file.**

```env
# TMDB API
TMDB_API_KEY=your_tmdb_key

# Database & Caching
MONGODB_URI=mongodb://localhost:27017/moviefinder
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# Real-Time (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Security & Auth
JWT_SECRET=your_jwt_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password

# Analytics & Monitoring
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

</details>

---

## 📜 License

This project is open-sourced software licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more information.

> **Disclaimer**: This product uses the TMDB API but is **not** endorsed or certified by TMDB. All movie data, images, and metadata belong to their respective rights holders. This is a discovery tool only — no content is hosted or streamed.

---

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=12&duration=3000&pause=1000&color=E8C84A&center=true&vCenter=true&width=440&lines=Drop+a+%E2%AD%90+if+you+like+the+project!;Built+with+%E2%9D%A4%EF%B8%8F+%7C+Data+by+TMDB+API" alt="footer typing"/>

<br/><br/>

**Built with ❤️ · Data by [TMDB](https://www.themoviedb.org)**

</div>