export interface SocialLink {
  platform: string;
  url: string | null;
  icon: string; // lucide icon name
  label: string;
}

export const socialLinks: SocialLink[] = [
  {
    platform: "facebook",
    url: "https://www.facebook.com/asegurar.limitada",
    icon: "Facebook",
    label: "Facebook",
  },
  {
    platform: "instagram",
    url: "https://www.instagram.com/asegurar.ltda/",
    icon: "Instagram",
    label: "Instagram",
  },
  {
    platform: "linkedin",
    url: "https://www.linkedin.com/company/asegurar-ltda/about/",
    icon: "Linkedin",
    label: "LinkedIn",
  },
];

export const companyWebsite = "https://www.asegurar.com.co/";

/** Returns only socials with valid URLs */
export const getActiveSocials = () => socialLinks.filter((s) => s.url);
