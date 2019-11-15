import React from 'react';
import { Router } from 'react-router-dom';
import { createHashHistory } from 'history';
import { sleep } from 'timing-functions';

import Root from '../Root';
// It is used to check if the user has the reduced motion setting active
import reducedMotion from '../utils/reduced-motion';
// These keyframes are used for an animate()
// An image opacity is iterated between 0 (invisible) and 1 (visible)
const KEYFRAMES = {
  opacity: [1, 0],
};

// Same image vertical position is iterated between 0 and 50 pixels
// This is only set when user has not activated the reduced motion option from the navigator
if (!reducedMotion()) {
  KEYFRAMES.transform = ['translateY(0)', 'translateY(50px)'];
}

// NO ENTIENDO QUE ES EL HISTORY NI PARA QUE SE HACE ESTO. LA DOCUMENTACIÓN ES ESCASA
// Hijack a bit the block/userConfirm logic in the history library
const history = createHashHistory({
  // we don't really ask for the user confirmation...
  async getUserConfirmation(nextPathname, callback) {
    // if new path
    if (nextPathname !== history.location.pathname) {
      // get all current sections
      const sections = Array.from(
        document.querySelectorAll('main section'),
      ).reverse();
      sections.forEach((section, index) => {
        if (!section.animate) return;
        // and trigger animation out
        section.animate(KEYFRAMES, {
          fill: 'both',
          easing: 'cubic-bezier(.33,-0.65,.56,1.1)',
          duration: 500,
          delay: Math.min(250, index * 100),
        });
      });
      // if there were sections, wait a bit to let go away
      if (sections.length) await sleep(500);
    }
    callback(true);
  },
});

// Will call getUserConfirmation everytime location changes
history.block(nextLocation => nextLocation.pathname);

// end of hacky part with the history library

// Go to the Root script, where there is a switch/route section with all pages
const App = () => (
  <Router history={history}>
    <Root />
  </Router>
);

export default App;
