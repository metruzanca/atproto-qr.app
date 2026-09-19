import { onMount, type JSX } from 'solid-js';
import { Route, Router } from '@solidjs/router';

import { initAuth } from './lib/atproto/auth';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import Home from './pages/Home';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Mine from './pages/Mine';
import QRPublic from './pages/QRPublic';
import Editor from './pages/Editor';
import About from './pages/About';
import Settings from './pages/Settings';
import Lexicons from './pages/Lexicons';

function Root(props: { children?: JSX.Element }) {
  return (
    <div class="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <div class="flex-1">{props.children}</div>
      <ToastContainer />
      <footer class="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div class="mx-auto max-w-6xl space-y-2 px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <p>
            Your QR codes are stored on your own Bluesky account — we can't edit, hide, or delete them.
          </p>
          <p class="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>
              Open source · MIT licensed ·{' '}
              <a
                href="https://github.com/metruzanca/atproto-qr.app"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sky-600 hover:underline"
              >
                GitHub
              </a>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Created by{' '}
              <a
                href="https://bsky.app/metru.dev"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sky-600 hover:underline"
              >
                Sam Zanca
              </a>{' '}
              ·{' '}
              <a
                href="https://zanca.dev"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sky-600 hover:underline"
              >
                zanca.dev
              </a>
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

const App = () => {
  onMount(() => {
    void initAuth();
  });

  return (
    <Router root={Root}>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/oauth/callback" component={Callback} />
      <Route path="/codes" component={Mine} />
      <Route path="/about" component={About} />
      <Route path="/lexicons" component={Lexicons} />
      <Route path="/settings" component={Settings} />
      <Route path="/:handle/:id" component={QRPublic} />
      <Route path="/:handle/:id/edit" component={Editor} />
    </Router>
  );
};

export default App;