# Project Directory Tree

```text
.
├── components
│   ├── admin
│   │   ├── ActivityGraph.jsx
│   │   ├── GenreStats.jsx
│   │   └── UserStats.jsx
│   ├── cards
│   │   └── HoverCard.jsx
│   ├── chat
│   │   ├── ChatPanel.jsx
│   │   ├── ChatWindow.jsx
│   │   └── NotificationBell.jsx
│   ├── history
│   │   ├── ContinueWatchingRow.jsx
│   │   └── WatchHistoryRow.jsx
│   ├── landing
│   │   ├── LandingFeatures.jsx
│   │   ├── LandingFooter.jsx
│   │   └── LandingHero.jsx
│   ├── onboarding
│   │   ├── GenreSelect.jsx
│   │   ├── LanguageSelect.jsx
│   │   ├── OnboardingWrapper.jsx
│   │   ├── PlatformSelect.jsx
│   │   ├── RegionSelect.jsx
│   │   └── WelcomeScreen.jsx
│   ├── search
│   │   ├── SearchAutocomplete.jsx
│   │   ├── SearchBar.jsx
│   │   ├── SearchFilters.jsx
│   │   └── SearchResultCard.jsx
│   ├── social
│   │   ├── CreateTake.jsx
│   │   ├── FriendActivity.jsx
│   │   ├── OnlinePresence.jsx
│   │   ├── TakeCard.jsx
│   │   └── UserSearch.jsx
│   ├── trailer
│   │   ├── NextAutoplayCard.jsx
│   │   └── QualitySelector.jsx
│   ├── ui
│   │   ├── Badge.jsx
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── GlassContainer.jsx
│   │   ├── SectionHeader.jsx
│   │   └── Toaster.jsx
│   ├── AdBanner.jsx
│   ├── AdSlot.jsx
│   ├── AnalyticsManager.jsx
│   ├── AppIcon.jsx
│   ├── AuthButton.jsx
│   ├── AuthModal.jsx
│   ├── AuthWidget.jsx
│   ├── BentoGrid.jsx
│   ├── BottomNav.jsx
│   ├── CastList.jsx
│   ├── CookieBanner.jsx
│   ├── CookieConsent.jsx
│   ├── DailyPicks.jsx
│   ├── ErrorBoundary.jsx
│   ├── FeedbackButton.jsx
│   ├── FeedbackForm.jsx
│   ├── Footer.jsx
│   ├── GenreRow.jsx
│   ├── HeroSlider.jsx
│   ├── LazyImage.jsx
│   ├── LoadingSpinner.jsx
│   ├── MediaDetailLayout.jsx
│   ├── Modal.jsx
│   ├── MovieCard.jsx
│   ├── MovieCardHover.jsx
│   ├── Navbar.jsx
│   ├── OnboardingFlow.jsx
│   ├── Pill.jsx
│   ├── PreferencesGate.jsx
│   ├── ProfileMenu.jsx
│   ├── ProviderBadges.jsx
│   ├── ProviderIcons.jsx
│   ├── RushesLogo.jsx
│   ├── SectionRow.jsx
│   ├── SEOMeta.jsx
│   ├── ShareButton.jsx
│   ├── SkeletonCard.jsx
│   ├── SmartSearch.jsx
│   ├── TopCarousel.jsx
│   ├── TrailerModal.jsx
│   └── WatchNowButtons.jsx
├── content
├── controllers
├── hooks
│   ├── useAdaptiveVideoQuality.js
│   ├── useAnalytics.js
│   ├── useLenis.js
│   ├── useLocation.js
│   └── useVoiceRecorder.js
├── k8s
│   ├── deployment.yaml
│   ├── hpa.yaml
│   ├── ingress.yaml
│   └── secrets.yaml
├── lib
│   ├── analytics.js
│   ├── auth.js
│   ├── avatar.js
│   ├── axios.js
│   ├── blog.js
│   ├── cache.js
│   ├── dbConnect.js
│   ├── decisionEngine.js
│   ├── experiments.js
│   ├── firebase.js
│   ├── firebaseAuth.js
│   ├── imageBlur.js
│   ├── mailer.js
│   ├── mongodb.js
│   ├── oauth.js
│   ├── preferenceOptions.js
│   ├── providers.js
│   ├── rateLimit.js
│   ├── redis.js
│   ├── security.js
│   ├── sendEmail.js
│   ├── seo.js
│   ├── site.js
│   ├── supabase.js
│   ├── tmdb.js
│   └── userPreferences.js
├── middleware
│   ├── requireAdmin.js
│   ├── requireAuth.js
│   └── validate.js
├── models
│   ├── Comment.js
│   ├── Conversation.js
│   ├── Feedback.js
│   ├── Message.js
│   ├── Notification.js
│   ├── Post.js
│   ├── Report.js
│   ├── Take.js
│   └── User.js
├── pages
│   ├── admin
│   │   ├── feedback.js
│   │   └── index.js
│   ├── api
│   │   ├── admin
│   │   │   ├── broadcast.js
│   │   │   ├── cache.js
│   │   │   ├── feedback.js
│   │   │   ├── handle-report.js
│   │   │   ├── recent-users.js
│   │   │   ├── reports.js
│   │   │   ├── stats.js
│   │   │   └── users.js
│   │   ├── analytics
│   │   │   └── event.js
│   │   ├── auth
│   │   │   ├── oauth
│   │   │   │   ├── callback
│   │   │   │   │   └── [provider].js
│   │   │   │   └── [provider].js
│   │   │   ├── [...nextauth].js
│   │   │   ├── change-password.js
│   │   │   ├── forgot-password.js
│   │   │   ├── login.js
│   │   │   ├── logout.js
│   │   │   ├── mailer.js
│   │   │   ├── me.js
│   │   │   ├── register.js
│   │   │   ├── resend-verification.js
│   │   │   ├── reset-password.js
│   │   │   └── verify-email.js
│   │   ├── debug
│   │   │   ├── env-check.js
│   │   │   └── test-email.js
│   │   ├── jobs
│   │   │   ├── daily-picks.js
│   │   │   └── notifications.js
│   │   ├── media
│   │   │   └── [type]
│   │   │       └── [id].js
│   │   ├── messages
│   │   │   ├── [conversationId]-fixed.js
│   │   │   ├── [conversationId].js
│   │   │   ├── conversations.js
│   │   │   └── unread.js
│   │   ├── movies
│   │   │   ├── index.js
│   │   │   ├── now-playing.js
│   │   │   ├── recommendations.js
│   │   │   └── trending.js
│   │   ├── notifications
│   │   │   └── index.js
│   │   ├── posts
│   │   │   ├── [id]
│   │   │   │   └── like.js
│   │   │   └── index.js
│   │   ├── report
│   │   │   └── abuse.js
│   │   ├── search
│   │   │   ├── advanced.js
│   │   │   └── autocomplete.js
│   │   ├── series
│   │   │   ├── index.js
│   │   │   ├── recommendations.js
│   │   │   └── trending.js
│   │   ├── social
│   │   │   └── friend-activity.js
│   │   ├── takes
│   │   │   ├── create.js
│   │   │   ├── feed.js
│   │   │   └── like.js
│   │   ├── tmdb
│   │   │   └── videos.js
│   │   ├── user
│   │   │   ├── delete-account.js
│   │   │   ├── history.js
│   │   │   ├── list.js
│   │   │   ├── notifications.js
│   │   │   ├── preferences.js
│   │   │   ├── profile.js
│   │   │   ├── status.js
│   │   │   └── update-location.js
│   │   ├── users
│   │   │   ├── [username]
│   │   │   │   └── profile.js
│   │   │   ├── block.js
│   │   │   ├── check-username.js
│   │   │   ├── follow.js
│   │   │   ├── report.js
│   │   │   └── search.js
│   │   ├── contact.js
│   │   ├── decide.js
│   │   ├── feedback.js
│   │   ├── genres.js
│   │   ├── preview.js
│   │   ├── recommendations.js
│   │   ├── search.js
│   │   ├── trailer.js
│   │   └── trending.js
│   ├── blog
│   │   ├── [slug].js
│   │   └── index.js
│   ├── genre
│   ├── messages
│   │   ├── [userId].jsx
│   │   └── index.jsx
│   ├── movies
│   │   ├── [id].jsx
│   │   └── index.jsx
│   ├── my-list
│   │   └── index.js
│   ├── profile
│   │   └── index.js
│   ├── series
│   │   ├── [id].jsx
│   │   └── index.jsx
│   ├── take
│   │   └── [id].jsx
│   ├── u
│   │   └── [username].jsx
│   ├── _app.js
│   ├── _document.js
│   ├── about.js
│   ├── contact.js
│   ├── dmca.js
│   ├── forgot-password.jsx
│   ├── index.js
│   ├── login.jsx
│   ├── privacy-policy.js
│   ├── privacy.js
│   ├── register.jsx
│   ├── report-abuse.jsx
│   ├── reset-password.js
│   ├── robots.txt.js
│   ├── search.jsx
│   ├── sitemap.xml.js
│   ├── social.jsx
│   ├── terms-and-conditions.js
│   ├── terms.js
│   └── verify-email.jsx
├── public
│   ├── favicons
│   ├── providers
│   │   ├── hotstar.svg
│   │   ├── jiocinema.svg
│   │   ├── netflix.svg
│   │   ├── primevideo.svg
│   │   ├── sonyliv.svg
│   │   └── zee5.svg
│   ├── avatar.png
│   ├── avatar.svg
│   ├── fallback.jpg
│   ├── logo.png
│   └── manifest.json
├── scripts
│   ├── build-assets.js
│   └── fix-account.js
├── services
│   ├── authService.js
│   ├── messagingService.js
│   ├── recommendationService.js
│   ├── searchService.js
│   └── watchlistService.js
├── store
│   ├── slices
│   │   ├── authSlice.js
│   │   ├── locationSlice.js
│   │   ├── messagingSlice.js
│   │   ├── uiSlice.js
│   │   └── watchlistSlice.js
│   └── index.js
├── styles
│   ├── components.css
│   └── globals.css
├── utils
│   ├── constants.js
│   ├── fetchHelper.js
│   ├── format.js
│   ├── history.js
│   ├── image.js
│   ├── locale.js
│   ├── providers.js
│   ├── recommendations.js
│   ├── tmdb.js
│   └── videoQuality.js
├── .dockerignore
├── .env.local
├── .gitignore
├── ARCHITECTURE.md
├── docker-compose.yml
├── Dockerfile
├── jsconfig.json
├── LICENSE
├── next-dev.err.log
├── next-dev.out.log
├── next-start.err.log
├── next-start.out.log
├── next.config.js
├── nginx.conf
├── package.json
├── postcss.config.js
├── proxy.js
├── README.md
├── sentry.client.config.js
├── sentry.server.config.js
├── tailwind.config.js
├── test-db.js
├── test.md
├── tree-gen.js
└── vercel.json
```
