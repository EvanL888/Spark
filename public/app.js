const INTEREST_GROUPS = [
  {
    name: "Study & Academic",
    description: "Shared routines, study energy, and library-compatible hangs.",
    tags: [
      "Late night study sessions",
      "Library hangouts",
      "Study groups",
      "Coffee & studying",
      "Tutoring swap",
    ],
  },
  {
    name: "Food & Drink",
    description: "Easy first meets that feel natural on a campus schedule.",
    tags: [
      "Trying new cafes",
      "Campus food spots",
      "Cooking together",
      "Boba runs",
      "Dining hall chats",
    ],
  },
  {
    name: "Active & Outdoors",
    description: "Low-pressure movement and quick loops between classes.",
    tags: [
      "Campus walks",
      "Morning runs",
      "Gym buddies",
      "Frisbee / casual sports",
      "Bike rides",
    ],
  },
  {
    name: "Arts & Culture",
    description: "Good fits for curious people with a soft-plan vibe.",
    tags: [
      "Museum visits",
      "Live music",
      "Film screenings",
      "Photography walks",
      "Thrift shopping",
    ],
  },
  {
    name: "Gaming & Tech",
    description: "Built for nerdy detours, collaborative energy, and niche fun.",
    tags: ["Gaming sessions", "Hackathons", "Tech talks", "Board games", "Anime"],
  },
  {
    name: "Chill & Social",
    description: "Conversation-forward hangs that do not ask too much.",
    tags: [
      "Watching shows together",
      "Venting / life chats",
      "Journaling meetups",
      "People watching",
    ],
  },
];

const MATCHES = [
  {
    id: "jordan",
    firstName: "Jordan",
    lastName: "Lee",
    year: "3rd year",
    major: "Psychology",
    activity: "Coffee chat",
    emoji: "Coffee",
    meta: "Near you | Today | 20 min",
    location: "Blue State Coffee, Student Union - 2nd floor",
    time: "Today | 2:00-3:00pm",
    duration: "~60 min",
    sharedInterests: ["Boba runs", "Trying new cafes", "Campus walks"],
  },
  {
    id: "priya",
    firstName: "Priya",
    lastName: "Nair",
    year: "2nd year",
    major: "Biology",
    activity: "Study session",
    emoji: "Study",
    meta: "Near you | Tomorrow | 90 min",
    location: "Mugar Library, 3rd floor",
    time: "Tomorrow | 10:00-11:30am",
    duration: "~90 min",
    sharedInterests: ["Late night study sessions", "Coffee & studying", "Study groups"],
  },
];

const DISCOVER_ACTIVITIES = [
  {
    title: "Coffee chat",
    meta: "Blue State Coffee | Student Union",
    note: "Warm intro, easy exit, best for people with one class gap.",
  },
  {
    title: "Study session",
    meta: "Mugar Library | Quiet floor",
    note: "Good for shared focus and low-pressure conversation starters.",
  },
  {
    title: "Campus walk",
    meta: "Marsh Plaza loop | 20 min",
    note: "Best when both of you want something active but lightweight.",
  },
];

const PROFILE = {
  name: "Maya Chen",
  firstName: "Maya",
  yearMajor: "2nd year | Computer Science",
  bio: "Looking for study buddies + coffee pals.",
  school: "Boston University",
  interests: [
    "Boba runs",
    "Late night study sessions",
    "Trying new cafes",
    "Campus walks",
    "Film screenings",
  ],
};

const AVAILABILITY = {
  Mon: ["Morning", "Evening"],
  Tue: ["Afternoon"],
  Wed: ["Morning", "Afternoon"],
  Thu: ["Evening"],
  Fri: ["Afternoon", "Evening"],
  Sat: ["Morning"],
  Sun: ["Afternoon"],
};

const SPARK_TIPS = [
  "No pressure to be best friends after one meetup.",
  "The activity is your icebreaker, so let it carry the first few minutes.",
  "If it goes well, you can Spark again later.",
];

const state = {
  selectedInterests: new Set(PROFILE.interests.slice(0, 3)),
  activeView: "home",
  currentMatchIndex: 0,
  incomingOpen: false,
};

const els = {
  onboardingScreen: document.getElementById("onboarding-screen"),
  appShell: document.getElementById("app-shell"),
  interestGroups: document.getElementById("interest-groups"),
  startApp: document.getElementById("start-app"),
  topbarTitle: document.getElementById("topbar-title"),
  switchUser: document.getElementById("switch-user"),
  openIncoming: document.getElementById("open-incoming"),
  tabs: Array.from(document.querySelectorAll(".tab")),
  views: {
    home: document.getElementById("view-home"),
    discover: document.getElementById("view-discover"),
    meetups: document.getElementById("view-meetups"),
    profile: document.getElementById("view-profile"),
  },
  openDiscover: document.getElementById("open-discover"),
  matchEmoji: document.getElementById("match-emoji"),
  activityLabel: document.getElementById("activity-label"),
  activityMeta: document.getElementById("activity-meta"),
  matchAvatar: document.getElementById("match-avatar"),
  matchName: document.getElementById("match-name"),
  matchMajor: document.getElementById("match-major"),
  sharedInterestList: document.getElementById("shared-interest-list"),
  sharedSummary: document.getElementById("shared-summary"),
  availabilityCopy: document.getElementById("availability-copy"),
  passMatch: document.getElementById("pass-match"),
  sparkMatch: document.getElementById("spark-match"),
  discoverList: document.getElementById("discover-list"),
  meetupOtherAvatar: document.getElementById("meetup-other-avatar"),
  meetupPairing: document.getElementById("meetup-pairing"),
  meetupActivity: document.getElementById("meetup-activity"),
  meetupLocation: document.getElementById("meetup-location"),
  meetupTime: document.getElementById("meetup-time"),
  meetupDuration: document.getElementById("meetup-duration"),
  tipsList: document.getElementById("tips-list"),
  profileAvatar: document.getElementById("profile-avatar"),
  profileName: document.getElementById("profile-name"),
  profileMeta: document.getElementById("profile-meta"),
  profileBio: document.getElementById("profile-bio"),
  profileInterests: document.getElementById("profile-interests"),
  availabilityGrid: document.getElementById("availability-grid"),
  editBio: document.getElementById("edit-bio"),
  editInterests: document.getElementById("edit-interests"),
  incomingSheet: document.getElementById("incoming-sheet"),
  incomingTimer: document.getElementById("incoming-timer"),
  incomingAvatar: document.getElementById("incoming-avatar"),
  incomingName: document.getElementById("incoming-name"),
  incomingMajor: document.getElementById("incoming-major"),
  incomingActivity: document.getElementById("incoming-activity"),
  incomingTime: document.getElementById("incoming-time"),
  incomingInterests: document.getElementById("incoming-interests"),
  acceptIncoming: document.getElementById("accept-incoming"),
  declineIncoming: document.getElementById("decline-incoming"),
};

function initials(firstName, lastName = "") {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

function currentMatch() {
  return MATCHES[state.currentMatchIndex];
}

function makePill(text, className = "soft-pill") {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function renderInterestGroups() {
  els.interestGroups.innerHTML = "";

  INTEREST_GROUPS.forEach((group) => {
    const card = document.createElement("article");
    card.className = "interest-group";

    const title = document.createElement("h3");
    title.textContent = group.name;

    const description = document.createElement("p");
    description.textContent = group.description;

    const grid = document.createElement("div");
    grid.className = "interest-grid";

    group.tags.forEach((tag) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `interest-tag${state.selectedInterests.has(tag) ? " selected" : ""}`;
      button.textContent = tag;
      button.addEventListener("click", () => toggleInterest(tag));
      grid.appendChild(button);
    });

    card.append(title, description, grid);
    els.interestGroups.append(card);
  });

  els.startApp.disabled = state.selectedInterests.size < 3;
}

function renderMatch() {
  const match = currentMatch();

  els.matchEmoji.textContent = match.emoji;
  els.activityLabel.textContent = match.activity;
  els.activityMeta.textContent = match.meta;
  els.matchAvatar.textContent = initials(match.firstName, match.lastName);
  els.matchName.textContent = `${match.firstName} ${match.lastName} | ${match.year}`;
  els.matchMajor.textContent = match.major;
  els.sharedInterestList.innerHTML = "";
  match.sharedInterests.forEach((interest) => {
    els.sharedInterestList.append(makePill(interest));
  });

  els.sharedSummary.textContent = `You both like ${match.sharedInterests.length} things`;
  els.availabilityCopy.textContent = `${MATCHES.length + 1} people are free near you right now`;
  els.switchUser.textContent = PROFILE.name;
}

function renderDiscover() {
  els.discoverList.innerHTML = "";
  DISCOVER_ACTIVITIES.forEach((activity) => {
    const card = document.createElement("article");
    card.className = "discover-card";

    const title = document.createElement("h3");
    title.textContent = activity.title;

    const meta = document.createElement("p");
    meta.textContent = activity.meta;

    const note = document.createElement("strong");
    note.textContent = activity.note;

    card.append(title, meta, note);
    els.discoverList.append(card);
  });
}

function renderMeetup() {
  const match = currentMatch();
  els.meetupOtherAvatar.textContent = initials(match.firstName, match.lastName);
  els.meetupPairing.textContent = `${PROFILE.firstName} + ${match.firstName}`;
  els.meetupActivity.textContent = match.activity;
  els.meetupLocation.textContent = match.location;
  els.meetupTime.textContent = match.time;
  els.meetupDuration.textContent = match.duration;

  els.tipsList.innerHTML = "";
  SPARK_TIPS.forEach((tip) => {
    const item = document.createElement("li");
    item.textContent = tip;
    els.tipsList.append(item);
  });
}

function renderProfile() {
  els.profileAvatar.textContent = initials("Maya", "Chen");
  els.profileName.textContent = PROFILE.name;
  els.profileMeta.textContent = PROFILE.yearMajor;
  els.profileBio.textContent = PROFILE.bio;
  els.profileInterests.innerHTML = "";
  PROFILE.interests.forEach((interest) => {
    els.profileInterests.append(makePill(interest));
  });

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const periods = ["Morning", "Afternoon", "Evening"];

  els.availabilityGrid.innerHTML = "";
  els.availabilityGrid.append(Object.assign(document.createElement("div"), { className: "availability-cell label" }));
  periods.forEach((period) => {
    const header = document.createElement("div");
    header.className = "availability-cell label";
    header.textContent = period;
    els.availabilityGrid.append(header);
  });

  days.forEach((day) => {
    const dayCell = document.createElement("div");
    dayCell.className = "availability-cell label";
    dayCell.textContent = day;
    els.availabilityGrid.append(dayCell);

    periods.forEach((period) => {
      const cell = document.createElement("button");
      cell.type = "button";
      const active = AVAILABILITY[day]?.includes(period);
      cell.className = `availability-cell${active ? " active" : ""}`;
      cell.textContent = active ? "Free" : "-";
      els.availabilityGrid.append(cell);
    });
  });
}

function renderIncoming() {
  const match = currentMatch();
  els.incomingAvatar.textContent = initials(match.firstName, match.lastName);
  els.incomingName.textContent = `${match.firstName} ${match.lastName} | ${match.year}`;
  els.incomingMajor.textContent = match.major;
  els.incomingActivity.textContent = `${match.activity} at ${match.location}`;
  els.incomingTime.textContent = match.time.replace("|", ",");
  els.incomingTimer.textContent = "You have 2 hours to respond";
  els.incomingInterests.innerHTML = "";
  match.sharedInterests.forEach((interest) => {
    els.incomingInterests.append(makePill(interest));
  });
  els.incomingSheet.classList.toggle("hidden", !state.incomingOpen);
}

function setView(view) {
  state.activeView = view;
  const titleMap = {
    home: "Home",
    discover: "Discover",
    meetups: "Meetups",
    profile: "Profile",
  };

  Object.entries(els.views).forEach(([name, node]) => {
    node.classList.toggle("hidden", name !== view);
  });

  els.tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });

  els.topbarTitle.textContent = titleMap[view];
}

function toggleInterest(tag) {
  if (state.selectedInterests.has(tag)) {
    state.selectedInterests.delete(tag);
  } else {
    state.selectedInterests.add(tag);
  }

  renderInterestGroups();
}

function openIncoming(open) {
  state.incomingOpen = open;
  renderIncoming();
}

function confirmMeetup() {
  openIncoming(false);
  setView("meetups");
  renderMeetup();
}

function cycleMatch() {
  state.currentMatchIndex = (state.currentMatchIndex + 1) % MATCHES.length;
  renderAll();
}

function editBio() {
  const nextBio = window.prompt("Update Maya's bio", PROFILE.bio);
  if (!nextBio) return;
  PROFILE.bio = nextBio.trim();
  renderProfile();
}

function editInterests() {
  PROFILE.interests = Array.from(state.selectedInterests).slice(0, 5);
  renderProfile();
}

function renderAll() {
  renderInterestGroups();
  renderMatch();
  renderDiscover();
  renderMeetup();
  renderProfile();
  renderIncoming();
  setView(state.activeView);
}

els.startApp.addEventListener("click", () => {
  PROFILE.interests = Array.from(state.selectedInterests).slice(0, 5);
  els.onboardingScreen.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  renderAll();
});

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
});

els.openDiscover.addEventListener("click", () => setView("discover"));
els.openIncoming.addEventListener("click", () => openIncoming(true));
els.sparkMatch.addEventListener("click", () => openIncoming(true));
els.passMatch.addEventListener("click", cycleMatch);
els.acceptIncoming.addEventListener("click", confirmMeetup);
els.declineIncoming.addEventListener("click", () => openIncoming(false));
els.editBio.addEventListener("click", editBio);
els.editInterests.addEventListener("click", editInterests);

renderInterestGroups();
