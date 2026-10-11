export const portfolioContent = {
  profile: {
    name: "K Jasmitha Devi",
    headline: "CSE-AIML Student | Aspiring AI & Full-Stack Developer",
    location: "Hyderabad, India",
    college:
      "VNR Vignana Jyothi Institute of Engineering and Technology, Hyderabad, Telangana, India",
    degree: "B.Tech CSE (Artificial Intelligence and Machine Learning)",
    year: "Second year, third semester",
    expectedGraduation: "2029",
    firstYearOverallCgpa: "9.6",
    email: "jasmithakadari@gmail.com",
    github: "https://github.com/Jasmitha-Devi",
    linkedin: "https://www.linkedin.com/in/jasmitha-kadari-82141a377/",
  },
  about:
    "I'm a second-year CSE-AIML student interested in software development, AI, logical problem-solving, and building practical applications. I've worked with C and Python, learned frontend fundamentals, explored backend development, and built projects in route intelligence and Python code analysis. I'm strengthening my DSA and full-stack skills while exploring how AI can solve real-world problems. I learn through hands-on experimentation and by understanding the systems I build.",
  waysOfWorking: [
    "Hands-on experimentation",
    "Understanding what I build",
    "Strengthening DSA",
    "Exploring AI for real-world problems",
  ],
  learningJourney: [
    "Worked with C and Python",
    "Learned frontend fundamentals",
    "Explored backend development",
    "Built route-intelligence and Python code-analysis projects",
    "Continuing to strengthen DSA and full-stack skills",
  ],
  skills: [
    {
      category: "Programming",
      items: [
        { name: "C", level: "Foundations" },
        { name: "Python", level: "Applied in projects" },
      ],
    },
    {
      category: "Frontend",
      items: [
        { name: "HTML", level: "Foundations" },
        { name: "CSS", level: "Foundations" },
        { name: "JavaScript", level: "Applied in projects" },
      ],
    },
    {
      category: "Backend",
      items: [
        { name: "FastAPI", level: "Applied in projects" },
        { name: "Node.js", level: "Learning" },
        { name: "Express.js", level: "Learning" },
      ],
    },
    {
      category: "Computer Science",
      items: [
        { name: "Data Structures and Algorithms", level: "Learning" },
        { name: "Logical problem-solving", level: "Ongoing practice" },
      ],
    },
  ],
  projects: [
    {
      id: "harvest-shield",
      name: "Harvest Shield",
      subtitle: "Cargo-Centric Multi-Modal Routing for Perishable Goods",
      repository: "https://github.com/Jasmitha-Devi/Harvest-Sheild",
      status: "Deployed · validation and learning continuing",
      summary:
        "Explores cargo-centric route planning for perishable goods by combining road-route alternatives with traffic, incident, and weather context.",
      problem:
        "A route for perishable cargo can be affected by more than road distance; route conditions also matter.",
      approach:
        "The inspected backend requests actual route alternatives from OSRM and assesses available traffic and current-weather context. Incident data is optional when the provider does not return it.",
      technologies: [
        "FastAPI",
        "JavaScript",
        "Leaflet",
        "OSRM",
        "TomTom Traffic",
        "Open-Meteo",
      ],
      integrity:
        "Uses real routing information and external traffic, incident, and weather data where returned. The app also performs its own risk calculations; incomplete provider data is not treated as a real zero.",
      implemented: [
        "Requests real road routes and the alternatives the routing provider returns",
        "Evaluates route risk using available traffic and current-weather data",
        "Shows a map-based route comparison",
      ],
      intended: [
        "Continue validating route-risk logic and understanding how the system is put together",
      ],
      limitations: [
        "No validated ETA-accuracy, fuel-saving, delay, or spoilage-prevention claim",
        "A route alternative is shown only when the routing provider returns it",
        "Built with AI assistance; implementation validation and learning are ongoing",
      ],
      categories: ["AI", "Backend"],
    },
    {
      id: "python-complexity-lab",
      name: "Python Code Complexity Lab",
      subtitle: "Static Python Code Analysis and Complexity Estimation",
      repository:
        "https://github.com/Jasmitha-Devi/PythonCode-Complexity-Lab",
      status: "Deployed · estimates need continued validation",
      summary:
        "A web app that analyzes Python source with a built-in AST parser, handwritten complexity rules, and recognizable algorithm-pattern checks.",
      problem:
        "Complexity estimates can be hard to interpret when the reasoning and limits are hidden.",
      approach:
        "Analyzes source statically and explains estimates from code structure and recognized patterns. Submitted code is not executed.",
      technologies: [
        "Python",
        "AST analysis",
        "Static analysis",
        "Rule and pattern-based estimation",
        "Web interface",
      ],
      integrity:
        "Estimates are limited by implemented rules and pattern recognition. The repository includes tests; it does not establish a trained model or validated accuracy score.",
      implemented: [
        "Parses Python source into an AST",
        "Applies code-structure rules and selected algorithm-pattern recognizers",
        "Returns estimated time/space information and explanatory details",
      ],
      intended: [
        "Continue testing and validating which patterns the analyzer can recognize reliably",
      ],
      limitations: [
        "Not a perfect or complete Big-O analyzer",
        "Confidence labels describe analyzer certainty, not benchmarked accuracy",
        "Submitted source is analyzed statically and never executed",
      ],
      categories: ["AI", "Backend", "Frontend"],
    },
    {
      id: "expiry-guard",
      name: "ExpiryGuard",
      subtitle: "Expiry Management and Risk Awareness",
      repository: "https://github.com/Jasmitha-Devi/ExpiryGuard",
      status: "Work in progress",
      summary:
        "An in-development expiry-management project. Its public repository currently contains a Streamlit interface and CSV-backed example screens for inventory risk, demand forecasts, and transfer planning.",
      problem:
        "Expiry risk is the problem explored by the project; the current repository is not evidence of a validated operational system.",
      approach:
        "The repository reads local CSV files for its current example views.",
      technologies: ["Python", "Streamlit", "CSV example data"],
      integrity:
        "The existing views are a work in progress. No live data connection, trained AI model, notification system, or validated forecast is claimed.",
      implemented: [
        "A Streamlit interface with example inventory-risk and transfer-planning views",
        "Local CSV inputs for the current screens",
      ],
      intended: [
        "Continue exploring expiry management and risk awareness",
      ],
      limitations: [
        "Not a validated predictive system",
        "Example views do not establish real-world performance",
      ],
      categories: ["Work in progress", "Backend"],
    },
  ],
  hackathons: [
    {
      name: "Smart India Hackathon (SIH)",
      note:
        "Explored forecasting expected arrival times of passenger trains, including operational and delay factors. No working or validated system is claimed.",
    },
    {
      name: "WebForge AI",
      note:
        "Explored a Campus Job Portal concept to help students discover opportunities. No implementation or launch is claimed.",
    },
    {
      name: "Software Hackathon",
      note:
        "Explored an expiry-management problem that continues separately as the unfinished ExpiryGuard project.",
      projectId: "expiry-guard",
    },
  ],
  codingProfiles: [
    {
      name: "GitHub",
      username: "Jasmitha-Devi",
      url: "https://github.com/Jasmitha-Devi",
      verified: true,
    },
    {
      name: "LinkedIn",
      username: "Jasmitha Kadari",
      url: "https://www.linkedin.com/in/jasmitha-kadari-82141a377/",
      verified: true,
    },
    {
      name: "LeetCode",
      username: "JasmithaDevi",
      url: null,
      verified: false,
    },
    {
      name: "HackerRank",
      username: "jasmithakadari",
      url: "https://www.hackerrank.com/profile/jasmithakadari",
      verified: true,
    },
    {
      name: "CodeChef",
      username: "jasmithadevi22",
      url: "https://www.codechef.com/users/jasmithadevi22",
      verified: true,
    },
  ],
} as const;

export function portfolioContextFor(query: string): string {
  const normalized = query.toLowerCase();
  const selectedProjects = portfolioContent.projects.filter((project) => {
    const terms = [
      project.name,
      project.id,
      project.subtitle,
      ...project.technologies,
    ];
    return terms.some((term) =>
      normalized.includes(term.toLowerCase().replaceAll("-", " ")),
    ) || (project.id === "harvest-shield" && /harvest|cargo|route/.test(normalized))
      || (project.id === "python-complexity-lab" && /complexity|analy[sz]er|big.?o|ast/.test(normalized))
      || (project.id === "expiry-guard" && /expiry|expiryg|waste|inventory/.test(normalized));
  });
  const includeSkills = /skill|technology|stack|learn|language|python|javascript|fastapi|dsa|frontend|backend/.test(normalized);
  const includeEducation = /education|college|degree|cgpa|semester|graduat|study/.test(normalized);
  const includeLinks = /contact|email|github|linkedin|profile|link/.test(normalized);
  const includeHackathons = /hackathon|sih|webforge|train|campus job/.test(normalized);
  const result = {
    profile: portfolioContent.profile,
    ...(includeEducation ? { education: portfolioContent.profile } : {}),
    ...(includeSkills ? { skills: portfolioContent.skills } : {}),
    ...(selectedProjects.length ? { projects: selectedProjects } : {}),
    ...(includeHackathons ? { hackathons: portfolioContent.hackathons } : {}),
    ...(includeLinks ? { links: portfolioContent.codingProfiles } : {}),
    about: portfolioContent.about,
  };
  return JSON.stringify(result);
}

export function offlinePortfolioAnswer(query: string): string {
  const normalized = query.toLowerCase();
  if (/harvest|cargo|route/.test(normalized)) {
    const project = portfolioContent.projects[0];
    return `${project.name} explores cargo-centric route planning for perishable goods. Its inspected backend requests real OSRM route alternatives and assesses available traffic and current-weather context. Risk estimates are still being validated; no ETA-accuracy or spoilage-prevention claim is made.`;
  }
  if (/complexity|analy[sz]er|big.?o|ast/.test(normalized)) {
    const project = portfolioContent.projects[1];
    return `${project.name} analyzes Python source statically using an AST parser, handwritten rules, and selected pattern recognizers. It estimates complexity; it does not execute submitted code or claim perfect Big-O analysis. Continued validation is needed.`;
  }
  if (/expiry|expiryg|waste|inventory/.test(normalized)) {
    const project = portfolioContent.projects[2];
    return `${project.name} is a work in progress. The public repository currently contains a Streamlit interface with CSV-backed example screens for inventory risk, demand forecasts, and transfer planning. No validated predictive system is claimed.`;
  }
  if (/skill|technology|stack|learn|language|python|javascript|fastapi|dsa|frontend|backend/.test(normalized)) {
    const summary = portfolioContent.skills
      .map((group) => `${group.category}: ${group.items.map((item) => item.name).join(", ")}`)
      .join("; ");
    return `Jasmitha's listed skills are ${summary}. She is continuing to strengthen DSA and full-stack development. This limited assistant can only answer from the portfolio, not provide general technical tutoring.`;
  }
  if (/education|college|degree|cgpa|semester|graduat|study/.test(normalized)) {
    const { college, degree, year, expectedGraduation, firstYearOverallCgpa } =
      portfolioContent.profile;
    return `${portfolioContent.profile.name} is in ${year} of ${degree} at ${college}. Expected graduation: ${expectedGraduation}. First-year overall CGPA: ${firstYearOverallCgpa}.`;
  }
  if (/hackathon|sih|webforge|train|campus job/.test(normalized)) {
    return portfolioContent.hackathons
      .map((item) => `${item.name}: ${item.note}`)
      .join("\n\n");
  }
  if (/about|who is|jasmitha/.test(normalized)) return portfolioContent.about;
  return "AI offline: limited mode. I can answer questions using only the portfolio facts, but I can't provide general technical answers until full AI is available. Try asking about Jasmitha, her projects, skills, education, or hackathon problem explorations.";
}
