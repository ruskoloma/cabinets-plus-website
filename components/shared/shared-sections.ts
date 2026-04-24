export interface SharedSectionsDocument {
  contactSection?: Record<string, unknown> | null;
  showroomSection?: Record<string, unknown> | null;
  aboutSection?: Record<string, unknown> | null;
  partnersSection?: Record<string, unknown> | null;
  countertopPartnersSection?: Record<string, unknown> | null;
  flooringPartnersSection?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface SharedSectionsQueryLikeResult {
  data: { sharedSections?: SharedSectionsDocument | null };
  query?: string;
  variables?: Record<string, unknown>;
}

export const SHARED_SECTIONS_QUERY = `
  query SharedSectionsDocument($relativePath: String!) {
    sharedSections: pageSettings(relativePath: $relativePath) {
      ... on Document {
        id
        _sys {
          filename
          basename
          relativePath
        }
      }
      ... on PageSettingsSharedSections {
        contactSection {
          title
          image
          imageSize
          nameLabel
          namePlaceholder
          emailLabel
          emailPlaceholder
          messageLabel
          messagePlaceholder
          submitLabel
        }
        showroomSection {
          showroomTitle
          followUsLabel
          mapEmbedUrl
        }
        aboutSection {
          stats {
            value
            label
          }
          membershipDesktopLogo
          membershipMobileTopLogo
          membershipMobileBottomLogo
          membershipLabel
          partnershipLabel
          partnerLogos {
            logo
            alt
            href
          }
          ctaLabel
          ctaLink
        }
        partnersSection {
          title
          description
          footnote
          partnerLogos {
            logo
            alt
            url
          }
        }
        countertopPartnersSection {
          title
          description
          footnote
          partnerLogos {
            logo
            alt
            url
          }
        }
        flooringPartnersSection {
          title
          description
          footnote
          partnerLogos {
            logo
            alt
            url
          }
        }
      }
    }
  }
`;

export const FALLBACK_SHARED_SECTIONS: SharedSectionsDocument = {
  contactSection: {
    title: "Contact us",
    image: "https://cabinetsplus4630.s3.us-west-2.amazonaws.com/library/home/contact-figma.jpg",
    nameLabel: "Name",
    namePlaceholder: "Enter your name",
    emailLabel: "Email",
    emailPlaceholder: "Enter your email",
    messageLabel: "Project Idea (optional)",
    messagePlaceholder: "Tell us more about your project",
    submitLabel: "Send request",
  },
  showroomSection: {
    showroomTitle: "Our showroom",
    followUsLabel: "Follow us",
  },
  aboutSection: {},
  partnersSection: {},
  countertopPartnersSection: {},
  flooringPartnersSection: {},
};

const SHARED_SECTION_MARKERS = {
  sharedContactSection: {
    key: "contactSection",
    renderTemplate: "contactSection",
  },
  sharedShowroomSection: {
    key: "showroomSection",
    renderTemplate: "showroomSection",
  },
  sharedAboutSection: {
    key: "aboutSection",
    renderTemplate: "aboutSection",
  },
  sharedPartnersSection: {
    key: "partnersSection",
    renderTemplate: "partnersSection",
  },
  sharedCountertopPartnersSection: {
    key: "countertopPartnersSection",
    renderTemplate: "countertopPartnersSection",
  },
  sharedFlooringPartnersSection: {
    key: "flooringPartnersSection",
    renderTemplate: "flooringPartnersSection",
  },
} as const;

const SHARED_SECTION_TYPENAME_SUFFIXES: Record<string, keyof typeof SHARED_SECTION_MARKERS> = {
  SharedContactSection: "sharedContactSection",
  SharedShowroomSection: "sharedShowroomSection",
  SharedAboutSection: "sharedAboutSection",
  SharedPartnersSection: "sharedPartnersSection",
  SharedCountertopPartnersSection: "sharedCountertopPartnersSection",
  SharedFlooringPartnersSection: "sharedFlooringPartnersSection",
};

type SharedSectionMarker = keyof typeof SHARED_SECTION_MARKERS;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function getSharedSectionMarker(block: Record<string, unknown>): SharedSectionMarker | null {
  const template = typeof block._template === "string" ? block._template : "";
  if (template && template in SHARED_SECTION_MARKERS) return template as SharedSectionMarker;

  const typename = typeof block.__typename === "string" ? block.__typename : "";
  const suffix = Object.keys(SHARED_SECTION_TYPENAME_SUFFIXES).find((value) => typename.endsWith(value));
  return suffix ? SHARED_SECTION_TYPENAME_SUFFIXES[suffix] : null;
}

export function isSharedSectionMarker(block: unknown): boolean {
  const record = asRecord(block);
  return record ? Boolean(getSharedSectionMarker(record)) : false;
}

export function resolveSharedSectionBlock(
  block: Record<string, unknown>,
  sharedSections: SharedSectionsDocument | null | undefined,
): Record<string, unknown> {
  const marker = getSharedSectionMarker(block);
  if (!marker) return block;

  const config = SHARED_SECTION_MARKERS[marker];
  const sharedBlock = asRecord(sharedSections?.[config.key]);

  return {
    ...(sharedBlock || {}),
    _template: config.renderTemplate,
    _sharedTemplate: marker,
    _sharedSourceKey: config.key,
    _sharedMarker: block,
  };
}

export function resolveSharedSectionBlocks(
  blocks: unknown,
  sharedSections: SharedSectionsDocument | null | undefined,
): Record<string, unknown>[] {
  if (!Array.isArray(blocks)) return [];

  return blocks
    .map((block) => asRecord(block))
    .filter((block): block is Record<string, unknown> => Boolean(block))
    .map((block) => resolveSharedSectionBlock(block, sharedSections));
}

export function readSharedSectionBlock(
  sharedSections: SharedSectionsDocument | null | undefined,
  key: keyof SharedSectionsDocument,
): Record<string, unknown> | null {
  return asRecord(sharedSections?.[key]);
}
