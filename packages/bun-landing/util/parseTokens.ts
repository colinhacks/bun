import {marked} from 'marked';

export type Section = {
  headerToken: marked.Tokens.Heading;
  headerRendered: string;
  tokens: marked.TokensList;
  children: Section[];
  slug: string;
  path: string;
};
export function parseTokens(tokens: marked.TokensList) {
  const slugger = new marked.Slugger();
  const rootHeader = {
    depth: 0,
    raw: '# Bun',
    text: 'bun',
    tokens: [],
    type: 'heading',
  };
  const rootSection: Section = {
    headerToken: {
      depth: 0,
      raw: '# Bun',
      text: 'bun',
      tokens: [],
      type: 'heading',
    },
    headerRendered: marked.parser(tokens.slice(0, 1), {headerIds: false}),
    tokens: [] as any,
    children: [],
    slug: 'bun',
    path: '',
  };
  let section: Section | null = null;
  let subsection: Section | null = null;
  const flat: Section[] = [];
  flat.push(rootSection);
  for (const token of tokens.slice(1)) {
    if (token.type === 'heading') {
      if (token.depth === 2) {
        token.depth = 1; // rewrite depth
        if (section) {
          if (subsection) {
            section.children.push(subsection);
            subsection = null;
          }
          rootSection.children.push(section);
        }
        const slug = slugger.slug(token.text);
        section = {
          headerToken: token,
          headerRendered: marked.parser([token], {headerIds: false}),
          tokens: [] as any,
          children: [],
          slug: slug,
          path: slug,
        };
        flat.push(section);
        continue;
      } else if (token.depth === 3) {
        token.depth = 1; // rewrite depth
        if (!section) {
          throw 'Invalid Markdown hierarchy: h3 without leading h2.';
        }
        if (subsection) {
          section.children.push(subsection);
        }
        const slug = slugger.slug(token.text);
        subsection = {
          headerToken: token,
          headerRendered: marked.parser([token], {headerIds: false}),
          tokens: [] as any,
          children: [],
          slug: slug,
          path: `${section!.slug}/${slug}`,
        };
        flat.push(subsection);
        continue;
      }
    }
    // rewrite depths
    if (token.type === 'heading') {
      if (subsection) {
        token.depth = token.depth - 2;
      } else if (section) {
        token.depth = token.depth - 1;
      }
    }
    const currSection = subsection ?? section ?? rootSection;
    currSection.tokens.push(token);
  }
  if (subsection) section?.children.push(subsection);
  if (section) rootSection.children.push(section);

  // console.log(rootSection.headerToken.text);
  // console.log(rootSection.children.length);
  for (const section of rootSection.children) {
    // console.log(`- ${sub.slug}: ${sub.tokens.length}`);
    for (const subsection of section.children) {
      // console.log(`  - ${subsub.slug}: ${subsub.tokens.length}`);
    }
  }
  return {root: rootSection, flat};
}
