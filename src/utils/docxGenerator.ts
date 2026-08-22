import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export interface StyleProfile {
  headingColor?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
  bodySize?: number | null;
}

export interface StructuredResume {
  name: string;
  contact_info: string[];
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
    technologies?: string[];
    dates?: string;
    bullets: string[];
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

  // Contact Info
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: resume.contact_info.join(" | "),
          size: 20, // 10pt
          font: FONT_FAMILY,
          color: "555555",
        }),
      ],
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
      let titleText = proj.name;
      if (proj.technologies && proj.technologies.length > 0) {
        titleText += ` | ${proj.technologies.join(", ")}`;
      }
      
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: titleText, bold: true, size: FONT_SIZE, font: FONT_FAMILY }),
            ...(proj.dates ? [new TextRun({ text: `\t${proj.dates}`, bold: true, size: FONT_SIZE, font: FONT_FAMILY })] : []),
          ],
          tabStops: [
            {
              type: "right",
              position: 9000,
            },
          ],
        })
      );

      proj.bullets.forEach((bullet) => {
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

  const paragraphs = content.split("\n").map((line) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          size: FONT_SIZE,
          font: FONT_FAMILY,
        }),
      ],
      spacing: { after: 120 },
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
