import _fs from 'fs';
import path from 'path';
import {marked} from 'marked';
import {GetServerSidePropsContext} from 'next';

import {highlighter} from '../../components/CodeBlock';

import {Section, parseTokens} from '../../util/parseTokens';
import {Spacer} from '../../components/Spacer';

const fs = _fs.promises;

async function readReadme() {
  const docsPath = path.resolve(process.cwd(), '..', '..', 'README.md');
  const docsFile = await fs.readFile(docsPath, {encoding: 'utf-8'});
  const lexed = marked.lexer(docsFile);
  const readme = parseTokens(lexed);
  return readme;
}

// export async function getStaticPaths() {
//   const allPaths = {
//     paths: readme.flat.map((section) => ({
//       params: {path: section ? section.path.split('/') : []},
//     })),
//     fallback: false, // can also be true or 'blocking'
//   };
//   console.log(allPaths.paths.map((p) => p.params.path));
//   return allPaths;
// }

function stripSection(section: Section) {
  return {
    headerRendered: section.headerRendered,
    path: section.path,
    slug: section.slug,
  };
}
export async function getServerSideProps(context: GetServerSidePropsContext) {
  // const pathParam = context.params?.docpath;
  // const path = (
  //   pathParam ? (typeof pathParam === 'string' ? [pathParam] : pathParam) : []
  // ).join('/');
  const readme = await readReadme();

  const path = context.resolvedUrl.slice(6).replace('/manifest.json', '');
  console.log(`/${path}`);
  const section = readme.flat.find((section) => {
    return section.path === path;
  })!;
  const sectionIndex = readme.flat.indexOf(section);
  const prev = readme.flat[sectionIndex - 1];
  const next = readme.flat[sectionIndex + 1];

  if (!section) {
    throw new Error('Nonexistent page');
  }

  const renderer = new marked.Renderer();
  renderer.code = (code, language) => {
    const html = highlighter.codeToHtml(code, {lang: language});
    return `<div class="CodeBlock">${html}</div>`;
  };
  const parser = new marked.Parser({renderer});
  const sectionHtml = parser.parse(section.tokens);
  const titleHtml = marked.parser([section.headerToken]);
  const sections = readme.root.children.map((section) => ({
    ...stripSection(section),
    active: path === section.path,
    expand: path.includes(section.path),
    sections: section.children.map((subsection) => ({
      ...stripSection(subsection),
      active: path === subsection.path,
    })),
  }));

  return {
    // Passed to the page component as props
    props: {sectionHtml, titleHtml, sections, prev, next},
  };
}

export default function (
  props: Awaited<ReturnType<typeof getServerSideProps>>['props']
) {
  return (
    <div className={'docs-page'}>
      <div className="docs-sidebar">
        {props.sections.map((section) => {
          return (
            <div>
              <div
                className={`docs-sidebar-section ${
                  section.active ? 'docs-sidebar-active' : ' '
                } ${section.expand ? 'docs-sidebar-expanded' : ' '}`}
              >
                <a href={`/docs/${section.path}`}>
                  <div
                    dangerouslySetInnerHTML={{__html: section.headerRendered}}
                  ></div>
                </a>
              </div>
              {section.expand
                ? section.sections.map((subsection) => {
                    return (
                      <div
                        className={`docs-sidebar-subsection ${
                          subsection.active ? 'docs-sidebar-active' : ''
                        }`}
                      >
                        <a href={`/docs/${subsection.path}`}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: subsection.headerRendered,
                            }}
                          ></div>
                        </a>
                      </div>
                    );
                  })
                : null}
              {section.expand && section.sections.length ? (
                <div style={{height: '10px'}} />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="docs-spacer"></div>
      <div className="docs-content-wrapper">
        <div dangerouslySetInnerHTML={{__html: props.titleHtml}}></div>
        <div
          className="docs-content"
          dangerouslySetInnerHTML={{__html: props.sectionHtml}}
        ></div>
        <Spacer h="70px" />
        <div className="docs-nav-button-row">
          {props.prev && (
            <a
              className="m-0 leading-none hover:no-underline hover:transform-none hover:bg-neutral-200"
              href={`/docs/${props.prev.slug}`}
            >
              <div className="flex flex-row items-center justify-between w-80 rounded border border-solid border-neutral-300 px-2 py-2">
                <p>←</p>
                <div className="leading-none">
                  <p
                    className="text-xs opacity-50 pb-0.5"
                    style={{textAlign: 'right'}}
                  >
                    Previous
                  </p>
                  <p>{props.prev.headerToken.text}</p>
                </div>
              </div>
            </a>
          )}
          {props.next && (
            <a
              className="m-0 leading-none hover:no-underline hover:transform-none hover:bg-neutral-200"
              href={`/docs/${props.next.slug}`}
            >
              <div className="w-80 rounded border border-solid border-neutral-300 px-2 py-2">
                <p className="text-xs opacity-50 pb-0.5">Next</p>
                <div className="flex flex-row items-center justify-between">
                  <p>{props.next.headerToken.text}</p>
                  <p>→</p>
                </div>
              </div>
            </a>
          )}
        </div>
        <Spacer h="70px" />
      </div>
      <div className="docs-spacer"></div>
    </div>
  );
}
