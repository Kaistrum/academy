/**
 * Mock catalogue for Kaistrum Academy. In a real app this would come from a
 * CMS or the LMS API; here it's a static module so every page can import it.
 */

export type CourseFormat = "Web Course" | "Training Seminar" | "Tutorial" | "Learning Path";
export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Lesson {
  title: string;
  minutes: number;
  preview?: boolean;
}

export interface CurriculumSection {
  title: string;
  lessons: Lesson[];
}

export interface Author {
  name: string;
  title: string;
  bio: string;
  rating: number;
  courses: number;
  learners: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Course {
  slug: string;
  title: string;
  category: string;
  format: CourseFormat;
  level: CourseLevel;
  hours: number;
  minutes: number;
  lessons: number;
  rating: number;
  reviews: number;
  learners: string;
  premium: boolean;
  featured?: boolean;
  addedOrder: number; // higher = more recent, for "Recently Added" sort
  summary: string;
  description: string[];
  whatYouLearn: string[];
  requirements: string[];
  author: Author;
  curriculum: CurriculumSection[];
  faqs: Faq[];
}

export interface Category {
  slug: string;
  name: string;
  /** lucide-react icon name, resolved on the page. */
  icon: string;
  blurb: string;
}

export const categories: Category[] = [
  { slug: "getting-started", name: "Getting Started", icon: "Compass", blurb: "Orientation for newcomers to spatial data." },
  { slug: "data-management", name: "Data Management", icon: "Database", blurb: "Model, store and govern spatial datasets." },
  { slug: "mapping", name: "Mapping", icon: "Map", blurb: "Design maps that communicate clearly." },
  { slug: "spatial-analysis", name: "Spatial Analysis & Data Science", icon: "Network", blurb: "Turn location into insight." },
  { slug: "field-operations", name: "Field Operations", icon: "Smartphone", blurb: "Collect and coordinate work in the field." },
  { slug: "scripting", name: "Scripting & Development", icon: "Code2", blurb: "Automate and extend with code." },
  { slug: "remote-sensing", name: "Imagery & Remote Sensing", icon: "Satellite", blurb: "Work with imagery at scale." },
  { slug: "visualization", name: "3D Visualization & Analytics", icon: "Boxes", blurb: "Build immersive 3D scenes and dashboards." },
];

const alex: Author = {
  name: "Dr. Alex Rivera",
  title: "Principal Geospatial Engineer",
  bio: "Alex has spent over a decade building spatial data platforms and teaching practitioners how to move from raw coordinates to decisions. They lead the analytics track at Kaistrum Academy.",
  rating: 4.8,
  courses: 14,
  learners: "48k",
};

const priya: Author = {
  name: "Priya Nair",
  title: "Developer Advocate",
  bio: "Priya writes tooling and tutorials for spatial developers. She's happiest turning a gnarly API into something you can pick up in an afternoon.",
  rating: 4.9,
  courses: 9,
  learners: "31k",
};

const marcus: Author = {
  name: "Marcus Bello",
  title: "Remote Sensing Scientist",
  bio: "Marcus works with satellite and drone imagery for environmental monitoring, and has trained field teams on five continents.",
  rating: 4.7,
  courses: 6,
  learners: "22k",
};

const commonFaqs: Faq[] = [
  {
    q: "Do I need prior experience?",
    a: "Each course lists its level and requirements up front. Beginner courses assume no background; intermediate and advanced courses note the specific skills you'll want first.",
  },
  {
    q: "How long do I have access?",
    a: "Enrolment gives you lifetime access to the course materials, including future updates to the lessons.",
  },
  {
    q: "Is there a certificate?",
    a: "Yes — you earn a shareable Kaistrum Academy certificate once you complete all lessons and the final assessment.",
  },
];

export const courses: Course[] = [
  {
    slug: "building-geoprocessing-models",
    title: "Building Geoprocessing Models",
    category: "Scripting & Development",
    format: "Web Course",
    level: "Intermediate",
    hours: 2,
    minutes: 5,
    lessons: 24,
    rating: 4.6,
    reviews: 132,
    learners: "8.1k",
    premium: true,
    featured: true,
    addedOrder: 12,
    summary:
      "Chain analysis tools into repeatable, shareable models — no code required to start, with room to grow into Python.",
    description: [
      "Manual, click-by-click analysis doesn't scale. In this course you'll learn to capture a workflow once as a visual model and then run it again and again against new data.",
      "You'll start in the visual model builder, then progressively expose the underlying parameters, iterators and Python so your models are robust enough to hand to a colleague.",
    ],
    whatYouLearn: [
      "Design a model from a plain-language workflow",
      "Expose parameters for reusable tools",
      "Iterate over feature classes and rasters",
      "Add branching and error handling",
      "Export a model to a Python script",
      "Share models as geoprocessing packages",
    ],
    requirements: [
      "Comfortable navigating a desktop GIS",
      "Basic understanding of vector and raster data",
    ],
    author: alex,
    curriculum: [
      {
        title: "Foundations",
        lessons: [
          { title: "Why model your workflow?", minutes: 4, preview: true },
          { title: "The model builder tour", minutes: 8, preview: true },
          { title: "Your first three-tool model", minutes: 11 },
        ],
      },
      {
        title: "Parameters & reuse",
        lessons: [
          { title: "Exposing parameters", minutes: 9 },
          { title: "Default values and filters", minutes: 7 },
          { title: "Documenting a tool", minutes: 6 },
        ],
      },
      {
        title: "Iteration & logic",
        lessons: [
          { title: "Iterators explained", minutes: 12 },
          { title: "Branching with preconditions", minutes: 10 },
          { title: "Handling failures gracefully", minutes: 8 },
        ],
      },
      {
        title: "From model to script",
        lessons: [
          { title: "Exporting to Python", minutes: 9 },
          { title: "Packaging and sharing", minutes: 7 },
          { title: "Where to go next", minutes: 4 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "python-tips-for-administration",
    title: "Python Tips & Tricks for GIS Administration",
    category: "Scripting & Development",
    format: "Training Seminar",
    level: "Advanced",
    hours: 1,
    minutes: 0,
    lessons: 9,
    rating: 4.4,
    reviews: 213,
    learners: "13k",
    premium: true,
    featured: true,
    addedOrder: 11,
    summary:
      "A fast-paced seminar of practical Python recipes for automating the tedious parts of administering a GIS.",
    description: [
      "Every administrator accumulates a folder of half-finished scripts. This seminar turns them into a toolkit you'll actually reach for.",
      "We move quickly through real recipes — bulk permission changes, scheduled backups, health reports — that you can adapt the same afternoon.",
    ],
    whatYouLearn: [
      "Automate user and permission management",
      "Schedule and log maintenance scripts",
      "Generate health reports from the API",
      "Safely batch-update item metadata",
      "Package scripts for your team",
    ],
    requirements: ["Working knowledge of Python", "Administrator access to a GIS deployment"],
    author: priya,
    curriculum: [
      {
        title: "Setup",
        lessons: [
          { title: "Environment & authentication", minutes: 7, preview: true },
          { title: "Talking to the admin API", minutes: 9 },
        ],
      },
      {
        title: "Recipes",
        lessons: [
          { title: "Bulk permission changes", minutes: 8 },
          { title: "Scheduled backups", minutes: 10 },
          { title: "Automated health reports", minutes: 9 },
          { title: "Batch metadata updates", minutes: 7 },
        ],
      },
      {
        title: "Ship it",
        lessons: [
          { title: "Logging and alerts", minutes: 6 },
          { title: "Packaging for the team", minutes: 5 },
          { title: "Q&A", minutes: 3 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "utility-network-basics",
    title: "Utility Network Basics",
    category: "Data Management",
    format: "Web Course",
    level: "Intermediate",
    hours: 1,
    minutes: 55,
    lessons: 19,
    rating: 4.5,
    reviews: 88,
    learners: "6.4k",
    premium: true,
    featured: true,
    addedOrder: 10,
    summary:
      "Understand the model behind modern utility networks and how to trace connectivity across your infrastructure.",
    description: [
      "Utility networks capture how real infrastructure connects — pipes, wires, valves and the rules between them. This course demystifies the model.",
      "You'll build a small network from scratch, configure connectivity rules, and run traces that answer real operational questions.",
    ],
    whatYouLearn: [
      "Explain the utility network data model",
      "Configure domains and connectivity rules",
      "Run upstream and downstream traces",
      "Model subnetworks and controllers",
      "Validate network topology",
    ],
    requirements: ["Familiarity with geodatabases", "Basic data modelling concepts"],
    author: alex,
    curriculum: [
      {
        title: "The model",
        lessons: [
          { title: "What is a utility network?", minutes: 6, preview: true },
          { title: "Devices, junctions and edges", minutes: 10 },
          { title: "Connectivity rules", minutes: 9 },
        ],
      },
      {
        title: "Building one",
        lessons: [
          { title: "Setting up the schema", minutes: 12 },
          { title: "Loading data", minutes: 11 },
          { title: "Validating topology", minutes: 8 },
        ],
      },
      {
        title: "Tracing",
        lessons: [
          { title: "Upstream & downstream traces", minutes: 13 },
          { title: "Subnetworks & controllers", minutes: 10 },
          { title: "Operational scenarios", minutes: 9 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "geographically-weighted-regression",
    title: "Geographically Weighted Regression Analysis",
    category: "Spatial Analysis & Data Science",
    format: "Web Course",
    level: "Advanced",
    hours: 2,
    minutes: 30,
    lessons: 22,
    rating: 4.7,
    reviews: 76,
    learners: "4.9k",
    premium: true,
    addedOrder: 9,
    summary:
      "Model relationships that change across space and explain local variation your global model misses.",
    description: [
      "A single global regression assumes a relationship is the same everywhere. It rarely is. GWR lets each location have its own coefficients.",
      "This course walks through the intuition, the diagnostics, and the practical decisions — bandwidth, kernel, and interpretation — with worked examples.",
    ],
    whatYouLearn: [
      "Explain when GWR beats global regression",
      "Choose a kernel and bandwidth",
      "Interpret local coefficients and R²",
      "Diagnose multicollinearity and overfitting",
      "Communicate results with maps",
    ],
    requirements: ["Comfort with basic statistics", "Prior exposure to linear regression"],
    author: alex,
    curriculum: [
      {
        title: "Intuition",
        lessons: [
          { title: "Global vs. local models", minutes: 8, preview: true },
          { title: "The weighting idea", minutes: 10 },
        ],
      },
      {
        title: "Running GWR",
        lessons: [
          { title: "Kernels and bandwidth", minutes: 14 },
          { title: "Fitting the model", minutes: 12 },
          { title: "Reading the diagnostics", minutes: 11 },
        ],
      },
      {
        title: "Interpretation",
        lessons: [
          { title: "Mapping local coefficients", minutes: 13 },
          { title: "Common pitfalls", minutes: 9 },
          { title: "Case study: house prices", minutes: 15 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "experience-builder-basics",
    title: "Web App Experience Builder Basics",
    category: "Mapping",
    format: "Web Course",
    level: "Beginner",
    hours: 1,
    minutes: 40,
    lessons: 16,
    rating: 4.6,
    reviews: 154,
    learners: "11k",
    premium: false,
    featured: true,
    addedOrder: 8,
    summary:
      "Build configurable, responsive web apps around your maps — no front-end code needed.",
    description: [
      "You don't need to be a developer to ship a polished web app. This course teaches the drag-and-drop builder end to end.",
      "By the end you'll have a live, responsive app connected to your own data, complete with widgets and a custom theme.",
    ],
    whatYouLearn: [
      "Navigate the builder interface",
      "Connect maps and data sources",
      "Add and configure widgets",
      "Design responsive layouts",
      "Theme and brand your app",
      "Publish and share",
    ],
    requirements: ["A free account", "A hosted web map to start from"],
    author: priya,
    curriculum: [
      {
        title: "Getting oriented",
        lessons: [
          { title: "The builder tour", minutes: 6, preview: true },
          { title: "Templates vs. blank canvas", minutes: 7, preview: true },
          { title: "Connecting your first map", minutes: 9 },
        ],
      },
      {
        title: "Widgets",
        lessons: [
          { title: "Essential widgets", minutes: 12 },
          { title: "Filters and search", minutes: 10 },
          { title: "Charts and lists", minutes: 11 },
        ],
      },
      {
        title: "Polish & publish",
        lessons: [
          { title: "Responsive layouts", minutes: 10 },
          { title: "Theming", minutes: 8 },
          { title: "Publishing your app", minutes: 6 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "metadata-essentials",
    title: "Metadata Essentials for AI-Ready Data",
    category: "Data Management",
    format: "Training Seminar",
    level: "Intermediate",
    hours: 1,
    minutes: 15,
    lessons: 11,
    rating: 4.3,
    reviews: 61,
    learners: "3.7k",
    premium: false,
    addedOrder: 7,
    summary:
      "Good metadata is what makes a dataset discoverable, trustworthy, and ready for machine consumption.",
    description: [
      "As pipelines and models increasingly consume spatial data automatically, metadata stops being paperwork and becomes infrastructure.",
      "This seminar covers the standards, the practical minimum, and how to automate metadata so it stays accurate.",
    ],
    whatYouLearn: [
      "Understand core metadata standards",
      "Write the practical minimum that matters",
      "Automate metadata capture",
      "Make datasets discoverable",
      "Prepare data for automated consumption",
    ],
    requirements: ["Basic data management experience"],
    author: alex,
    curriculum: [
      {
        title: "Why it matters",
        lessons: [
          { title: "Metadata as infrastructure", minutes: 7, preview: true },
          { title: "Standards overview", minutes: 9 },
        ],
      },
      {
        title: "In practice",
        lessons: [
          { title: "The practical minimum", minutes: 10 },
          { title: "Automating capture", minutes: 12 },
          { title: "Discoverability", minutes: 8 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "field-data-collection",
    title: "Field Data Collection with Mobile Apps",
    category: "Field Operations",
    format: "Web Course",
    level: "Beginner",
    hours: 1,
    minutes: 30,
    lessons: 15,
    rating: 4.8,
    reviews: 198,
    learners: "16k",
    premium: false,
    featured: true,
    addedOrder: 6,
    summary:
      "Design smart forms, work offline, and sync field observations back to the office reliably.",
    description: [
      "Field crews need apps that work where there's no signal and don't get in the way. This course covers designing and deploying those apps.",
      "You'll build a survey, add logic and validation, test the offline workflow, and monitor incoming data.",
    ],
    whatYouLearn: [
      "Design effective mobile forms",
      "Add smart logic and validation",
      "Configure offline maps",
      "Manage sync and conflicts",
      "Monitor field work in real time",
    ],
    requirements: ["No prior experience required"],
    author: marcus,
    curriculum: [
      {
        title: "Design",
        lessons: [
          { title: "Forms that field crews love", minutes: 8, preview: true },
          { title: "Smart logic & validation", minutes: 11 },
          { title: "Media and attachments", minutes: 7 },
        ],
      },
      {
        title: "Offline",
        lessons: [
          { title: "Offline map areas", minutes: 10 },
          { title: "Sync strategies", minutes: 9 },
          { title: "Resolving conflicts", minutes: 8 },
        ],
      },
      {
        title: "Oversight",
        lessons: [
          { title: "Real-time dashboards", minutes: 9 },
          { title: "Quality assurance", minutes: 7 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "imagery-analysis-fundamentals",
    title: "Imagery Analysis Fundamentals",
    category: "Imagery & Remote Sensing",
    format: "Web Course",
    level: "Beginner",
    hours: 2,
    minutes: 10,
    lessons: 20,
    rating: 4.5,
    reviews: 103,
    learners: "7.2k",
    premium: true,
    addedOrder: 5,
    summary:
      "From pixels to information: learn to work with multispectral imagery and extract meaning from it.",
    description: [
      "Satellite and aerial imagery is a firehose of data. This course teaches the fundamentals of turning that data into answers.",
      "You'll learn about bands and indices, visual interpretation, and simple classification — the foundation for everything in remote sensing.",
    ],
    whatYouLearn: [
      "Understand bands and spectral signatures",
      "Compute and interpret indices like NDVI",
      "Perform basic image classification",
      "Assess classification accuracy",
      "Prepare imagery for analysis",
    ],
    requirements: ["Basic GIS familiarity"],
    author: marcus,
    curriculum: [
      {
        title: "Pixels & bands",
        lessons: [
          { title: "How imagery is stored", minutes: 8, preview: true },
          { title: "Spectral signatures", minutes: 11 },
          { title: "Band combinations", minutes: 10 },
        ],
      },
      {
        title: "Indices",
        lessons: [
          { title: "NDVI and friends", minutes: 12 },
          { title: "Building custom indices", minutes: 9 },
        ],
      },
      {
        title: "Classification",
        lessons: [
          { title: "Supervised classification", minutes: 14 },
          { title: "Accuracy assessment", minutes: 10 },
          { title: "Common mistakes", minutes: 8 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "intro-to-spatial-data",
    title: "Introduction to Spatial Data",
    category: "Getting Started",
    format: "Tutorial",
    level: "Beginner",
    hours: 0,
    minutes: 55,
    lessons: 10,
    rating: 4.9,
    reviews: 341,
    learners: "27k",
    premium: false,
    featured: true,
    addedOrder: 4,
    summary:
      "The absolute basics: what spatial data is, how it's structured, and why location changes everything.",
    description: [
      "Everything else at the Academy builds on this. If you're new to working with location, start here.",
      "In under an hour you'll understand coordinates, projections, vector and raster data, and how to load your first dataset.",
    ],
    whatYouLearn: [
      "Explain what makes data 'spatial'",
      "Read coordinates and projections",
      "Tell vector from raster",
      "Load and view your first dataset",
    ],
    requirements: ["None — this is the starting point"],
    author: priya,
    curriculum: [
      {
        title: "Basics",
        lessons: [
          { title: "What is spatial data?", minutes: 5, preview: true },
          { title: "Coordinates & projections", minutes: 9, preview: true },
          { title: "Vector vs. raster", minutes: 8 },
        ],
      },
      {
        title: "Hands-on",
        lessons: [
          { title: "Loading your first dataset", minutes: 10 },
          { title: "Making a simple map", minutes: 11 },
          { title: "Where to go next", minutes: 4 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "3d-scenes-and-analytics",
    title: "3D Scenes & Visual Analytics",
    category: "3D Visualization & Analytics",
    format: "Web Course",
    level: "Intermediate",
    hours: 1,
    minutes: 50,
    lessons: 18,
    rating: 4.6,
    reviews: 72,
    learners: "5.1k",
    premium: true,
    addedOrder: 3,
    summary:
      "Build immersive 3D scenes and pair them with dashboards that make complex data legible.",
    description: [
      "A well-built 3D scene can communicate in seconds what a table never will. This course covers scene design and the analytics that go with it.",
      "You'll compose a scene with buildings and terrain, add visual variables, and wire it to a live dashboard.",
    ],
    whatYouLearn: [
      "Compose a 3D scene with terrain and buildings",
      "Use visual variables to encode data",
      "Add shadows and realistic lighting",
      "Build a linked dashboard",
      "Publish an interactive scene",
    ],
    requirements: ["Comfort making 2D web maps"],
    author: alex,
    curriculum: [
      {
        title: "Scene design",
        lessons: [
          { title: "From 2D to 3D", minutes: 8, preview: true },
          { title: "Terrain and basemaps", minutes: 10 },
          { title: "Adding buildings", minutes: 11 },
        ],
      },
      {
        title: "Encoding data",
        lessons: [
          { title: "Visual variables", minutes: 12 },
          { title: "Lighting and shadows", minutes: 9 },
        ],
      },
      {
        title: "Analytics",
        lessons: [
          { title: "Linking a dashboard", minutes: 13 },
          { title: "Publishing", minutes: 7 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "cartography-for-the-web",
    title: "Cartography for the Web",
    category: "Mapping",
    format: "Web Course",
    level: "Intermediate",
    hours: 2,
    minutes: 0,
    lessons: 21,
    rating: 4.7,
    reviews: 119,
    learners: "9.3k",
    premium: false,
    addedOrder: 2,
    summary:
      "Design principles that make web maps clear, accessible, and beautiful across every screen.",
    description: [
      "Good web cartography is deliberate. This course covers the principles — hierarchy, colour, type — applied specifically to interactive maps.",
      "You'll redesign a cluttered map into something legible, and learn to make choices you can defend.",
    ],
    whatYouLearn: [
      "Apply visual hierarchy to maps",
      "Choose accessible colour schemes",
      "Design for zoom levels",
      "Label maps effectively",
      "Test maps for accessibility",
    ],
    requirements: ["Some experience making web maps"],
    author: priya,
    curriculum: [
      {
        title: "Principles",
        lessons: [
          { title: "What makes a map clear", minutes: 9, preview: true },
          { title: "Hierarchy and figure-ground", minutes: 11 },
          { title: "Colour that works", minutes: 12 },
        ],
      },
      {
        title: "At scale",
        lessons: [
          { title: "Designing across zoom levels", minutes: 13 },
          { title: "Labelling", minutes: 10 },
        ],
      },
      {
        title: "Accessibility",
        lessons: [
          { title: "Colour-blind safe palettes", minutes: 9 },
          { title: "Testing your maps", minutes: 8 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
  {
    slug: "spatial-sql-crash-course",
    title: "Spatial SQL Crash Course",
    category: "Data Management",
    format: "Tutorial",
    level: "Intermediate",
    hours: 1,
    minutes: 20,
    lessons: 13,
    rating: 4.8,
    reviews: 87,
    learners: "6.0k",
    premium: false,
    addedOrder: 1,
    summary:
      "Query geometry directly in the database — joins, buffers and intersections without leaving SQL.",
    description: [
      "Once your data lives in a spatial database, SQL becomes a superpower. This crash course gets you productive fast.",
      "You'll write spatial joins, measure distances, and build analysis queries that would take many clicks in a GUI.",
    ],
    whatYouLearn: [
      "Store and index geometry in SQL",
      "Write spatial joins and filters",
      "Measure distance, area and length",
      "Buffer and intersect geometries",
      "Optimise spatial queries",
    ],
    requirements: ["Basic SQL knowledge"],
    author: priya,
    curriculum: [
      {
        title: "Foundations",
        lessons: [
          { title: "Geometry in the database", minutes: 8, preview: true },
          { title: "Spatial indexes", minutes: 9 },
        ],
      },
      {
        title: "Querying",
        lessons: [
          { title: "Spatial joins", minutes: 12 },
          { title: "Distance & measurement", minutes: 10 },
          { title: "Buffers & intersections", minutes: 11 },
        ],
      },
      {
        title: "Performance",
        lessons: [
          { title: "Reading query plans", minutes: 9 },
          { title: "Optimisation tips", minutes: 8 },
        ],
      },
    ],
    faqs: commonFaqs,
  },
];

export const formats: CourseFormat[] = ["Web Course", "Training Seminar", "Tutorial", "Learning Path"];
export const levels: CourseLevel[] = ["Beginner", "Intermediate", "Advanced"];

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function totalMinutes(c: Pick<Course, "hours" | "minutes">): number {
  return c.hours * 60 + c.minutes;
}

export function formatDuration(c: Pick<Course, "hours" | "minutes">): string {
  const parts: string[] = [];
  if (c.hours) parts.push(`${c.hours} Hour${c.hours > 1 ? "s" : ""}`);
  if (c.minutes) parts.push(`${c.minutes} Minute${c.minutes > 1 ? "s" : ""}`);
  return parts.join(", ") || "0 Minutes";
}

/** Format a number as Kenyan Shillings, e.g. 5900 → "KES 5,900". */
export function formatKES(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface CoursePrice {
  price: number;
  original: number;
}

/** Premium courses are priced in KES; free courses return null. */
export function coursePriceKES(course: Pick<Course, "premium" | "hours">): CoursePrice | null {
  if (!course.premium) return null;
  // Roughly scale price with length, rounded to a tidy figure.
  const base = 3900 + course.hours * 1000;
  const price = Math.round(base / 100) * 100;
  return { price, original: Math.round((price * 1.6) / 100) * 100 };
}

/**
 * Rich HTML body for a lesson, used to seed the Tiptap editor on the course
 * content page. Realistic filler — headings, emphasis, lists and a quote —
 * so the editor has something meaningful to render and edit.
 */
export function lessonContentHTML(
  course: Course,
  sectionTitle: string,
  lesson: Lesson,
): string {
  const topic = lesson.title.replace(/[.?]$/, "");
  return `
    <p>Welcome to <strong>${topic}</strong> — part of the <em>${sectionTitle}</em> section of
    <strong>${course.title}</strong>. This lesson runs about ${lesson.minutes} minutes.</p>
    <h3>What we'll cover</h3>
    <p>Follow along with the video above, then work through the notes below. This document is
    fully editable — highlight text to format it, or add your own notes as you go.</p>
    <ul>
      <li>The core idea behind <strong>${topic.toLowerCase()}</strong> and why it matters.</li>
      <li>How it applies to a realistic ${course.category.toLowerCase()} scenario.</li>
      <li>A short exercise to try before moving on.</li>
    </ul>
    <blockquote>Tip: re-explain the concept in your own words right here — teaching it back is
    the fastest way to make it stick.</blockquote>
    <p>When you're comfortable, mark the lesson complete and continue to the next one.</p>
  `;
}
