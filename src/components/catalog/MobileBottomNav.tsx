/* ==========================================================================
   ✅ NAVBAR — mobile TikTok Shop style
   Desktop retained
   ========================================================================== */

@media (max-width: 767px) {

  /* ============================================
     1. NAVBAR — sticky top bar, compact
     ============================================ */

  .site-nav {
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    background: var(--theme-surface) !important;
    border-bottom: 1px solid var(--theme-border) !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    padding: 0 !important;
  }

  .site-nav__inner {
    width: 100% !important;
    min-height: 56px !important;
    padding: max(8px, env(safe-area-inset-top)) 12px 8px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 8px !important;
    margin: 0 !important;
  }

  /* ============================================
     2. BRAND — compact logo + name
     ============================================ */

  .brand {
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    flex-shrink: 0 !important;
    text-decoration: none !important;
    min-width: 0 !important;
  }

  .brand__logo {
    width: 32px !important;
    height: 32px !important;
    flex-shrink: 0 !important;
  }

  .brand__copy {
    display: flex !important;
    flex-direction: column !important;
    gap: 0 !important;
    min-width: 0 !important;
  }

  .brand__name {
    font-size: 13px !important;
    font-weight: 700 !important;
    color: var(--theme-text) !important;
    white-space: nowrap !important;
    line-height: 1.1 !important;
  }

  .brand__tagline {
    display: none !important;
  }

  /* ============================================
     3. SEARCH — hidden on top bar, nasa catalog page
     ============================================ */

  .nav-search {
    display: none !important;
  }

  /* ============================================
     4. NAV ACTIONS — icons only, compact
     ============================================ */

  .nav-actions {
    display: flex !important;
    align-items: center !important;
    gap: 2px !important;
    flex-shrink: 0 !important;
  }

  /* ✅ Alisin yung labels */
  .nav-action__label {
    display: none !important;
  }

  .nav-action {
    width: 38px !important;
    height: 38px !important;
    padding: 0 !important;
    display: grid !important;
    place-items: center !important;
    border-radius: 10px !important;
    background: transparent !important;
    border: none !important;
    color: var(--theme-text) !important;
    position: relative !important;
    -webkit-tap-highlight-color: transparent !important;
  }

  .nav-action:active {
    background: rgba(var(--theme-primary-rgb), 0.1) !important;
  }

  .nav-action .react-icon {
    width: 20px !important;
    height: 20px !important;
    stroke-width: 1.8 !important;
  }

  /* ✅ HIDE yung Catalog at Orders icons sa top bar — nasa bottom nav sila */
  .nav-actions > a[href="/catalog"],
  .nav-actions > a[href="/cart"] {
    display: none !important;
  }

  /* ✅ Cart count badge */
  .nav-cart-count {
    position: absolute !important;
    top: 2px !important;
    right: 2px !important;
    min-width: 16px !important;
    height: 16px !important;
    padding: 0 4px !important;
    border-radius: 999px !important;
    background: var(--theme-danger) !important;
    color: var(--theme-on-danger) !important;
    font-size: 9px !important;
    font-weight: 700 !important;
    display: grid !important;
    place-items: center !important;
    border: 2px solid var(--theme-surface) !important;
  }

  /* ✅ Sign in button — accent style */
  .nav-action--accent {
    width: auto !important;
    padding: 8px 14px !important;
    background: var(--theme-primary) !important;
    color: var(--theme-on-primary) !important;
    border-radius: 999px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
  }

  .nav-action--accent .nav-action__label {
    display: inline !important;
  }

  .nav-action--accent .react-icon {
    width: 16px !important;
    height: 16px !important;
  }

  /* ============================================
     5. AVATAR — compact
     ============================================ */

  .nav-profile {
    position: relative !important;
  }

  .nav-avatar {
    width: 38px !important;
    height: 38px !important;
    padding: 0 !important;
    border-radius: 50% !important;
    display: grid !important;
    place-items: center !important;
    background: transparent !important;
    border: 2px solid transparent !important;
    cursor: pointer !important;
  }

  .nav-avatar:active {
    border-color: var(--theme-primary) !important;
  }

  .nav-avatar-frame {
    width: 32px !important;
    height: 32px !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    display: grid !important;
    place-items: center !important;
    background: rgba(var(--theme-primary-rgb), 0.15) !important;
  }

  .nav-avatar-img {
    width: 32px !important;
    height: 32px !important;
    border-radius: 50% !important;
    object-fit: cover !important;
  }

  .nav-avatar-initials {
    font-size: 12px !important;
    font-weight: 700 !important;
    color: var(--theme-primary) !important;
  }

  /* ✅ Hide chevron */
  .nav-avatar-chevron {
    display: none !important;
  }

  /* ============================================
     6. NOTIFICATION BELL — compact
     ============================================ */

  .notification-bell {
    position: relative !important;
  }

  .notification-bell__button {
    width: 38px !important;
    height: 38px !important;
    padding: 0 !important;
    border-radius: 10px !important;
    background: transparent !important;
    border: none !important;
  }

  .notification-bell__button .react-icon {
    width: 20px !important;
    height: 20px !important;
    stroke-width: 1.8 !important;
  }

  /* ============================================
     7. DROPDOWN MENU — full-screen drawer
     ============================================ */

  .nav-dropdown {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important;
    z-index: 1000 !important;
    border-radius: 0 !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: max(24px, env(safe-area-inset-top)) 20px
      max(24px, env(safe-area-inset-bottom)) !important;
    background: var(--theme-surface) !important;
    overflow-y: auto !important;
    animation: navDrawerSlideDown 320ms cubic-bezier(0.22, 1, 0.36, 1) !important;
  }

  @keyframes navDrawerSlideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ✅ Dropdown header (user info) */
  .nav-dropdown-header-link {
    display: block !important;
    text-decoration: none !important;
    color: inherit !important;
    margin-bottom: 16px !important;
  }

  .nav-dropdown-header {
    display: flex !important;
    align-items: center !important;
    gap: 14px !important;
    padding: 16px !important;
    border-radius: 16px !important;
    background: rgba(var(--theme-primary-rgb), 0.06) !important;
    border: 1px solid var(--theme-border) !important;
  }

  .nav-dropdown-avatar-frame {
    width: 56px !important;
    height: 56px !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    display: grid !important;
    place-items: center !important;
    background: rgba(var(--theme-primary-rgb), 0.15) !important;
    border: 2px solid var(--theme-border-strong) !important;
    flex-shrink: 0 !important;
  }

  .nav-dropdown-avatar {
    width: 56px !important;
    height: 56px !important;
    border-radius: 50% !important;
    object-fit: cover !important;
  }

  .nav-dropdown-initials {
    font-size: 20px !important;
    font-weight: 700 !important;
    color: var(--theme-primary) !important;
  }

  .nav-dropdown-user {
    flex: 1 !important;
    min-width: 0 !important;
  }

  .nav-dropdown-name {
    font-size: 16px !important;
    font-weight: 700 !important;
    color: var(--theme-text) !important;
    margin: 0 0 2px !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .nav-dropdown-role {
    font-size: 12px !important;
    color: var(--theme-primary) !important;
    margin: 0 0 2px !important;
    font-weight: 600 !important;
  }

  .nav-dropdown-email {
    font-size: 12px !important;
    color: var(--theme-text-muted) !important;
    margin: 0 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  /* ✅ Divider */
  .nav-dropdown-divider {
    height: 1px !important;
    background: var(--theme-border) !important;
    border: none !important;
    margin: 12px 0 !important;
  }

  /* ✅ Dropdown items — big tap targets */
  .nav-dropdown-item {
    display: flex !important;
    align-items: center !important;
    gap: 14px !important;
    width: 100% !important;
    min-height: 52px !important;
    padding: 14px 16px !important;
    border-radius: 14px !important;
    background: transparent !important;
    border: none !important;
    color: var(--theme-text) !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    text-align: left !important;
    text-decoration: none !important;
    cursor: pointer !important;
    margin-bottom: 2px !important;
  }

  .nav-dropdown-item:active {
    background: rgba(var(--theme-primary-rgb), 0.08) !important;
    color: var(--theme-primary) !important;
  }

  .nav-dropdown-item .react-icon {
    width: 20px !important;
    height: 20px !important;
    stroke-width: 1.8 !important;
    color: var(--theme-text-muted) !important;
    flex-shrink: 0 !important;
  }

  /* ✅ Themes button */
  .nav-dropdown-item--themes {
    color: var(--theme-text) !important;
  }

  /* ✅ Danger (sign out) */
  .nav-dropdown-item--danger {
    color: var(--theme-danger) !important;
    background: rgba(var(--theme-danger-rgb), 0.06) !important;
    border: 1px solid rgba(var(--theme-danger-rgb), 0.2) !important;
    margin-top: 12px !important;
    min-height: 52px !important;
    justify-content: center !important;
  }

  .nav-dropdown-item--danger .react-icon {
    color: var(--theme-danger) !important;
  }

  /* ✅ Language section */
  .nav-dropdown-language {
    padding: 4px 0 !important;
  }

  .nav-dropdown-language__header {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 8px 16px !important;
    color: var(--theme-text-muted) !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
  }

  .nav-dropdown-language__header .react-icon {
    width: 16px !important;
    height: 16px !important;
  }

  /* ✅ Prevent body scroll kapag dropdown bukas */
  body:has(.nav-dropdown) {
    overflow: hidden !important;
  }

  /* ✅ Notification dropdown — full screen */
  .notification-bell__dropdown {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100dvh !important;
    z-index: 1000 !important;
    border-radius: 0 !important;
    padding: max(24px, env(safe-area-inset-top)) 20px
      max(24px, env(safe-area-inset-bottom)) !important;
    background: var(--theme-surface) !important;
    overflow-y: auto !important;
    animation: navDrawerSlideDown 320ms cubic-bezier(0.22, 1, 0.36, 1) !important;
  }
}

/* ============================================
   DESKTOP — i-retain lahat
   ============================================ */

@media (min-width: 768px) {
  .nav-dropdown,
  .notification-bell__dropdown {
    position: absolute !important;
    top: auto !important;
    left: auto !important;
    right: 0 !important;
    bottom: auto !important;
    width: auto !important;
    max-width: 320px !important;
    height: auto !important;
    max-height: 500px !important;
    border-radius: 16px !important;
    border: 1px solid var(--theme-border-strong) !important;
    box-shadow:
      0 4px 12px rgba(0, 0, 0, 0.08),
      0 16px 40px rgba(0, 0, 0, 0.12) !important;
    padding: 8px !important;
    margin-top: 8px !important;
  }

  .nav-dropdown-item {
    min-height: 44px !important;
    padding: 10px 14px !important;
    font-size: 14px !important;
    border-radius: 10px !important;
  }
}