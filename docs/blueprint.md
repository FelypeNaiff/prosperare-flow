# **App Name**: ContaHub

## Core Features:

- User & Access Management: Secure login via Google OAuth (Gmail) only, with strict administrator-controlled user creation and deactivation, enforcing profile-based access (Sócio, Administrador, Contador/Gestor, Assistente) to modules and data.
- Intelligent Dashboard & Reporting: A comprehensive, profile-tailored dashboard presenting key performance indicators, dynamic graphs (e.g., fiscal obligations status, client tax regimes, revenue trends), and critical alerts for tasks, certificates, and financials, with all data displayed without page reloads.
- Client Relationship Management (CRM): Manage client profiles with automated CNPJ lookup via ReceitaWS for initial data entry, allowing for comprehensive client data, financial details, and a health score calculation based on their compliance status.
- Process & Task Automation: Dynamic task management system with 'Trello-style' process views, calendar integration for deadlines, and automatic generation of recurring fiscal obligations based on client regimes and configurable templates.
- Automated Certificate Management: Track, manage, and monitor all negative certificates (CNDs) for clients with automatic daily checks, status updates (valid, expiring, expired), and an advanced notification system that generates tasks and email alerts.
- Integrated Financial Management: Oversee accounts receivable (honorários) with automatic monthly generation for active clients, accounts payable, cash flow visualization, and an aging analysis for delinquency, including various payment status and forms.
- AI-Powered Communication Assistant Tool: Utilize an AI tool to assist in drafting personalized, compliant email communications to clients regarding upcoming fiscal deadlines, process updates, document requests, or status changes, leveraging their stored data for accurate and efficient outreach.

## Style Guidelines:

- Primary brand color: A deep, professional Slate Blue (#2C4156) for sidebar backgrounds, titles, primary buttons, and table headers, conveying stability and a corporate identity in a light-themed interface.
- Secondary accent color: A subtle Teal Gray (#39586D) for subtitles and hover states, providing gentle emphasis and interaction feedback.
- Main background: A clean and unobtrusive Off-White (#F7F7F7) for page backgrounds, ensuring readability and a sense of clarity.
- Card and panel surfaces: Crisp White (#FFFFFF) with a delicate Cool Gray (#D2D7DB) border, emphasizing individual content blocks and visual organization.
- Status indicators (Positive): A vibrant Forest Green (#2E9E6B) to denote 'concluded', 'paid', or 'valid' statuses.
- Status indicators (Warning): A warm Ochre Yellow (#C08A1E) to indicate 'pending' or 'due soon' situations, prompting attention.
- Status indicators (Critical): A strong Cardinal Red (#C0392B) to highlight 'overdue', 'expired', or 'delinquent' items, demanding immediate action.
- Status indicators (Informative/In Progress): A clear Steel Blue (#2574A9) representing 'in progress' states, also serving as a distinct informational accent.
- Headline and body text font: 'DM Sans', a clean and modern sans-serif. Chosen for its excellent readability and professional appearance, suitable for an ERP system requiring clear presentation of complex information across all screen sizes.
- A set of clean, professional, and consistent line icons that visually complement the interface, used strategically for navigation, categorization, and status indication, enhancing user understanding and experience.
- A highly structured and responsive layout featuring a fixed dark sidebar for primary navigation, card-based dashboards for at-a-glance KPIs, and efficient tabular data displays. Client-specific details are organized with clear tabs, and process management leverages a 'Trello-style' lateral panel for intuitive workflow interaction. Designed for seamless experience across desktop, tablet, and mobile devices.
- Subtle and functional animations primarily for transitions, state changes (e.g., loading, form submission success), and interactive element feedback (like hovers), providing a smooth user experience without causing distraction or delays.