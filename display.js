import hljs from 'highlight.js/lib/core';
import hljsJavascript from 'highlight.js/lib/languages/javascript';
import hljsDefineGraphQL from 'highlightjs-graphql';
import hljsCss from 'highlight.js/styles/googlecode.css';

import styles from './display.css';

hljs.registerLanguage('javascript', hljsJavascript);
hljsDefineGraphQL(hljs);

// Display items with these titles as inline
const SHORT = ['status', 'statusText', 'duration', 'url'];

/**
 * Prepares the main cypress test visualization container and returns it.
 */
 export const getContainer = styles => {
  const doc = cy.state('document');

  Object.entries(styles || {}).forEach(([ name, contents ]) => {
    const className = `style-${name}`;
    if (!doc.querySelector(`.${className}`)) {
      const style = doc.createElement('style');
      style.classList.add(className);
      style.textContent = contents.toString();
      doc.body.appendChild(style);
    }
  });

  let container = doc.querySelector('.container');
  if (!container) {
    container = doc.createElement('div');
    container.classList.add('container');
    doc.body.appendChild(container);
  }

  // Clear the container from cypress's default stuff.
  container.innerHTML = '';

  return container;
};

/**
 * Creates an element within the iframe's document and returns it.
 */
export const createElement = ({ children, classNames, element, parentNode, textContent }) => {
  const doc = cy.state('document');

  const node = doc.createElement(element || 'div');

  (classNames || []).forEach(className => {
    if (className) {
      node.classList.add(className);
    }
  });

  if (parentNode) {
    parentNode.appendChild(node);
  }

  if (textContent) {
    node.textContent = textContent;
  }

  (children || []).forEach(child => {
    node.appendChild(createElement(child));
  });

  return node;
};

export const getHelpers = () => {
  /**
   * Creates a wrapper elemement
   */
  const wrapper = createElement({ classNames: [ 'cypress-rest-graphql' ] });

  /**
    * Renders an item for display
    * 
    * @param {Object} item single item, in the rest-graphql format
    */
  const displayItem = item => {
    const container = createElement({
      classNames: [
        'item',
        SHORT.includes(item[0]) && 'short',
      ],
      parentNode: wrapper,
    });
  
    const title = createElement({
      classNames: [ 'title' ],
      parentNode: container,
      textContent: item[0],
    });
  
    const pre = createElement({
      element: 'pre',
      parentNode: container,
    });
  
    if (item[0] === 'query') {
      const code = createElement({
        classNames: [ 'graphQL' ],
        element: 'code',
        parentNode: pre,
        textContent: item[1],
      });
  
      hljs.highlightBlock(code);
    }
    else if (!item[1]) {
      createElement({
        element: 'code',
        parentNode: pre,
        textContent: '---',
      });
    }
    else if (typeof item[1] === 'object') {
      const code = createElement({
        classNames: [ 'json' ],
        element: 'code',
        parentNode: pre,
        textContent: JSON.stringify(item[1], null, 2),
      });
  
      hljs.highlightBlock(code);
    }
    else {
      pre.textContent = item[1];
    }
  };

  return { displayItem, wrapper };
}


/**
 * Pushes current request data to the Cypress UI pane, for easy review
 * @param  {Object} resp - Object containing response data from the query
 * @param  {String} type - String to display at the top
 */
export const display = (resp, type) => {
  const container = getContainer({
    main: styles,
    hljs: hljsCss,
  });

  const {displayItem, wrapper} = getHelpers();

  const { url, title, duration, statusText, status, ...data } = resp;

  // Setting graphQL header
  createElement({
    classNames: [ 'header' ],
    parentNode: wrapper,

    children: [
      { element: 'h1', textContent: type },
      { element: 'h2', textContent: title },
      {
        classNames: [ 'duration-response' ],
        children: [
          {
            classNames: [ 'duration' ],
            element: 'span',
            textContent: `${duration} ms`,
          },
          {
            classNames: [ 'statusText', statusText ],
            element: 'span',
            textContent: statusText,
          },
        ]
      },
    ],
  });

  // Setting graphQL specific values at the top
  displayItem([ 'statusText', statusText ]);
  displayItem([ 'duration', duration + ' ms' ]);
  if (url) displayItem([ 'url', url ]);
  displayItem([ 'status', status ]);
  
  // Processing additional entries
  Object.entries(data).forEach((item) => {
    displayItem(item);
  });

  container.appendChild(wrapper);
};

export const displayRest = (resp) => display(resp, 'REST');
export const displayGraphQL = (resp) => display(resp, 'GraphQL');
