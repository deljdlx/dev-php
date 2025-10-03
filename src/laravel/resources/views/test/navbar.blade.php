
<header class="navbar navbar-expand-md d-print-none">
    <div class="container-xl">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-menu"
            aria-controls="navbar-menu" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <!-- RIGHT: quick actions (theme toggle, notifications, language, user) -->
        <div class="navbar-nav flex-row order-md-last ms-auto">
            <!-- Theme toggles -->
            <a href="#" class="nav-link px-2 hide-theme-dark" title="Activer le thème sombre"
                data-bs-toggle="tooltip" data-bs-placement="bottom">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" />
                    <path d="M12 3v2" />
                    <path d="M12 19v2" />
                    <path d="M3 12h2" />
                    <path d="M19 12h2" />
                    <path d="M5.6 5.6l1.4 1.4" />
                    <path d="M17 17l1.4 1.4" />
                    <path d="M5.6 18.4l1.4 -1.4" />
                    <path d="M17 7l1.4 -1.4" />
                </svg>
            </a>
            <a href="#" class="nav-link px-2 hide-theme-light" title="Activer le thème clair"
                data-bs-toggle="tooltip" data-bs-placement="bottom">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24"
                    stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round"
                    stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path
                        d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 1 0 8.614 8.614c.006 -.13 .01 -.26 .01 -.393a9 9 0 1 1 -9 -9z" />
                </svg>
            </a>

            <!-- Notifications (Font Awesome example) -->
            <div class="nav-item dropdown d-none d-md-flex me-2">
                <a href="#" class="nav-link" data-bs-toggle="dropdown" aria-label="Notifications">
                    <span class="badge bg-red"></span>
                    <i class="fa-solid fa-bell icon"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-end dropdown-menu-card">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Notifications</h3>
                        </div>
                        <div class="list-group list-group-flush list-group-hoverable">
                            <a href="#" class="list-group-item">New message<span
                                    class="badge bg-green ms-auto">2</span></a>
                            <a href="#" class="list-group-item">Build succeeded</a>
                            <a href="#" class="list-group-item disabled">No more alerts</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Language switcher -->
            <div class="nav-item dropdown me-2">
                <a href="#" class="nav-link" data-bs-toggle="dropdown" aria-label="Langue">
                    <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                        viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 5h7" />
                        <path d="M9 3v2c0 4.418 -2.239 8 -5 8" />
                        <path d="M5 9c1.5 0 3 .5 4 1.5" />
                        <path d="M15 5l6 6" />
                        <path d="M20 5l-6 6" />
                    </svg>
                </a>
                <div class="dropdown-menu dropdown-menu-end">
                    <a class="dropdown-item" href="#">Français</a>
                    <a class="dropdown-item" href="#">English</a>
                    <a class="dropdown-item" href="#">Español</a>
                </div>
            </div>

            <!-- User menu -->
            <div class="nav-item dropdown">
                <a href="#" class="nav-link d-flex lh-1 text-reset" data-bs-toggle="dropdown"
                    aria-label="Open user menu">
                    <span class="avatar avatar-sm" style="background-image: url(/static/avatars/044m.jpg)"></span>
                    <div class="d-none d-xl-block ps-2">
                        <div>Paweł Kuna</div>
                        <div class="mt-1 small text-secondary">UI Designer</div>
                    </div>
                </a>
                <div class="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                    <a href="#" class="dropdown-item">Status</a>
                    <a href="./profile.html" class="dropdown-item">Profile</a>
                    <a href="#" class="dropdown-item">Feedback</a>
                    <div class="dropdown-divider"></div>
                    <a href="./settings.html" class="dropdown-item">Settings</a>
                    <a href="./sign-in.html" class="dropdown-item">Logout</a>
                </div>
            </div>
        </div>

        <!-- LEFT/CENTER: main menu + search inside collapsible -->
        <div class="collapse navbar-collapse" id="navbar-menu">
            <div class="d-flex flex-column flex-md-row align-items-md-center w-100">
                <ul class="navbar-nav">
                    <li class="nav-item active">
                        <a class="nav-link" href="#">
                            <span class="nav-link-icon">
                                <i class="fa-solid fa-house icon"></i>
                            </span>
                            <span class="nav-link-title">Home</span>
                        </a>
                    </li>

                    <!-- Simple link with badge -->
                    <li class="nav-item">
                        <a class="nav-link" href="#">
                            <span class="nav-link-icon">
                                <i class="fa-regular fa-envelope icon"></i>
                            </span>
                            <span class="nav-link-title">Inbox <span class="badge bg-green ms-1">12</span></span>
                        </a>
                    </li>

                    <!-- Classic dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown" role="button"
                            aria-expanded="false">
                            <span class="nav-link-icon">
                                <i class="fa-solid fa-layer-group icon"></i>
                            </span>
                            <span class="nav-link-title">Interface</span>
                        </a>
                        <div class="dropdown-menu">
                            <div class="dropdown-header">Navigation</div>
                            <a class="dropdown-item" href="#">Overview</a>
                            <a class="dropdown-item" href="#">Reports</a>
                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item disabled" href="#" tabindex="-1"
                                aria-disabled="true">Disabled</a>
                        </div>
                    </li>

                    <!-- Mega menu -->
                    <li class="nav-item dropdown megamenu">
                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown" role="button"
                            aria-expanded="false">
                            <span class="nav-link-icon">
                                <i class="fa-solid fa-table-cells-large icon"></i>
                            </span>
                            <span class="nav-link-title">Mega menu</span>
                        </a>
                        <div class="dropdown-menu p-3">
                            <div class="row g-3">
                                <div class="col-12 col-md-4">
                                    <div class="dropdown-header">Getting started</div>
                                    <a class="dropdown-item" href="#">Installation</a>
                                    <a class="dropdown-item" href="#">Layout</a>
                                    <a class="dropdown-item" href="#">Themes</a>
                                </div>
                                {{-- <div class="col-12 col-md-4">
                                    <div class="dropdown-header">Components</div>
                                    <a class="dropdown-item" href="#">Buttons</a>
                                    <a class="dropdown-item" href="#">Forms</a>
                                    <a class="dropdown-item" href="#">Tables</a>
                                </div> --}}
                                {{-- <div class="col-12 col-md-4">
                                    <div class="dropdown-header">Resources</div>
                                    <a class="dropdown-item" href="#">Docs</a>
                                    <a class="dropdown-item" href="#">Changelog</a>
                                    <a class="dropdown-item" href="#">Support</a>
                                </div> --}}
                            </div>
                        </div>
                    </li>

                    <!-- Multi-level dropdown -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown" role="button"
                           aria-expanded="false" data-bs-auto-close="outside">
                            <span class="nav-link-icon">
                                <i class="fa-solid fa-sitemap icon"></i>
                            </span>
                            <span class="nav-link-title">Multi-level</span>
                        </a>
                        <div class="dropdown-menu">
                            <a class="dropdown-item" href="#">Level 1 — Action</a>

                            <!-- Level 1.1 submenu (opens to the right) -->
                            <div class="dropend dropdown-submenu" data-bs-auto-close="outside">
                                <a class="dropdown-item dropdown-toggle" href="#" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                    Level 1.1 — Submenu
                                </a>
                                <div class="dropdown-menu">
                                    <a class="dropdown-item" href="#">Level 2 — Item A</a>
                                    <a class="dropdown-item" href="#">Level 2 — Item B</a>

                                    <!-- Level 2 deep submenu (opens to the right) -->
                                    <div class="dropend dropdown-submenu" data-bs-auto-close="outside">
                                        <a class="dropdown-item dropdown-toggle" href="#" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                                            Level 2 — Deep submenu
                                        </a>
                                        <div class="dropdown-menu">
                                            <a class="dropdown-item" href="#">Level 3 — Leaf 1</a>
                                            <a class="dropdown-item" href="#">Level 3 — Leaf 2</a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="dropdown-divider"></div>
                            <a class="dropdown-item" href="#">Level 1 — Another action</a>
                        </div>
                    </li>

                    <!-- Disabled example -->
                    <li class="nav-item">
                        <a class="nav-link disabled" href="#" tabindex="-1" aria-disabled="true">
                            <span class="nav-link-icon">
                                <i class="fa-solid fa-ban icon"></i>
                            </span>
                            <span class="nav-link-title">Disabled</span>
                        </a>
                    </li>
                </ul>

                <!-- Search form -->
                <form class="ms-md-3 mt-3 mt-md-0 d-none d-md-flex" role="search">
                    <div class="input-icon">
                        <span class="input-icon-addon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                                viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M10 6a4 4 0 1 0 0 8a4 4 0 0 0 0 -8" />
                                <path d="M21 21l-6 -6" />
                            </svg>
                        </span>
                        <input type="search" class="form-control" placeholder="Search…"
                            aria-label="Search in navigation">
                    </div>
                </form>
            </div>
        </div>
    </div>
</header>
