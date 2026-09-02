import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink, ImageRun } from "docx";

export interface StyleProfile {
  headingColor?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  bodySize?: number | null;
}

export interface StructuredResume {
  name: string;
  contact_info: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin_url?: string;
    github_url?: string;
  };
  summary?: string;
  skills?: { category: string; items: string[] }[];
  experience: {
    title: string;
    company: string;
    location?: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    degree: string;
    institution: string;
    location?: string;
    dates: string;
    details?: string[];
  }[];
  projects?: {
    name: string;
    url?: string;
    technologies?: string[];
    dates?: string;
    bullets: string[];
  }[];
  custom_sections?: {
    section_title: string;
    entries: {
      title: string;
      url?: string;
      subtitle?: string;
      dates?: string;
      bullets?: string[];
    }[];
  }[];
}

export async function generateResumeDocx(resume: StructuredResume, styleProfile?: StyleProfile | null): Promise<Blob> {
  const children: Paragraph[] = [];
  const FONT_FAMILY = styleProfile?.bodyFont || styleProfile?.headingFont || "Calibri";
  const HEADER_FONT = styleProfile?.headingFont || FONT_FAMILY;
  const FONT_SIZE = styleProfile?.bodySize ? styleProfile.bodySize * 2 : 22; // 11pt default
  const HEADER_COLOR = styleProfile?.headingColor || "333333";

  // Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: resume.name.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: HEADER_FONT,
          color: HEADER_COLOR,
        }),
      ],
      spacing: { after: 120 },
    })
  );

  const contactItems = [];
  if (resume.contact_info.email) contactItems.push({ prefix: "Email: ", text: resume.contact_info.email, url: `mailto:${resume.contact_info.email}` });
  if (resume.contact_info.phone) contactItems.push({ prefix: "Phone: ", text: resume.contact_info.phone });
  if (resume.contact_info.location) contactItems.push({ prefix: "Location: ", text: resume.contact_info.location });
  if (resume.contact_info.linkedin_url) contactItems.push({ prefix: "", text: "LinkedIn", url: resume.contact_info.linkedin_url });
  if (resume.contact_info.github_url) contactItems.push({ prefix: "", text: "GitHub", url: resume.contact_info.github_url });

  const contactChildren: any[] = [];
  
  for (let idx = 0; idx < contactItems.length; idx++) {
    const item = contactItems[idx];
    
    // Add text or hyperlink
    if (item.url && item.url !== "null" && item.url.trim() !== "") {
      if (item.prefix) {
        contactChildren.push(new TextRun({ text: item.prefix, size: 20, font: FONT_FAMILY, color: "555555" }));
      }
      contactChildren.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: item.text,
              size: 20,
              font: FONT_FAMILY,
              color: HEADER_COLOR, // colored link
              underline: {},
            }),
          ],
          link: item.url,
        })
      );
    } else {
      contactChildren.push(
        new TextRun({
          text: item.prefix + item.text,
          size: 20,
          font: FONT_FAMILY,
          color: "555555",
        })
      );
    }
    
    // Add separator if not last
    if (idx < contactItems.length - 1) {
      contactChildren.push(
        new TextRun({
          text: "    |    ",
          size: 20,
          font: FONT_FAMILY,
          color: "555555",
        })
      );
    }
  }

  // Contact Info
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: contactChildren,
      spacing: { after: 240 },
    })
  );

  const addSectionHeader = (title: string) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 24, // 12pt
            font: HEADER_FONT,
            color: HEADER_COLOR,
          }),
        ],
        spacing: { before: 240, after: 120 },
        border: {
          bottom: { color: "CCCCCC", space: 1, size: 6, style: "single" },
        },
      })
    );
  };

  // Summary
  if (resume.summary) {
    addSectionHeader("Summary");
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.summary,
            size: FONT_SIZE,
            font: FONT_FAMILY,
          }),
        ],
      })
    );
  }

  // Skills
  if (resume.skills && resume.skills.length > 0) {
    addSectionHeader("Technical Skills");
    resume.skills.forEach((skill) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${skill.category}: `,
              bold: true,
              size: FONT_SIZE,
              font: FONT_FAMILY,
            }),
            new TextRun({
              text: skill.items.join(", "),
              size: FONT_SIZE,
              font: FONT_FAMILY,
            }),
          ],
        })
      );
    });
  }

  // Experience
  if (resume.experience && resume.experience.length > 0) {
    addSectionHeader("Experience");
    resume.experience.forEach((exp) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: exp.title, bold: true, size: FONT_SIZE, font: FONT_FAMILY }),
            new TextRun({ text: `\t${exp.dates}`, bold: true, size: FONT_SIZE, font: FONT_FAMILY }),
          ],
          tabStops: [
            {
              type: "right",
              position: 9000,
            },
          ],
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: exp.company + (exp.location ? `, ${exp.location}` : ""),
              italics: true,
              size: FONT_SIZE,
              font: FONT_FAMILY,
            }),
          ],
        })
      );
      exp.bullets.forEach((bullet) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: bullet,
                size: FONT_SIZE,
                font: FONT_FAMILY,
              }),
            ],
          })
        );
      });
    });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    addSectionHeader("Education");
    resume.education.forEach((edu) => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: edu.degree, bold: true, size: FONT_SIZE, font: FONT_FAMILY }),
            new TextRun({ text: `\t${edu.dates}`, bold: true, size: FONT_SIZE, font: FONT_FAMILY }),
          ],
          tabStops: [
            {
              type: "right",
              position: 9000,
            },
          ],
        })
      );
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: edu.institution + (edu.location ? `, ${edu.location}` : ""),
              italics: true,
              size: FONT_SIZE,
              font: FONT_FAMILY,
            }),
          ],
        })
      );
      if (edu.details && edu.details.length > 0) {
        edu.details.forEach((detail) => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              children: [
                new TextRun({
                  text: detail,
                  size: FONT_SIZE,
                  font: FONT_FAMILY,
                }),
              ],
            })
          );
        });
      }
    });
  }

  // Projects
  if (resume.projects && resume.projects.length > 0) {
    addSectionHeader("Projects");
    resume.projects.forEach((proj) => {
      const runs = [];
      if (proj.url && proj.url !== "null" && proj.url.trim() !== "") {
        runs.push(new ExternalHyperlink({
          children: [new TextRun({ text: proj.name, bold: true, size: FONT_SIZE, font: FONT_FAMILY, color: HEADER_COLOR, underline: {} })],
          link: proj.url
        }));
      } else {
        runs.push(new TextRun({ text: proj.name, bold: true, size: FONT_SIZE, font: FONT_FAMILY }));
      }

      if (proj.technologies && proj.technologies.length > 0) {
        runs.push(new TextRun({ text: ` | ${proj.technologies.join(", ")}`, bold: true, size: FONT_SIZE, font: FONT_FAMILY, color: "555555" }));
      }
      
      if (proj.dates) {
        runs.push(new TextRun({ text: `\t${proj.dates}`, bold: true, size: FONT_SIZE, font: FONT_FAMILY }));
      }
      
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: runs,
          tabStops: [{ type: "right", position: 9000 }],
        })
      );

      proj.bullets.forEach((bullet) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: bullet, size: FONT_SIZE, font: FONT_FAMILY })],
          })
        );
      });
    });
  }

  // Custom Sections
  if (resume.custom_sections && resume.custom_sections.length > 0) {
    resume.custom_sections.forEach((sec) => {
      addSectionHeader(sec.section_title);
      sec.entries.forEach((entry) => {
        const runs = [];
        if (entry.url && entry.url !== "null" && entry.url.trim() !== "") {
          runs.push(new ExternalHyperlink({
            children: [new TextRun({ text: entry.title, bold: true, size: FONT_SIZE, font: FONT_FAMILY, color: HEADER_COLOR, underline: {} })],
            link: entry.url
          }));
        } else {
          runs.push(new TextRun({ text: entry.title, bold: true, size: FONT_SIZE, font: FONT_FAMILY }));
        }

        if (entry.subtitle) {
          runs.push(new TextRun({ text: ` | ${entry.subtitle}`, bold: true, size: FONT_SIZE, font: FONT_FAMILY, color: "555555" }));
        }
        
        if (entry.dates) {
          runs.push(new TextRun({ text: `\t${entry.dates}`, bold: true, size: FONT_SIZE, font: FONT_FAMILY }));
        }
        
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: runs,
            tabStops: [{ type: "right", position: 9000 }],
          })
        );

        if (entry.bullets) {
          entry.bullets.forEach((bullet) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun({ text: bullet, size: FONT_SIZE, font: FONT_FAMILY })],
              })
            );
          });
        }
      });
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function generateCoverLetterDocx(content: string, styleProfile?: StyleProfile | null): Promise<Blob> {
  const FONT_FAMILY = styleProfile?.bodyFont || styleProfile?.headingFont || "Calibri";
  const FONT_SIZE = styleProfile?.bodySize ? styleProfile.bodySize * 2 : 22;

  const paragraphs = content.split(/\n\s*\n/).filter(Boolean).map((block) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: block.trim(),
          size: FONT_SIZE,
          font: FONT_FAMILY,
        }),
      ],
      spacing: { after: 240 }, // 12pt paragraph spacing
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
